import 'dart:ui';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';
import 'theme.dart';
import 'main_scaffold.dart';
import 'screens/auth_screen.dart';
import 'screens/update_password_screen.dart';
import 'services/supabase_service.dart';
import 'services/performance_monitor.dart';
import 'config/app_config.dart';

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

  runApp(const ProviderScope(child: BootApp()));
}

class BootApp extends StatefulWidget {
  const BootApp({super.key});

  @override
  State<BootApp> createState() => _BootAppState();
}

class _BootAppState extends State<BootApp> {
  late Future<void> _initFuture;
  static const Duration _initGuardTimeout = Duration(seconds: 20);
  final List<String> _logs = [];

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
  }

  void _handleRetry() {
    _addLog('Retry requested');
    setState(() {
      _initFuture = _initWithGuard();
    });
  }

  Future<void> _initWithGuard() {
    _addLog('Initializing with watchdog (20s)...');
    return _initSupabase().timeout(_initGuardTimeout, onTimeout: () {
      _addLog('Watchdog TIMEOUT triggered!');
      // Instead of throwing, we just let it finish or fail naturally to avoid infinite buffering
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

      // V14: Check today's Stripe data (2026-03-07)
      try {
        final client = Supabase.instance.client;
        final today = '2026-03-07';

        final sessions = await client
            .from('parking_sessions')
            .select('*')
            .gte('created_at', '${today}T00:00:00')
            .lte('created_at', '${today}T23:59:59');

        final permits = await client
            .from('parking_permits')
            .select('*')
            .gte('created_at', '${today}T00:00:00')
            .lte('created_at', '${today}T23:59:59');

        _addLog(
            'TODAY STRIPE DATA: ${sessions.length} sessions, ${permits.length} permits');
        for (var s in sessions) {
          _addLog(
              'STRIPE SESSION: plate=${s['plate']}, email=${s['email']}, status=${s['status']}, price=${s['price']}');
        }
        for (var p in permits) {
          _addLog(
              'STRIPE PERMIT: plate=${p['plate']}, email=${p['contact_email']}, status=${p['status']}');
        }
      } catch (e) {
        _addLog('STRIPE CHECK ERROR: $e');
      }

      stopwatch.stop();
      _addLog('Supabase initialized in ${stopwatch.elapsedMilliseconds}ms');
    } catch (e) {
      _addLog('Initialization ERROR: $e');
      rethrow;
    }

    _addLog('Initialization sequence complete');
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _initFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return MaterialApp(
            title: 'payparq.ai',
            home: Scaffold(
              backgroundColor: const Color(0xFFF9FAFB),
              body: Center(
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const CircularProgressIndicator(color: Colors.black),
                      const SizedBox(height: 24),
                      const Text(
                        'Initializing App...',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          fontFamily: 'sans-serif',
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Connecting to Supabase',
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                          fontFamily: 'sans-serif',
                        ),
                      ),
                      const SizedBox(height: 32),
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 24),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Startup Logs:',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.black54,
                              ),
                            ),
                            const Divider(),
                            ..._logs.map((log) => Text(
                                  log,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontFamily: 'monospace',
                                    color: Colors.black87,
                                  ),
                                )),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      TextButton(
                        onPressed: _handleRetry,
                        child: const Text(
                          'Force Refresh',
                          style: TextStyle(
                            color: Colors.blue,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            debugShowCheckedModeBanner: false,
          );
        }

        if (snapshot.hasError) {
          return MaterialApp(
            title: 'payparq.ai',
            home: Scaffold(
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
            ),
            debugShowCheckedModeBanner: false,
          );
        }
        return const PayParqApp();
      },
    );
  }
}

class PayParqApp extends StatefulWidget {
  const PayParqApp({super.key});

  @override
  State<PayParqApp> createState() => _PayParqAppState();
}

class _PayParqAppState extends State<PayParqApp> {
  bool _isRecoveryMode = false;
  late final StreamSubscription<AuthState> _authSubscription;
  bool _isResetPasswordPath() {
    if (!kIsWeb) return false;
    return Uri.base.pathSegments
        .map((segment) => segment.toLowerCase())
        .contains('reset-password');
  }

  bool _isRecoveryRequestFromUrl() {
    if (!kIsWeb) return false;
    final queryType = Uri.base.queryParameters['type']?.toLowerCase();
    if (queryType == 'recovery') return true;
    final fragment = Uri.base.fragment;
    if (fragment.isEmpty) return false;
    final fragmentQuery = Uri.splitQueryString(fragment);
    return fragmentQuery['type']?.toLowerCase() == 'recovery';
  }

  bool get _showResetPasswordScreen =>
      _isRecoveryMode || _isResetPasswordPath() || _isRecoveryRequestFromUrl();

  @override
  void initState() {
    super.initState();
    _isRecoveryMode = _isRecoveryRequestFromUrl();
    _authSubscription =
        Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (data.event == AuthChangeEvent.passwordRecovery) {
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
  void dispose() {
    _authSubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'payparq.ai',
      theme: AppTheme.lightTheme,
      home: _showResetPasswordScreen
          ? const UpdatePasswordScreen()
          : StreamBuilder<AuthState>(
              stream: Supabase.instance.client.auth.onAuthStateChange,
              builder: (context, snapshot) {
                final session = Supabase.instance.client.auth.currentSession ??
                    snapshot.data?.session;
                if (session != null) {
                  return const MasterScaffold();
                }
                return const AuthScreen();
              },
            ),
      debugShowCheckedModeBanner: false,
    );
  }
}
