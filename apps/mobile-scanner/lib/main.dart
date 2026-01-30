import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'theme.dart';
import 'main_scaffold.dart';
import 'screens/auth_screen.dart';

import 'widgets/pulsating_loading_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: BootApp()));
}

class BootApp extends StatefulWidget {
  const BootApp({super.key});

  @override
  State<BootApp> createState() => _BootAppState();
}

class _BootAppState extends State<BootApp> {
  late final Future<void> _initFuture;

  @override
  void initState() {
    super.initState();
    _initFuture = _initSupabase();
  }

  Future<void> _initSupabase() async {
    debugPrint('BootApp: starting Supabase.initialize');
    debugPrint('BootApp: timestamp: ${DateTime.now()}');

    final initFuture = Supabase.initialize(
      url: 'https://iafjygownkhedereaoxw.supabase.co',
      anonKey: 'sb_publishable_ah4iveg_PBowEdtSgQo4Qg_KjLUzWBV',
    ).then<void>((_) {
      debugPrint('BootApp: Supabase.initialize completed successfully');
      debugPrint('BootApp: completion timestamp: ${DateTime.now()}');
    });

    await initFuture.timeout(const Duration(seconds: 15), onTimeout: () {
      debugPrint('BootApp: Supabase.initialize timed out after 15s');
      debugPrint('BootApp: timeout timestamp: ${DateTime.now()}');
      return;
    });

    debugPrint('BootApp: _initSupabase completed');
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _initFuture,
      builder: (context, snapshot) {
        debugPrint('BootApp: FutureBuilder state: ${snapshot.connectionState}');
        debugPrint('BootApp: hasError: ${snapshot.hasError}');
        debugPrint('BootApp: timestamp: ${DateTime.now()}');

        if (snapshot.connectionState != ConnectionState.done) {
          debugPrint('BootApp: showing loading screen');
          return MaterialApp(
            title: 'payparq.ai',
            theme: AppTheme.lightTheme,
            home: const PulsatingLoadingScreen(),
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
          debugPrint(
              'PayParqApp: StreamBuilder state: ${snapshot.connectionState}');
          debugPrint('PayParqApp: hasData: ${snapshot.hasData}');
          debugPrint('PayParqApp: timestamp: ${DateTime.now()}');

          final session = Supabase.instance.client.auth.currentSession ??
              snapshot.data?.session;

          debugPrint('PayParqApp: session: $session');

          if (session != null) {
            debugPrint('PayParqApp: returning MasterScaffold');
            return const MasterScaffold();
          }

          debugPrint('PayParqApp: returning AuthScreen');
          return const AuthScreen();
        },
      ),
      debugShowCheckedModeBanner: false,
    );
  }
}
