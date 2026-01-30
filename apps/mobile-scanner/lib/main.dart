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

class BootApp extends StatelessWidget {
  const BootApp({super.key});

  Future<void> _initSupabase() async {
    debugPrint('BootApp: starting Supabase.initialize');
    final initFuture = Supabase.initialize(
      url: 'https://iafjygownkhedereaoxw.supabase.co',
      anonKey: 'sb_publishable_ah4iveg_PBowEdtSgQo4Qg_KjLUzWBV',
    ).then((_) {});

    if (kDebugMode) {
      await initFuture.timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          debugPrint('BootApp: Supabase.initialize timeout in debug, continuing');
        },
      );
    } else {
      await initFuture;
    }
    debugPrint('BootApp: _initSupabase completed');
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _initSupabase(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return MaterialApp(
            title: 'payparq.ai',
            theme: AppTheme.lightTheme,
            home: const PulsatingLoadingScreen(),
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
