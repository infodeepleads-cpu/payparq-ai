import 'dart:ui';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme.dart';
import 'main_scaffold.dart';
import 'screens/auth_screen.dart';
import 'screens/update_password_screen.dart';
import 'services/supabase_service.dart';
import 'services/performance_monitor.dart';
import 'config/app_config.dart';
import 'logic/providers/auth_providers.dart';

Future<void> main() async {
  debugPrint('--- MAIN STARTING ---');
  try {
    WidgetsFlutterBinding.ensureInitialized();
    debugPrint('--- BINDING INITIALIZED ---');
  } catch (e) {
    debugPrint('--- BINDING FAILED: $e ---');
  }
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    debugPrint('FlutterError: ${details.exceptionAsString()}');
  };
  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('PlatformDispatcherError: $error');
    debugPrintStack(stackTrace: stack);
    return true;
  };
  try {
    PerformanceMonitor.instance.startCleanupTimer();
  } catch (e, st) {
    debugPrint('PerformanceMonitor init failed: $e');
    debugPrintStack(stackTrace: st);
  }

  final prefs = await _loadSharedPreferencesSafely();

  runApp(ProviderScope(
    overrides: [
      sharedPreferencesProvider.overrideWithValue(prefs),
    ],
    child: const PayParqApp(),
  ));
}

Future<SharedPreferences> _loadSharedPreferencesSafely() async {
  try {
    return await SharedPreferences.getInstance()
        .timeout(const Duration(seconds: 4));
  } catch (e, st) {
    debugPrint('SharedPreferences bootstrap failed: $e');
    debugPrintStack(stackTrace: st);
    return await SharedPreferences.getInstance();
  }
}

class PayParqApp extends StatefulWidget {
  const PayParqApp({super.key});

  @override
  State<PayParqApp> createState() => _PayParqAppState();
}

class _PayParqAppState extends State<PayParqApp> with TickerProviderStateMixin {
  late Future<void> _initFuture;
  static const Duration _initGuardTimeout = Duration(seconds: 20);
  static const Duration _authGateFallbackDelay = Duration(seconds: 12);
  final List<String> _logs = [];

  bool _isRecoveryMode = false;
  StreamSubscription<AuthState>? _authSubscription;
  Timer? _authGateFallbackTimer;
  bool _forceAuthGate = false;

