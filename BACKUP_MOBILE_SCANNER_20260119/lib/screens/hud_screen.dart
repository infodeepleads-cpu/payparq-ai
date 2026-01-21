import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:vibration/vibration.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import '../logic/providers/auth_providers.dart';

class HudScreen extends ConsumerStatefulWidget {
  const HudScreen({super.key});

  @override
  ConsumerState<HudScreen> createState() => _HudScreenState();
}

class _HudScreenState extends ConsumerState<HudScreen> {
  CameraController? _controller;
  bool _isCameraInitialized = false;
  bool _isScanning = true;
  String? _detectedPlate;
  String _statusMessage = "SCANNING...";
  Color _statusColor = Colors.white;
  bool _isProcessing = false;
  bool _showValidationPulse = false;

  final TextRecognizer _textRecognizer = TextRecognizer();
  bool _canProcess = true;
  bool _isBusy = false;

  // Frame averaging & Regex
  final List<String> _consecutiveHits = [];
  final RegExp _plateRegex = RegExp(r'^[A-Z0-9]{4,8}$'); // Basic LPR regex

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() {
          _statusMessage = "NO CAMERAS FOUND";
        });
        return;
      }

      CameraDescription? selected;
      // On Web, we want to prioritize the environment/back camera specifically
      if (kIsWeb) {
        for (final cam in cameras) {
          final name = cam.name.toLowerCase();
          final label = cam.lensDirection.toString().toLowerCase();
          if (name.contains('back') ||
              name.contains('environment') ||
              name.contains('rear') ||
              label.contains('back') ||
              label.contains('external')) {
            selected = cam;
            debugPrint("Selected Web Back Camera: ${cam.name}");
            break;
          }
        }
      }

      if (selected == null) {
        // Normal prioritization for mobile or if web specific search failed
        for (final cam in cameras) {
          final name = cam.name.toLowerCase();
          if (cam.lensDirection == CameraLensDirection.back ||
              name.contains('back') ||
              name.contains('environment') ||
              name.contains('rear')) {
            selected = cam;
            break;
          }
        }
      }

      // Fallback to any camera if back not found
      selected ??= cameras.first;

      _controller = CameraController(
        selected,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup:
            kIsWeb ? null : (Platform.isAndroid ? ImageFormatGroup.nv21 : null),
      );

      await _controller!.initialize();

      if (!mounted) return;

      try {
        if (!kIsWeb) {
          _controller!.startImageStream(_processCameraImage);
        } else {
          // For Web, we can implement a periodic OCR check since startImageStream is missing
          _startWebOCRTimer();
        }
      } catch (e) {
        debugPrint("Stream Error: $e");
      }

      setState(() {
        _isCameraInitialized = true;
      });
    } catch (e) {
      debugPrint("Camera Init Error: $e");
      setState(() {
        _statusMessage = "CAMERA ERROR: $e";
      });
    }
  }

  Timer? _webOCRTimer;

  void _startWebOCRTimer() {
    _webOCRTimer?.cancel();
    _webOCRTimer =
        Timer.periodic(const Duration(milliseconds: 1500), (timer) async {
      if (!_isScanning ||
          _isBusy ||
          !mounted ||
          _controller == null ||
          !_controller!.value.isInitialized) return;

      try {
        _isBusy = true;
        final image = await _controller!.takePicture();
        final inputImage = InputImage.fromFilePath(image.path);

        final recognizedText = await _textRecognizer.processImage(inputImage);
        _analyzeRecognizedText(
            recognizedText, 1000, 1000); // Approximate scale for web
      } catch (e) {
        // Silent catch for web OCR unsupported
      } finally {
        _isBusy = false;
      }
    });
  }

  void _analyzeRecognizedText(
      RecognizedText recognizedText, double width, double height) {
    String? foundPlate;

    for (TextBlock block in recognizedText.blocks) {
      for (TextLine line in block.lines) {
        // Clean text: remove spaces, special chars, and convert to upper
        final text =
            line.text.replaceAll(RegExp(r'[^A-Z0-9]'), '').toUpperCase();

        final rect = line.boundingBox;
        // The ROI is centered: 60% width, 40% height.
        // normalized coordinates: center is (0.5, 0.5)
        // horizontal range: 0.5 - 0.3 = 0.2 to 0.5 + 0.3 = 0.8
        // vertical range: 0.5 - 0.2 = 0.3 to 0.5 + 0.2 = 0.7
        final centerX = rect.center.dx / width;
        final centerY = rect.center.dy / height;

        // Loosen ROI slightly for better detection (0.15 to 0.85 horizontally, 0.2 to 0.8 vertically)
        if (centerX > 0.15 &&
            centerX < 0.85 &&
            centerY > 0.2 &&
            centerY < 0.8) {
          // Accept 4-10 characters for wider plate compatibility
          if (RegExp(r'^[A-Z0-9]{4,10}$').hasMatch(text)) {
            foundPlate = text;
            break;
          }
        }
      }
      if (foundPlate != null) break;
    }

    if (foundPlate != null) {
      _consecutiveHits.add(foundPlate);
      // Require 2 identical hits instead of 3 for faster scanning in real world
      if (_consecutiveHits.length > 2) _consecutiveHits.removeAt(0);

      if (_consecutiveHits.length == 2 &&
          _consecutiveHits.every((e) => e == foundPlate)) {
        _confirmPlate(foundPlate);
      }
    } else {
      // Don't clear immediately, allows for slight flicker
      if (_consecutiveHits.isNotEmpty) {
        // Just clear if we haven't seen anything for a few frames
        // In this stream-based approach, clearing on every 'null' might be too aggressive
        _consecutiveHits.clear();
      }
    }
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_isBusy || !_isScanning || !mounted) return;
    await _processImage(image);
  }

  Future<void> _processImage(CameraImage image) async {
    _isBusy = true;

    final WriteBuffer allBytes = WriteBuffer();
    for (final Plane plane in image.planes) {
      allBytes.putUint8List(plane.bytes);
    }
    final bytes = allBytes.done().buffer.asUint8List();

    final Size imageSize =
        Size(image.width.toDouble(), image.height.toDouble());
    final camera = _controller!.description;

    // Handle rotation safely
    final sensorOrientation = camera.sensorOrientation;
    final imageRotation =
        InputImageRotationValue.fromRawValue(sensorOrientation) ??
            InputImageRotation.rotation0deg;

    final inputImageFormat =
        InputImageFormatValue.fromRawValue(image.format.raw) ??
            InputImageFormat.nv21;

    final metadata = InputImageMetadata(
      size: imageSize,
      rotation: imageRotation,
      format: inputImageFormat,
      bytesPerRow: image.planes[0].bytesPerRow,
    );

    final inputImage = InputImage.fromBytes(bytes: bytes, metadata: metadata);

    try {
      final recognizedText = await _textRecognizer.processImage(inputImage);
      _analyzeRecognizedText(
          recognizedText, image.width.toDouble(), image.height.toDouble());
    } catch (e) {
      debugPrint("OCR Error: $e");
      // Don't update UI here as this runs every frame
    } finally {
      _isBusy = false;
    }
  }

  Future<void> _triggerManualValidation() async {
    if (_isBusy || _controller == null || !_controller!.value.isInitialized)
      return;

    try {
      _isBusy = true;
      setState(() {
        _statusMessage = "MANUAL SCAN...";
        _statusColor = Colors.yellowAccent;
      });

      // On Web, ML Kit is not supported, so we should fail gracefully
      if (kIsWeb) {
        throw Exception("OCR NOT SUPPORTED ON WEB");
      }

      final image = await _controller!.takePicture().timeout(
            const Duration(seconds: 5),
            onTimeout: () => throw TimeoutException("Camera capture timed out"),
          );

      final inputImage = InputImage.fromFilePath(image.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);

      String? foundPlate;
      for (TextBlock block in recognizedText.blocks) {
        for (TextLine line in block.lines) {
          final text =
              line.text.replaceAll(RegExp(r'[^A-Z0-9]'), '').toUpperCase();
          if (text.length >= 4 && text.length <= 10) {
            foundPlate = text;
            break;
          }
        }
        if (foundPlate != null) break;
      }

      if (foundPlate != null) {
        _confirmPlate(foundPlate);
      } else {
        setState(() {
          _statusMessage = "NO PLATE DETECTED";
          _statusColor = Colors.orange;
        });
        await Future.delayed(const Duration(seconds: 2));
      }
    } catch (e) {
      debugPrint("Manual Validation Error: $e");
      setState(() {
        _statusMessage = kIsWeb ? "USE MOBILE FOR SCAN" : "SCAN ERROR";
        _statusColor = Colors.redAccent;
      });
      await Future.delayed(const Duration(seconds: 2));
    } finally {
      _isBusy = false;
      if (mounted && _isScanning) {
        setState(() {
          _statusMessage = "SCANNING...";
          _statusColor = Colors.white;
        });
      }
    }
  }

  void _confirmPlate(String plate) async {
    if (!_isScanning) return;

    setState(() {
      _isScanning = false; // Freeze UI
      _detectedPlate = plate;
      _statusMessage = "CONFIRMED";
      _statusColor = Colors.greenAccent;
      _showValidationPulse = true;
    });

    // Vibrate for high-end UX
    if (await Vibration.hasVibrator() ?? false) {
      Vibration.vibrate(duration: 200);
    }

    // Auto-trigger validation pulse effect
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      setState(() {
        _showValidationPulse = false;
      });
    }
  }

  @override
  void dispose() {
    _canProcess = false;
    _textRecognizer.close();
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isCameraInitialized) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // Camera Feed
          Positioned.fill(
            child: CameraPreview(_controller!),
          ),

          // Tactical HUD Overlay
          Positioned.fill(
            child: CustomPaint(
              painter: TacticalHudPainter(
                borderColor: _statusColor,
              ),
            ),
          ),

          // Top Status Bar
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatusBadge("LPR ACTIVE", Colors.green),
                _buildStatusBadge("ZONE: A-12", Colors.blue),
              ],
            ),
          ),

          // Center Reticle & Plate Display
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedScale(
                  scale: _showValidationPulse ? 1.05 : 1.0,
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeInOut,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      border: Border.all(color: _statusColor, width: 2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _detectedPlate ?? "NO PLATE",
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 4,
                        fontFamily: 'Courier',
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  _statusMessage,
                  style: TextStyle(
                    color: _statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    backgroundColor: Colors.black54,
                  ),
                ),
              ],
            ),
          ),

          // Bottom Action Hub
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildActionButton(
                  icon: Icons.warning_amber_rounded,
                  label: "WARNING",
                  color: Colors.orange,
                  onTap: () => _handleQuickAction(isWarning: true),
                ),
                _buildActionButton(
                  icon: Icons.receipt_long,
                  label: "TICKET",
                  color: Colors.red,
                  isPrimary: true,
                  onTap: () => _handleQuickAction(isWarning: false),
                ),
                _buildActionButton(
                  icon: Icons.check_circle_outline,
                  label: _isScanning ? "VALIDATE" : "RESUME",
                  color: Colors.green,
                  onTap: () async {
                    if (!_isScanning) {
                      setState(() {
                        _isScanning = true;
                        _detectedPlate = null;
                        _statusMessage = "SCANNING...";
                        _statusColor = Colors.white;
                        _consecutiveHits.clear();
                      });
                    } else {
                      // Manual validation trigger
                      _triggerManualValidation();
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        border: Border.all(color: color),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
    bool isPrimary = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: EdgeInsets.all(isPrimary ? 24 : 16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(color: color, width: 2),
              boxShadow: isPrimary
                  ? [
                      BoxShadow(
                        color: color.withOpacity(0.5),
                        blurRadius: 15,
                        spreadRadius: 2,
                      )
                    ]
                  : [],
            ),
            child: Icon(
              icon,
              color: color,
              size: isPrimary ? 40 : 28,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleQuickAction({required bool isWarning}) async {
    if (_isProcessing) return;
    final profile = ref.read(userProfileProvider).value;
    if (profile == null) return;

    final locationId =
        ref.read(selectedLocationIdProvider) ?? profile['location_id'];

    if (locationId == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Error: No Location ID selected or assigned.')),
        );
      }
      return;
    }

    if (!_isCameraInitialized || _controller == null) return;
    if (_controller!.value.isTakingPicture) return;

    try {
      setState(() {
        _isProcessing = true;
        _statusMessage = isWarning ? "ISSUING WARNING..." : "ISSUING TICKET...";
        _statusColor = isWarning ? Colors.orange : Colors.red;
      });

      final image = await _controller!.takePicture();

      final supabase = Supabase.instance.client;
      // Use detected plate if available, otherwise fallback to temporary ID
      final plate = _detectedPlate ??
          'LPR-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$plate.jpg';

      final bytes = await image.readAsBytes();
      await supabase.storage.from('evidence').uploadBinary(
            fileName,
            bytes,
            fileOptions: const FileOptions(contentType: 'image/jpeg'),
          );

      // Log to 'cases' table as requested
      await supabase.from('cases').insert({
        'plate': plate,
        'violation_type': isWarning ? 'Quick Warning' : 'Quick Ticket',
        'fine_amount': isWarning ? 0.00 : 50.00,
        'status': isWarning ? 'warning' : 'issued',
        'location_id': locationId,
        'is_lpr_scan': true,
        'evidence_url': fileName,
        'created_at': DateTime.now().toIso8601String(),
      });

      if (mounted) {
        setState(() {
          _detectedPlate = plate;
          _statusMessage = "VALIDATED";
          _statusColor = Colors.greenAccent;
          _showValidationPulse = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isWarning ? 'Warning Issued!' : 'Ticket Issued!'),
            backgroundColor: isWarning ? Colors.orange : Colors.red,
          ),
        );
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          setState(() {
            _showValidationPulse = false;
            _statusMessage = "SCANNING...";
            _statusColor = Colors.white;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }
}

class TacticalHudPainter extends CustomPainter {
  final Color borderColor;

  TacticalHudPainter({required this.borderColor});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = borderColor.withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final w = size.width;
    final h = size.height;

    // ROI Box (Middle of screen)
    final roiWidth = w * 0.6;
    final roiHeight = h * 0.4;
    final roiRect = Rect.fromCenter(
      center: Offset(w / 2, h / 2),
      width: roiWidth,
      height: roiHeight,
    );

    final cornerSize = 30.0;

    // Draw corners of the ROI box
    // Top Left
    canvas.drawLine(
        roiRect.topLeft, roiRect.topLeft + Offset(cornerSize, 0), paint);
    canvas.drawLine(
        roiRect.topLeft, roiRect.topLeft + Offset(0, cornerSize), paint);

    // Top Right
    canvas.drawLine(
        roiRect.topRight, roiRect.topRight + Offset(-cornerSize, 0), paint);
    canvas.drawLine(
        roiRect.topRight, roiRect.topRight + Offset(0, cornerSize), paint);

    // Bottom Left
    canvas.drawLine(
        roiRect.bottomLeft, roiRect.bottomLeft + Offset(cornerSize, 0), paint);
    canvas.drawLine(
        roiRect.bottomLeft, roiRect.bottomLeft + Offset(0, -cornerSize), paint);

    // Bottom Right
    canvas.drawLine(roiRect.bottomRight,
        roiRect.bottomRight + Offset(-cornerSize, 0), paint);
    canvas.drawLine(roiRect.bottomRight,
        roiRect.bottomRight + Offset(0, -cornerSize), paint);

    // Crosshair
    final centerPaint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    canvas.drawLine(
        Offset(w / 2 - 20, h / 2), Offset(w / 2 + 20, h / 2), centerPaint);
    canvas.drawLine(
        Offset(w / 2, h / 2 - 20), Offset(w / 2, h / 2 + 20), centerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return false;
  }
}
