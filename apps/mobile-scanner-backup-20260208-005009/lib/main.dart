import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'theme.dart';
import 'main_scaffold.dart';
import 'screens/auth_screen.dart';
import 'services/supabase_service.dart';
import 'services/performance_monitor.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize performance monitoring
  PerformanceMonitor.instance.startCleanupTimer();

  runApp(const ProviderScope(child: BootApp()));
}

class BootApp extends StatefulWidget {
  const BootApp({super.key});

  @override
  State<BootApp> createState() => _BootAppState();
}

class _BootAppState extends State<BootApp> {
  late Future<void> _initFuture;

  @override
  void initState() {
    super.initState();
    _initFuture = _initSupabase();
  }

  Future<void> _initSupabase() async {
    debugPrint('BootApp: starting Supabase.initialize');
    debugPrint('BootApp: timestamp: ${DateTime.now()}');

    final stopwatch = Stopwatch()..start();

    try {
      await SupabaseService.instance.initialize(
        url: 'https://iafjygownkhedereaoxw.supabase.co',
        anonKey: 'sb_publishable_ah4iveg_PBowEdtSgQo4Qg_KjLUzWBV',
        timeout: const Duration(seconds: 5),
      );

      stopwatch.stop();
      PerformanceMonitor.instance.recordMetric(
        operation: 'supabase_initialization',
        duration: stopwatch.elapsed,
        success: true,
      );

      debugPrint(
          'BootApp: Supabase.initialize completed successfully in ${stopwatch.elapsed.inMilliseconds}ms');
    } catch (e) {
      stopwatch.stop();
      PerformanceMonitor.instance.recordMetric(
        operation: 'supabase_initialization',
        duration: stopwatch.elapsed,
        success: false,
        metadata: {'error': e.toString()},
      );

      debugPrint(
          'BootApp: Supabase initialization failed after ${stopwatch.elapsed.inMilliseconds}ms: $e');
      rethrow;
    }

    debugPrint('BootApp: _initSupabase completed');
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _initFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return MaterialApp(
            title: 'payparq.ai',
            theme: AppTheme.lightTheme,
            home: const Scaffold(
              backgroundColor: AppTheme.lightBackground,
              body: Center(
                child: CircularProgressIndicator(),
              ),
            ),
            debugShowCheckedModeBanner: false,
          );
        }
        if (snapshot.hasError) {
          return MaterialApp(
            title: 'payparq.ai',
            theme: AppTheme.lightTheme,
            home: Scaffold(
              backgroundColor: AppTheme.lightBackground,
              body: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Unable to initialize. Check connection and retry.',
                        style: Theme.of(context).textTheme.titleMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _initFuture = _initSupabase();
                            });
                          },
                          child: const Text('Retry'),
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
        return const PayParqApp();
      },
    );
  }
}

class PayParqApp extends StatelessWidget {
  const PayParqApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'payparq.ai',
      theme: AppTheme.lightTheme, // Default to Light Theme
      home: StreamBuilder<AuthState>(
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
