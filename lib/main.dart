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
  bool _isRecoveryMode = false;
  bool _supabaseReady = false;
  bool _authResolved = false;
  Session? _activeSession;
  bool _startupSplashCompleted = false;
  StreamSubscription<AuthState>? _authSubscription;

  void _addLog(String msg) {
    debugPrint('BOOT_LOG: $msg');
  }

  @override
  void initState() {
    super.initState();
    _addLog('App starting...');
    _logBuildInfo();
    _isRecoveryMode = _isRecoveryRequestFromUrl();
    _initializeApp();
  }

  @override
  void dispose() {
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

  Future<void> _initializeApp() async {
    try {
      await _initSupabase();
      _addLog('Supabase ready');
    } catch (e) {
      _addLog('Initialization failed: $e');
    }
    if (!mounted) return;
    setState(() {
      _supabaseReady = true;
      _authResolved = true;
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
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final shouldShowStartupSplash = !kIsWeb &&
        !_startupSplashCompleted &&
        (!_supabaseReady || !_authResolved);
    if (!shouldShowStartupSplash) {
      _startupSplashCompleted = true;
    }
    final Widget homeScreen = _showResetPasswordScreen
        ? const UpdatePasswordScreen(key: ValueKey('update-password'))
        : shouldShowStartupSplash
            ? const _StartupSplashScreen(key: ValueKey('startup-splash'))
            : _activeSession != null
                ? const MasterScaffold(key: ValueKey('master-scaffold'))
                : const AuthScreen(key: ValueKey('auth-screen'));
    return MaterialApp(
      title: 'payparq.ai',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: homeScreen,
    );
  }
}

class _StartupSplashScreen extends StatelessWidget {
  const _StartupSplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 320),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text(
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
            ],
          ),
        ),
      ),
    );
  }
}