  void _addLog(String msg) {
    debugPrint('BOOT_LOG: $msg');
    if (mounted) {
      setState(() {
        _logs.add(
            '[${DateTime.now().toIso8601String().split('T').last.substring(0, 8)}] $msg');
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _addLog('App starting...');
    _logBuildInfo();
    _initFuture = _initWithGuard();
    _authGateFallbackTimer = Timer(_authGateFallbackDelay, () {
      if (!mounted) return;
      if (_forceAuthGate) return;
      setState(() {
        _forceAuthGate = true;
      });
    });

    _isRecoveryMode = _isRecoveryRequestFromUrl();
  }

  @override
  void dispose() {
    _authGateFallbackTimer?.cancel();
    _authSubscription?.cancel();
    super.dispose();
  }

  bool _isResetPasswordPath() {
    if (!kIsWeb) return false;
    return Uri.base.pathSegments
        .map((segment) => segment.toLowerCase())
        .contains('reset-password');
  }

  bool _isRecoveryRequestFromUrl() {
    if (!kIsWeb) return false;
    final queryType = Uri.base.queryParameters['type']?.toLowerCase();
    if (queryType == 'recovery') {
      return _hasRecoveryTokenInUrl();
    }
    final fragment = Uri.base.fragment;
    if (fragment.isEmpty) return false;
    final fragmentQuery = Uri.splitQueryString(fragment);
    return fragmentQuery['type']?.toLowerCase() == 'recovery' &&
        _hasRecoveryTokenInUrl();
  }

  bool _hasRecoveryTokenInUrl() {
    if (!kIsWeb) return false;
    final query = Uri.base.queryParameters;
    if (query['access_token']?.isNotEmpty == true) return true;
    if (query['refresh_token']?.isNotEmpty == true) return true;
    if (query['token']?.isNotEmpty == true) return true;
    final fragment = Uri.base.fragment;
    if (fragment.isEmpty) return false;
    final fragmentQuery = Uri.splitQueryString(fragment);
    if (fragmentQuery['access_token']?.isNotEmpty == true) return true;
    if (fragmentQuery['refresh_token']?.isNotEmpty == true) return true;
    if (fragmentQuery['token']?.isNotEmpty == true) return true;
    return false;
  }

  bool get _showResetPasswordScreen =>
      _isRecoveryMode ||
      (_isResetPasswordPath() && _hasRecoveryTokenInUrl()) ||
      _isRecoveryRequestFromUrl();

  Future<void> _initWithGuard() {
    _addLog('Initializing with watchdog (20s)...');
    return _initSupabase().timeout(_initGuardTimeout, onTimeout: () {
      _addLog('Watchdog TIMEOUT triggered!');
      _addLog('Continuing without timeout guard for stability...');
      return;
    });
  }

  Future<void> _logBuildInfo() async {
    try {
      _addLog('Logging build info (skipping PackageInfo for stability)...');
      const env = String.fromEnvironment('ENV', defaultValue: 'dev');
      const version = '1.0.0+1';
      final buildDate =
          AppConfig.buildDate.isEmpty ? 'unknown' : AppConfig.buildDate;
      _addLog('Build: $buildDate, Env: $env, Ver: $version');
      _addLog('URL: ${AppConfig.supabaseUrl}');
    } catch (e) {
      _addLog('Build info log failed: $e');
    }
  }

  Future<void> _initSupabase() async {
    _addLog('Starting Supabase.initialize...');
    final stopwatch = Stopwatch()..start();

    try {
      _addLog('Validating config...');
      AppConfig.validate();

      _addLog('Calling SupabaseService.initialize...');
      await SupabaseService.instance.initialize(
        url: AppConfig.supabaseUrl,
        anonKey: AppConfig.supabaseAnonKey,
        timeout: const Duration(seconds: 15),
      );

      if (kIsWeb &&
          AppConfig.forceWebSignOutOnStartup &&
          !_hasRecoveryTokenInUrl()) {
        try {
          await Supabase.instance.client.auth.signOut();
          _addLog('Web startup forced sign-out completed');
        } catch (e) {
          _addLog('Web startup sign-out skipped: $e');
        }
      }

      stopwatch.stop();
      _addLog('Supabase initialized in ${stopwatch.elapsedMilliseconds}ms');
      _attachAuthListener();
    } catch (e) {
      _addLog('Initialization ERROR: $e');
      rethrow;
    }

    _addLog('Initialization sequence complete');
  }

  void _attachAuthListener() {
    if (_authSubscription != null) return;
    _authSubscription =
        Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (!mounted) return;
      if (data.event == AuthChangeEvent.passwordRecovery &&
          _hasRecoveryTokenInUrl()) {
        setState(() => _isRecoveryMode = true);
      } else if (data.event == AuthChangeEvent.signedIn ||
          data.event == AuthChangeEvent.signedOut ||
          data.event == AuthChangeEvent.userUpdated) {
        if (_isRecoveryMode) {
          setState(() => _isRecoveryMode = false);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'payparq.ai',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: FutureBuilder<void>(
        future: _initFuture,
        builder: (context, snapshot) {
          final forceDebugAuth = kDebugMode && kIsWeb;
          if (snapshot.connectionState != ConnectionState.done) {
            if (_forceAuthGate || forceDebugAuth) {
              return const AuthScreen();
            }
            return const Scaffold(
              backgroundColor: Colors.black,
              body: Center(
                child: _PulsingBrandWordmark(),
              ),
            );
          }

          if (snapshot.hasError) {
            if (forceDebugAuth) {
              return const AuthScreen();
            }
            return Scaffold(
              backgroundColor: const Color(0xFFF9FAFB),
              body: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline,
                            color: Colors.red, size: 64),
                        const SizedBox(height: 24),
                        const Text(
                          'Initialization Failed',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                            fontFamily: 'sans-serif',
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '${snapshot.error}',
                          style: const TextStyle(
                            color: Color(0xFF4B5563),
                            fontSize: 14,
                            height: 1.5,
                            fontFamily: 'sans-serif',
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onPressed: () {
                              setState(() {
                                _initFuture = _initWithGuard();
                              });
                            },
                            child: const Text(
                              'Retry Connection',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'sans-serif',
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }

          return _showResetPasswordScreen
              ? const UpdatePasswordScreen()
              : StreamBuilder<AuthState>(
                  stream: Supabase.instance.client.auth.onAuthStateChange,
                  builder: (context, snapshot) {
                    final session =
                        Supabase.instance.client.auth.currentSession ??
                            snapshot.data?.session;
                    if (session != null) {
                      return const MasterScaffold();
                    }
                    return const AuthScreen();
                  },
                );
        },
      ),
    );
  }
}

class _PulsingBrandWordmark extends StatefulWidget {
  const _PulsingBrandWordmark();

  @override
  State<_PulsingBrandWordmark> createState() => _PulsingBrandWordmarkState();
}

class _PulsingBrandWordmarkState extends State<_PulsingBrandWordmark>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
    _opacity = Tween<double>(begin: 0.62, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: const Text(
        'payparq.ai',
        style: TextStyle(
          color: Colors.white,
          fontSize: 28,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.4,
          fontFamily: 'sans-serif',
          shadows: [
            Shadow(
              color: Color(0x3DFFFFFF),
              blurRadius: 12,
              offset: Offset(0, 0),
            ),
          ],
        ),
      ),
    );
  }
}
