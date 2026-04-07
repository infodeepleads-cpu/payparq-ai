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
  static const Duration _initGuardTimeout = Duration(seconds: 8);
  static const Duration _sessionTransitionHold = Duration(seconds: 1);
  final List<String> _logs = [];

  bool _isRecoveryMode = false;
  bool _supabaseReady = false;
  bool _authResolved = false;
  Session? _activeSession;
  bool _initLoopRunning = false;
  bool _startupSplashCompleted = false;
  DateTime? _sessionTransitionUntil;
  StreamSubscription<AuthState>? _authSubscription;
  Timer? _sessionTransitionTimer;

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
    _isRecoveryMode = _isRecoveryRequestFromUrl();
    _startInitLoop();
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _sessionTransitionTimer?.cancel();
    super.dispose();
  }

  void _armSessionTransitionHold() {
    if (_startupSplashCompleted) return;
    _sessionTransitionUntil = DateTime.now().add(_sessionTransitionHold);
    _sessionTransitionTimer?.cancel();
    _sessionTransitionTimer = Timer(_sessionTransitionHold, () {
      if (!mounted) return;
      setState(() {});
    });
  }

  bool get _isSessionTransitionHoldActive {
    final until = _sessionTransitionUntil;
    if (until == null) return false;
    return DateTime.now().isBefore(until);
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

  Future<bool> _initWithGuard() async {
    _addLog('Initializing with watchdog (8s)...');
    try {
      await _initSupabase().timeout(_initGuardTimeout);
      return true;
    } catch (e) {
      _addLog('Init attempt failed: $e');
      return false;
    }
  }

  Future<void> _startInitLoop() async {
    if (_initLoopRunning) return;
    _initLoopRunning = true;
    while (mounted && !_supabaseReady) {
      final ready = await _initWithGuard();
      if (!mounted) return;
      if (ready) {
        setState(() {
          _supabaseReady = true;
        });
        _addLog('Supabase ready');
        break;
      }
      await Future.delayed(const Duration(seconds: 2));
    }
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
        timeout: const Duration(seconds: 8),
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
      _activeSession = Supabase.instance.client.auth.currentSession;
      if (_activeSession != null) {
        _armSessionTransitionHold();
      }
      _authResolved = true;
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
      final nextSession =
          data.session ?? Supabase.instance.client.auth.currentSession;
      if (data.event == AuthChangeEvent.passwordRecovery &&
          _hasRecoveryTokenInUrl()) {
        setState(() {
          _isRecoveryMode = true;
          _authResolved = true;
          _activeSession = nextSession;
          if (nextSession != null) {
            _armSessionTransitionHold();
          }
        });
      } else if (data.event == AuthChangeEvent.signedIn ||
          data.event == AuthChangeEvent.signedOut ||
          data.event == AuthChangeEvent.userUpdated ||
          data.event == AuthChangeEvent.tokenRefreshed ||
          data.event == AuthChangeEvent.initialSession) {
        setState(() {
          _isRecoveryMode = false;
          _authResolved = true;
          _activeSession = nextSession;
          if (nextSession != null) {
            _armSessionTransitionHold();
          }
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final shouldShowStartupSplash = !_startupSplashCompleted &&
        (!_supabaseReady || !_authResolved || _isSessionTransitionHoldActive);
    if (!shouldShowStartupSplash) {
      _startupSplashCompleted = true;
    }
    return MaterialApp(
      title: 'payparq.ai',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: _showResetPasswordScreen
          ? const UpdatePasswordScreen()
          : shouldShowStartupSplash
              ? const _StartupSplashScreen()
              : _activeSession != null
                  ? const MasterScaffold()
                  : const AuthScreen(),
    );
  }
}

class _StartupSplashScreen extends StatelessWidget {
  const _StartupSplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Text(
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
      ),
    );
  }
}
