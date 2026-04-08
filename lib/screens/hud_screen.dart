import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb;
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:vibration/vibration.dart';
import 'package:flutter/services.dart';
import '../logic/providers/auth_providers.dart';
import '../features/management/repositories/parking_repository.dart';
import '../logic/providers/locale_provider.dart';
import '../logic/utils/location_resolver.dart';
import '../features/enforcement/providers/enforcement_controller.dart';
import '../services/error_mapper.dart';
import '../services/performance_monitor.dart';
import '../utils/async_action_handler.dart';

class HudScreen extends ConsumerStatefulWidget {
  const HudScreen({super.key});

  @override
  ConsumerState<HudScreen> createState() => _HudScreenState();
}

class _HudScreenState extends ConsumerState<HudScreen>
    with WidgetsBindingObserver {
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
  bool _isBusy = false;
  bool _isAppActive = true;
  DateTime? _lastProcessAt;
  final Duration _processCooldown = const Duration(milliseconds: 220);
  final List<ProviderSubscription<dynamic>> _streamSubs = [];
  DateTime? _scanStartedAt;
  int get _requiredHits => kIsWeb ? 1 : 2;

  // Frame averaging
  final List<String> _consecutiveHits = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _currentTempId =
        'LPR-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
    _statusMessage = Lang.sel(
        ref.read(localeIsCroatianProvider), "SCANNING...", "SKENIRANJE...");
    _initializeCamera();
    _streamSubs.add(ref.listenManual(sessionsStreamProvider, (_, __) {}));
    _streamSubs.add(ref.listenManual(permitsStreamProvider, (_, __) {}));
    _streamSubs.add(ref.listenManual(violationsStreamProvider, (_, __) {}));
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _isAppActive = state == AppLifecycleState.resumed;
    if (!_isAppActive) {
      _webLPRTimer?.cancel();
      if (!kIsWeb) {
        try {
          _controller?.stopImageStream();
        } catch (_) {}
      }
      return;
    }
    if (_controller == null || !_controller!.value.isInitialized) return;
    if (kIsWeb) {
      _startWebLPRTimer();
    } else {
      if (!(_controller?.value.isStreamingImages ?? false)) {
        _controller?.startImageStream(_processCameraImage);
      }
    }
  }

  bool _canProcess() {
    final now = DateTime.now();
    final last = _lastProcessAt;
    if (last != null && now.difference(last) < _processCooldown) {
      return false;
    }
    _lastProcessAt = now;
    return true;
  }

  void _setStatus(String message, Color color) {
    if (!mounted) return;
    if (_statusMessage == message && _statusColor == color) return;
    setState(() {
      _statusMessage = message;
      _statusColor = color;
    });
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() {
          _statusMessage = Lang.sel(ref.read(localeIsCroatianProvider),
              "NO CAMERAS FOUND", "KAMERA NIJE PRONAĐENA");
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
        imageFormatGroup: kIsWeb
            ? null
            : (defaultTargetPlatform == TargetPlatform.android
                ? ImageFormatGroup.nv21
                : null),
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
        _statusMessage = Lang.sel(ref.read(localeIsCroatianProvider),
            "CAMERA ERROR: $e", "POGREŠKA KAMERE: $e");
      });
    }
  }

  Timer? _webLPRTimer;

  void _startWebLPRTimer() {
    _webLPRTimer?.cancel();
    _webLPRTimer =
        Timer.periodic(const Duration(milliseconds: 120), (timer) async {
      if (!_isScanning ||
          _isBusy ||
          !_isAppActive ||
          !mounted ||
          _controller == null ||
          !_controller!.value.isInitialized) {
        return;
      }
      if (!_canProcess()) {
        return;
      }

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
      _scanStartedAt ??= DateTime.now();
      _consecutiveHits.add(foundPlate);
      if (_consecutiveHits.length > _requiredHits) {
        _consecutiveHits.removeAt(0);
      }

      if (_consecutiveHits.length == _requiredHits &&
          _consecutiveHits.every((e) => e == foundPlate)) {
        _confirmPlate(foundPlate);
      }
    } else {
      // Don't clear immediately, allows for slight flicker
      if (_consecutiveHits.isNotEmpty) {
        // Just clear if we haven't seen anything for a few frames
        // In this stream-based approach, clearing on every 'null' might be too aggressive
        _consecutiveHits.clear();
        _scanStartedAt = null;
      }
    }
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_isBusy || !_isScanning || !mounted || !_canProcess()) return;
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
    if (_isBusy || _controller == null || !_controller!.value.isInitialized) {
      return;
    }

    try {
      _isBusy = true;
      setState(() {
        _statusMessage = Lang.sel(ref.read(localeIsCroatianProvider),
            "MANUAL SCAN...", "RUČNO SKENIRANJE...");
        _statusColor = Colors.yellowAccent;
      });

      // On Web, Plate Scan is not supported, so we should fail gracefully
      if (kIsWeb) {
        throw Exception(Lang.sel(ref.read(localeIsCroatianProvider),
            "LPR NOT SUPPORTED ON WEB", "LPR NIJE PODRŽAN NA WEBU"));
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
        _setStatus(
          Lang.sel(ref.read(localeIsCroatianProvider), "NO PLATE DETECTED",
              "NEMA REGISTRACIJE"),
          Colors.orange,
        );
        await Future.delayed(const Duration(seconds: 2));
      }
    } catch (e) {
      debugPrint("Manual Validation Error: $e");
      _setStatus(
        kIsWeb
            ? Lang.sel(ref.read(localeIsCroatianProvider),
                "USE MOBILE FOR SCAN", "KORISTITE MOBILNI ZA SKENIRANJE")
            : Lang.sel(ref.read(localeIsCroatianProvider), "SCAN ERROR",
                "POGREŠKA SKENIRANJA"),
        Colors.redAccent,
      );
      await Future.delayed(const Duration(seconds: 2));
    } finally {
      _isBusy = false;
      if (mounted && _isScanning) {
        _setStatus(
          Lang.sel(ref.read(localeIsCroatianProvider), "SCANNING...",
              "SKENIRANJE..."),
          Colors.white,
        );
      }
    }
  }

  void _confirmPlate(String plate) async {
    if (!_isScanning) return;
    final isWeb = kIsWeb;
    final detectionStartedAt = _scanStartedAt;
    final detectionLatency = detectionStartedAt == null
        ? Duration.zero
        : DateTime.now().difference(detectionStartedAt);
    PerformanceMonitor.instance.recordMetric(
      operation: 'lpr_plate_detection',
      duration: detectionLatency,
      success: true,
      metadata: {
        'plateLength': plate.length,
        'platform': kIsWeb ? 'web' : 'mobile'
      },
    );
    _scanStartedAt = null;

    setState(() {
      _isScanning = false;
      _detectedPlate = plate;
      _statusMessage = isWeb
          ? _statusMessage
          : Lang.sel(ref.read(localeIsCroatianProvider),
              "SEARCHING DASHBOARD...", "PRETRAŽIVANJE NADZORNE PLOČE...");
      _statusColor = isWeb ? Colors.white : Colors.yellowAccent;
      _showValidationPulse = !isWeb;
    });

    final dashboardStopwatch = Stopwatch()..start();
    try {
      final sessions = ref.read(sessionsStreamProvider).value ?? [];
      final permits = ref.read(permitsStreamProvider).value ?? [];
      final violations = ref.read(violationsStreamProvider).value ?? [];

      final activeSession = sessions.firstWhere(
        (s) => s['plate']?.toString().toUpperCase() == plate.toUpperCase(),
        orElse: () => {},
      );

      final platePermits = permits
          .where((p) =>
              p['plate']?.toString().toUpperCase() == plate.toUpperCase())
          .toList();
      final activePermit = platePermits.firstWhere(
        (p) => _isPermitAllowedNow(p),
        orElse: () => {},
      );
      final anyPermit =
          platePermits.isNotEmpty ? platePermits.first : <String, dynamic>{};

      final recentViolation = violations.firstWhere(
        (v) => v['plate']?.toString().toUpperCase() == plate.toUpperCase(),
        orElse: () => {},
      );

      if (activeSession.isNotEmpty) {
        _setStatus(
          Lang.sel(ref.read(localeIsCroatianProvider), "ACTIVE SESSION FOUND",
              "AKTIVNA SESIJA PRONAĐENA"),
          Colors.greenAccent,
        );
      } else if (activePermit.isNotEmpty) {
        _setStatus(
          Lang.sel(ref.read(localeIsCroatianProvider), "VALID PERMIT FOUND",
              "VALJANA DOZVOLA PRONAĐENA"),
          Colors.greenAccent,
        );
      } else if (anyPermit.isNotEmpty) {
        _setStatus(
          Lang.sel(
              ref.read(localeIsCroatianProvider),
              "PERMIT FOUND, OUTSIDE ACCESS WINDOW",
              "DOZVOLA POSTOJI, IZVAN VREMENA PRISTUPA"),
          Colors.orangeAccent,
        );
      } else if (recentViolation.isNotEmpty) {
        _setStatus(
          Lang.sel(
              ref.read(localeIsCroatianProvider),
              "RECENT VIOLATION: ${recentViolation['violation_type']}",
              "NEDAVNI PREKRŠAJ: ${recentViolation['violation_type']}"),
          Colors.orangeAccent,
        );
      } else {
        _setStatus(
          Lang.sel(ref.read(localeIsCroatianProvider), "NO ACTIVE RECORD",
              "NEMA AKTIVNOG ZAPISA"),
          Colors.redAccent,
        );
      }
    } catch (e) {
      debugPrint("Dashboard Search Error: $e");
      _setStatus("CONFIRMED (LOCAL)", Colors.greenAccent);
    } finally {
      dashboardStopwatch.stop();
      PerformanceMonitor.instance.recordMetric(
        operation: 'lpr_dashboard_lookup',
        duration: dashboardStopwatch.elapsed,
        success: true,
        metadata: {'plateLength': plate.length},
      );
      final totalLatency = detectionLatency + dashboardStopwatch.elapsed;
      PerformanceMonitor.instance.recordMetric(
        operation: 'lpr_total_to_result',
        duration: totalLatency,
        success: true,
        metadata: {
          'plateLength': plate.length,
          'platform': kIsWeb ? 'web' : 'mobile'
        },
      );
      final avgDetection =
          PerformanceMonitor.instance.getAverageDuration('lpr_plate_detection');
      final avgLookup = PerformanceMonitor.instance
          .getAverageDuration('lpr_dashboard_lookup');
      final avgTotal =
          PerformanceMonitor.instance.getAverageDuration('lpr_total_to_result');
      debugPrint(
          'LPR_TIMING detection=${detectionLatency.inMilliseconds}ms dashboard=${dashboardStopwatch.elapsed.inMilliseconds}ms total=${totalLatency.inMilliseconds}ms plate=$plate');
      debugPrint(
          'LPR_AVG detection=${avgDetection.inMilliseconds}ms dashboard=${avgLookup.inMilliseconds}ms total=${avgTotal.inMilliseconds}ms');
    }

    if (!isWeb && await Vibration.hasVibrator()) {
      Vibration.vibrate(duration: 200);
    }

    if (!isWeb) {
      await Future.delayed(const Duration(seconds: 3));
    }
    if (!isWeb && mounted) {
      setState(() {
        _showValidationPulse = false;
      });
    }
  }

  bool _isPermitAllowedNow(Map<String, dynamic> permit) {
    final status = (permit['status'] ?? '').toString().toLowerCase();
    if (status.isNotEmpty && status != 'active') return false;
    final start = _parseToCetDateTime((permit['start_time'] ?? '').toString());
    final end = _parseToCetDateTime((permit['end_time'] ?? '').toString());
    final now = _utcToCet(DateTime.now().toUtc());
    if (start != null && now.isBefore(start)) return false;
    if (end != null && now.isAfter(end)) return false;
    final type = (permit['type'] ?? '').toString().toLowerCase();
    if (type != 'subscription') return true;
    final metadata = _resolveAccessMetadata(permit);
    final rawIs24_7 = metadata['is_24_7'];
    final is24_7 = rawIs24_7 is bool
        ? rawIs24_7
        : (permit['daily_start_time'] == null &&
            permit['daily_end_time'] == null);
    if (is24_7) return true;
    final allowedWeekdays = _resolveAllowedWeekdays(permit, metadata);
    if (!allowedWeekdays.contains(now.weekday)) return false;
    final startMinute =
        _parseTimeToMinuteOfDay((permit['daily_start_time'] ?? '').toString());
    final endMinute =
        _parseTimeToMinuteOfDay((permit['daily_end_time'] ?? '').toString());
    if (startMinute == null || endMinute == null) return true;
    final currentMinute = now.hour * 60 + now.minute;
    if (startMinute == endMinute) return true;
    if (startMinute < endMinute) {
      return currentMinute >= startMinute && currentMinute <= endMinute;
    }
    return currentMinute >= startMinute || currentMinute <= endMinute;
  }

  Map<String, dynamic> _parseMetadata(dynamic raw) {
    try {
      if (raw is Map<String, dynamic>) return raw;
      if (raw is Map) return Map<String, dynamic>.from(raw);
      if (raw is String && raw.isNotEmpty) {
        final first = jsonDecode(raw);
        if (first is Map<String, dynamic>) return first;
        if (first is Map) return Map<String, dynamic>.from(first);
      }
    } catch (_) {}
    return {};
  }

  Map<String, dynamic> _resolveAccessMetadata(Map<String, dynamic> permit) {
    final stripe = _parseMetadata(permit['stripe_metadata']);
    final notes = _parseMetadata(permit['notes']);
    final access = notes['access_control'];
    if (access is Map<String, dynamic>) {
      return {...stripe, ...access};
    }
    if (access is Map) {
      return {...stripe, ...Map<String, dynamic>.from(access)};
    }
    return stripe;
  }

  List<int> _resolveAllowedWeekdays(
      Map<String, dynamic> permit, Map<String, dynamic> metadata) {
    final raw = permit['allowed_weekdays'] ?? metadata['allowed_weekdays'];
    if (raw is List) {
      final values = raw
          .map((e) => int.tryParse(e.toString()))
          .whereType<int>()
          .where((e) => e >= 1 && e <= 7)
          .toSet()
          .toList()
        ..sort();
      if (values.isNotEmpty) return values;
    }
    return [1, 2, 3, 4, 5, 6, 7];
  }

  int? _parseTimeToMinuteOfDay(String raw) {
    if (raw.isEmpty) return null;
    final parts = raw.split(':');
    if (parts.length < 2) return null;
    final h = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (h == null || m == null) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  DateTime? _parseToCetDateTime(String raw) {
    if (raw.isEmpty) return null;
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return null;
    final hasOffset =
        RegExp(r'(Z|[+-]\d{2}:\d{2})$', caseSensitive: false).hasMatch(raw);
    if (!hasOffset) {
      return DateTime(parsed.year, parsed.month, parsed.day, parsed.hour,
          parsed.minute, parsed.second, parsed.millisecond, parsed.microsecond);
    }
    final utc = parsed.isUtc ? parsed : parsed.toUtc();
    return _utcToCet(utc);
  }

  DateTime _utcToCet(DateTime utc) {
    final startDst = _lastSundayUtc(utc.year, 3, 1);
    final endDst = _lastSundayUtc(utc.year, 10, 1);
    final isDst = !utc.isBefore(startDst) && utc.isBefore(endDst);
    return utc.add(Duration(hours: isDst ? 2 : 1));
  }

  DateTime _lastSundayUtc(int year, int month, int hourUtc) {
    var day = DateTime.utc(year, month + 1, 0);
    while (day.weekday != DateTime.sunday) {
      day = day.subtract(const Duration(days: 1));
    }
    return DateTime.utc(year, month, day.day, hourUtc);
  }

  @override
  void dispose() {
    _webLPRTimer?.cancel();
    for (final sub in _streamSubs) {
      sub.close();
    }
    WidgetsBinding.instance.removeObserver(this);
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
              duration: Duration(milliseconds: kIsWeb ? 0 : 300),
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
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.15),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.4),
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
                      _buildStatusBadge(
                          Lang.sel(ref.watch(localeIsCroatianProvider),
                              "SYSTEM ACTIVE", "SUSTAV AKTIVAN"),
                          Colors.white),
                      _buildStatusBadge(
                          Lang.sel(ref.watch(localeIsCroatianProvider),
                              "LPR READY", "LPR SPREMNO"),
                          Colors.white),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _statusMessage,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      letterSpacing: 2,
                      fontFamily: 'Courier',
                      shadows: [
                        Shadow(
                          blurRadius: 8.0,
                          color: Colors.black.withValues(alpha: 0.8),
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
                  _detectedPlate ??
                      Lang.sel(ref.watch(localeIsCroatianProvider), "no plate",
                          "nema registracije"),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 2,
                    fontFamily: 'Courier',
                    color: Colors.white
                        .withValues(alpha: _detectedPlate == null ? 0.3 : 1.0),
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
                  label: Lang.sel(ref.watch(localeIsCroatianProvider),
                      "WARNING", "UPOZORENJE"),
                  color: Colors.orangeAccent,
                  onTap: () => _handleQuickAction(isWarning: true),
                ),
                const SizedBox(width: 30),
                _buildActionButton(
                  icon: Icons.receipt_long,
                  label: Lang.sel(
                      ref.watch(localeIsCroatianProvider), "TICKET", "KAZNA"),
                  color: Colors.redAccent,
                  isPrimary: true,
                  onTap: () => _handleQuickAction(isWarning: false),
                ),
                const SizedBox(width: 30),
                _buildActionButton(
                  icon: Icons.check_circle_outline,
                  label: Lang.sel(ref.watch(localeIsCroatianProvider),
                      "VALIDATE", "POTVRDI"),
                  color: Colors.greenAccent,
                  onTap: () async {
                    if (!_isScanning) {
                      setState(() {
                        _isScanning = true;
                        _detectedPlate = null;
                        _scanStartedAt = null;
                        _statusMessage = Lang.sel(
                            ref.read(localeIsCroatianProvider),
                            "SCANNING...",
                            "SKENIRANJE...");
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
        color: Colors.black.withValues(alpha: 0.6),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: Colors.white,
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
              color: Colors.black.withValues(alpha: 0.7),
              shape: BoxShape.circle,
              border: Border.all(
                  color: Colors.white.withValues(alpha: 0.15), width: 2),
              boxShadow: isPrimary
                  ? [
                      BoxShadow(
                        color: Colors.white.withValues(alpha: 0.15),
                        blurRadius: 12,
                        spreadRadius: 1,
                      )
                    ]
                  : [],
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: isPrimary ? 40 : 28,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              color: Colors.white,
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
    final issuerRole = profile['role'];

    final resolution = await LocationResolver.resolve(ref);
    final locationDisplayId = resolution.effectiveDisplayId;

    if (locationDisplayId == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Error: No Location ID selected or assigned.')),
        );
      }
      return;
    }

    final locationUuid =
        await ref.read(selectedEffectiveLocationUuidProvider.future);
    if (locationUuid == null) {
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
      });

      XFile? image;
      try {
        image = await _controller!.takePicture().timeout(
              const Duration(seconds: 6),
              onTimeout: () =>
                  throw TimeoutException('Camera capture timed out'),
            );
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Camera error: $e')),
          );
        }
      }

      if (image == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Capture canceled or failed')),
          );
        }
        setState(() {
          _isProcessing = false;
          _statusMessage = Lang.sel(ref.read(localeIsCroatianProvider),
              "SCANNING...", "SKENIRANJE...");
          _statusColor = Colors.white;
        });
        return;
      }

      final imageBytes = await image.readAsBytes();
      final initialPlate = _detectedPlate ?? _currentTempId;

      // Show confirmation dialog after taking photo
      if (!mounted) return;
      final plateController = TextEditingController(text: initialPlate);
      final confirmedPlate = await showDialog<String>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: Colors.black.withValues(alpha: 0.9),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: isWarning ? Colors.orange : Colors.red)),
          title: Text(
            isWarning
                ? Lang.sel(ref.watch(localeIsCroatianProvider),
                    'CONFIRM WARNING', 'POTVRDI UPOZORENJE')
                : Lang.sel(ref.watch(localeIsCroatianProvider),
                    'CONFIRM TICKET', 'POTVRDI KAZNU'),
            style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.memory(
                  imageBytes,
                  height: 150,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                Lang.sel(ref.watch(localeIsCroatianProvider),
                    "VERIFY LICENSE PLATE", "PROVJERI REGISTRACIJU"),
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: plateController,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2),
                textAlign: TextAlign.center,
                textCapitalization: TextCapitalization.characters,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9]')),
                ],
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.1),
                  hintText: 'MA679XX',
                  hintStyle:
                      TextStyle(color: Colors.white.withValues(alpha: 0.3)),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                Lang.sel(
                    ref.watch(localeIsCroatianProvider), 'CANCEL', 'ODUSTANI'),
                style: const TextStyle(color: Colors.white54),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                if (plateController.text.trim().isNotEmpty) {
                  Navigator.pop(
                      context, plateController.text.trim().toUpperCase());
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: isWarning ? Colors.orange : Colors.red,
                foregroundColor: Colors.white,
              ),
              child: Text(Lang.sel(ref.watch(localeIsCroatianProvider),
                  'CONFIRM & ISSUE', 'POTVRDI I IZDAJ')),
            ),
          ],
        ),
      );

      if (confirmedPlate == null || confirmedPlate.isEmpty) {
        setState(() {
          _isProcessing = false;
          _statusMessage = Lang.sel(ref.read(localeIsCroatianProvider),
              "SCANNING...", "SKENIRANJE...");
          _statusColor = Colors.white;
        });
        return;
      }

      final plate = confirmedPlate;
      final controller = ref.read(enforcementControllerProvider);
      if (!mounted) return;
      await AsyncActionHandler.run<void>(
        context: context,
        action: () => controller.issueQuickAction(
          plate: plate,
          isWarning: isWarning,
          locationUuid: locationUuid,
          bytes: imageBytes,
          isLprScan: true,
          issuerRole: issuerRole,
        ),
        errorBuilder: ErrorMapper.message,
      );

      if (mounted) {
        setState(() {
          _detectedPlate = plate;
          _showValidationPulse = false;
          _statusMessage = Lang.sel(ref.read(localeIsCroatianProvider),
              "SCANNING...", "SKENIRANJE...");
          _statusColor = Colors.white;
        });
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
      ..color = borderColor.withValues(alpha: 0.8)
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

    const cornerSize = 40.0;

    // 1. Draw Docked Data Tray (The "Instrument" look)
    final trayPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.5)
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
        roiRect.topLeft, roiRect.topLeft + const Offset(cornerSize, 0), paint);
    canvas.drawLine(
        roiRect.topLeft, roiRect.topLeft + const Offset(0, cornerSize), paint);

    // Top Right
    canvas.drawLine(roiRect.topRight,
        roiRect.topRight + const Offset(-cornerSize, 0), paint);
    canvas.drawLine(roiRect.topRight,
        roiRect.topRight + const Offset(0, cornerSize), paint);

    // Bottom Left (Extended for tray)
    canvas.drawLine(roiRect.bottomLeft,
        roiRect.bottomLeft + const Offset(cornerSize, 0), paint);
    canvas.drawLine(roiRect.bottomLeft,
        roiRect.bottomLeft + const Offset(0, -cornerSize), paint);

    // Bottom Right (Extended for tray)
    canvas.drawLine(roiRect.bottomRight,
        roiRect.bottomRight + const Offset(-cornerSize, 0), paint);
    canvas.drawLine(roiRect.bottomRight,
        roiRect.bottomRight + const Offset(0, -cornerSize), paint);

    // 3. Draw Side Brackets (Industry look)
    final bracketPaint = Paint()
      ..color = borderColor.withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    canvas.drawLine(roiRect.topLeft + const Offset(0, cornerSize),
        roiRect.bottomLeft - const Offset(0, 0), bracketPaint);
    canvas.drawLine(roiRect.topRight + const Offset(0, cornerSize),
        roiRect.bottomRight - const Offset(0, 0), bracketPaint);

    // 4. Scanning Laser Beam (Only if scanning)
    if (isScanning) {
      final scanPaint = Paint()
        ..color = borderColor.withValues(alpha: 0.4)
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
