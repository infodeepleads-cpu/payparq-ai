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
import '../features/management/repositories/parking_repository.dart';

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
  late String _currentTempId;

  final TextRecognizer _textRecognizer = TextRecognizer();
  bool _canProcess = true;
  bool _isBusy = false;

  // Frame averaging & Regex
  final List<String> _consecutiveHits = [];
  final RegExp _plateRegex = RegExp(r'^[A-Z0-9]{4,8}$'); // Basic LPR regex

  @override
  void initState() {
    super.initState();
    _currentTempId =
        'LPR-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
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
          // For Web, we can implement a periodic Plate Scan check since startImageStream is missing
          _startWebLPRTimer();
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

  Timer? _webLPRTimer;

  void _startWebLPRTimer() {
    _webLPRTimer?.cancel();
    _webLPRTimer =
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
        // Silent catch for web Plate Scan unsupported
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
      debugPrint("LPR Error: $e");
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

      // On Web, Plate Scan is not supported, so we should fail gracefully
      if (kIsWeb) {
        throw Exception("LPR NOT SUPPORTED ON WEB");
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

    // 1. Initial Local State Update
    setState(() {
      _isScanning = false;
      _detectedPlate = plate;
      _statusMessage = "SEARCHING DASHBOARD...";
      _statusColor = Colors.yellowAccent;
      _showValidationPulse = true;
    });

    // 2. Perform Dashboard Search
    try {
      final sessions = ref.read(sessionsStreamProvider).value ?? [];
      final permits = ref.read(permitsStreamProvider).value ?? [];
      final violations = ref.read(violationsStreamProvider).value ?? [];

      final activeSession = sessions.firstWhere(
        (s) => s['plate']?.toString().toUpperCase() == plate.toUpperCase(),
        orElse: () => {},
      );

      final activePermit = permits.firstWhere(
        (p) => p['plate']?.toString().toUpperCase() == plate.toUpperCase(),
        orElse: () => {},
      );

      final recentViolation = violations.firstWhere(
        (v) => v['plate']?.toString().toUpperCase() == plate.toUpperCase(),
        orElse: () => {},
      );

      if (activeSession.isNotEmpty) {
        setState(() {
          _statusMessage = "ACTIVE SESSION FOUND";
          _statusColor = Colors.greenAccent;
        });
      } else if (activePermit.isNotEmpty) {
        setState(() {
          _statusMessage = "VALID PERMIT FOUND";
          _statusColor = Colors.greenAccent;
        });
      } else if (recentViolation.isNotEmpty) {
        setState(() {
          _statusMessage =
              "RECENT VIOLATION: ${recentViolation['violation_type']}";
          _statusColor = Colors.orangeAccent;
        });
      } else {
        setState(() {
          _statusMessage = "NO ACTIVE RECORD";
          _statusColor = Colors.redAccent;
        });
      }
    } catch (e) {
      debugPrint("Dashboard Search Error: $e");
      setState(() {
        _statusMessage = "CONFIRMED (LOCAL)";
        _statusColor = Colors.greenAccent;
      });
    }

    // Vibrate for high-end UX
    if (await Vibration.hasVibrator() ?? false) {
      Vibration.vibrate(duration: 200);
    }

    // Auto-trigger validation pulse effect
    await Future.delayed(const Duration(seconds: 3));
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
    // Watch streams to keep them active and cached for fast LPR search
    ref.watch(sessionsStreamProvider);
    ref.watch(permitsStreamProvider);
    ref.watch(violationsStreamProvider);

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

          // Full Screen Validation Feedback Overlay
          Positioned.fill(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              color: _showValidationPulse ? _statusColor : Colors.transparent,
            ),
          ),

          // Tactical HUD Overlay
          Positioned.fill(
            child: CustomPaint(
              painter: TacticalHudPainter(
                borderColor: _statusColor,
                isScanning: _isScanning,
              ),
            ),
          ),

          // 1. Tactical Command Center (Top Indicator Screen)
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _statusColor.withOpacity(0.3),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _statusColor.withOpacity(0.1),
                    blurRadius: 10,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildStatusBadge("SYSTEM ACTIVE", Colors.blueAccent),
                      _buildStatusBadge("LPR READY", Colors.greenAccent),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _statusMessage,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _statusColor,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      letterSpacing: 2.5,
                      fontFamily: 'Courier',
                      shadows: [
                        Shadow(
                          blurRadius: 8.0,
                          color: Colors.black.withOpacity(0.8),
                          offset: const Offset(1.0, 1.0),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. Docked Plate Display (In the tray)
          Positioned(
            top: MediaQuery.of(context).size.height * 0.55,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: MediaQuery.of(context).size.width * 0.7,
                height: 35,
                alignment: Alignment.center,
                child: Text(
                  _detectedPlate ?? "no plate",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 2,
                    fontFamily: 'Courier',
                    color: Colors.white
                        .withOpacity(_detectedPlate == null ? 0.3 : 1.0),
                  ),
                ),
              ),
            ),
          ),

          // 3. Action Circles (Exactly 1 cm / ~38px from scanner frame)
          Positioned(
            top: MediaQuery.of(context).size.height * 0.55 + 38,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildActionButton(
                  icon: Icons.warning_amber_rounded,
                  label: "WARNING",
                  color: Colors.orangeAccent,
                  onTap: () => _handleQuickAction(isWarning: true),
                ),
                const SizedBox(width: 30),
                _buildActionButton(
                  icon: Icons.receipt_long,
                  label: "TICKET",
                  color: Colors.redAccent,
                  isPrimary: true,
                  onTap: () => _handleQuickAction(isWarning: false),
                ),
                const SizedBox(width: 30),
                _buildActionButton(
                  icon: Icons.check_circle_outline,
                  label: "VALIDATE",
                  color: Colors.greenAccent,
                  onTap: () async {
                    if (!_isScanning) {
                      setState(() {
                        _isScanning = true;
                        _detectedPlate = null;
                        _statusMessage = "SCANNING...";
                        _statusColor = Colors.white;
                        _showValidationPulse = false;
                        _consecutiveHits.clear();
                      });
                    } else {
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

    final locationDisplayId =
        ref.read(selectedLocationIdProvider) ?? profile['location_id'];

    if (locationDisplayId == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Error: No Location ID selected or assigned.')),
        );
      }
      return;
    }

    // Use the centralized UUID resolver
    final locUuid = await ref.read(selectedLocationUuidProvider.future);
    final supabase = Supabase.instance.client;

    if (locUuid == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error: Invalid Location selected.')),
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

      // Use detected plate if available, otherwise fallback to temporary ID
      final plate = _detectedPlate ?? _currentTempId;
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$plate.jpg';

      final bytes = await image.readAsBytes();
      await supabase.storage.from('evidence').uploadBinary(
            fileName,
            bytes,
            fileOptions: const FileOptions(contentType: 'image/jpeg'),
          );

      // Log to 'violations' table (formerly 'cases')
      await supabase.from('violations').insert({
        'plate': plate,
        'violation_type': isWarning ? 'Quick Warning' : 'Quick Ticket',
        'fine_amount': isWarning ? 0.00 : 50.00,
        'status': isWarning ? 'warning' : 'issued',
        'location_id': locUuid,
        'is_lpr_scan': true,
        'evidence_r2_url': fileName, // Use the correct column name from schema
        'issued_at': DateTime.now().toIso8601String(),
      }).select();

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
  final bool isScanning;

  TacticalHudPainter({required this.borderColor, this.isScanning = true});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = borderColor.withOpacity(0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;

    final w = size.width;
    final h = size.height;

    // ROI Box (Unified Tactical Frame)
    final roiWidth = w * 0.7;
    final roiHeight = h * 0.3;
    final roiRect = Rect.fromCenter(
      center: Offset(w / 2, h * 0.4),
      width: roiWidth,
      height: roiHeight,
    );

    final cornerSize = 40.0;

    // 1. Draw Docked Data Tray (The "Instrument" look)
    final trayPaint = Paint()
      ..color = Colors.black.withOpacity(0.5)
      ..style = PaintingStyle.fill;

    final trayRect = Rect.fromLTWH(
      roiRect.left,
      roiRect.bottom,
      roiRect.width,
      35,
    );
    canvas.drawRRect(
        RRect.fromRectAndCorners(trayRect,
            bottomLeft: const Radius.circular(8),
            bottomRight: const Radius.circular(8)),
        trayPaint);

    // 2. Draw Frame Corners
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

    // Bottom Left (Extended for tray)
    canvas.drawLine(
        roiRect.bottomLeft, roiRect.bottomLeft + Offset(cornerSize, 0), paint);
    canvas.drawLine(
        roiRect.bottomLeft, roiRect.bottomLeft + Offset(0, -cornerSize), paint);

    // Bottom Right (Extended for tray)
    canvas.drawLine(roiRect.bottomRight,
        roiRect.bottomRight + Offset(-cornerSize, 0), paint);
    canvas.drawLine(roiRect.bottomRight,
        roiRect.bottomRight + Offset(0, -cornerSize), paint);

    // 3. Draw Side Brackets (Industry look)
    final bracketPaint = Paint()
      ..color = borderColor.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    canvas.drawLine(roiRect.topLeft + Offset(0, cornerSize),
        roiRect.bottomLeft - Offset(0, 0), bracketPaint);
    canvas.drawLine(roiRect.topRight + Offset(0, cornerSize),
        roiRect.bottomRight - Offset(0, 0), bracketPaint);

    // 4. Scanning Laser Beam (Only if scanning)
    if (isScanning) {
      final scanPaint = Paint()
        ..color = borderColor.withOpacity(0.4)
        ..strokeWidth = 1.5;

      // Animate this with a timer/state in a real app,
      // for now we draw a subtle reference line
      canvas.drawLine(
        Offset(roiRect.left + 10, roiRect.top + roiRect.height * 0.5),
        Offset(roiRect.right - 10, roiRect.top + roiRect.height * 0.5),
        scanPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant TacticalHudPainter oldDelegate) {
    return oldDelegate.borderColor != borderColor ||
        oldDelegate.isScanning != isScanning;
  }
}
