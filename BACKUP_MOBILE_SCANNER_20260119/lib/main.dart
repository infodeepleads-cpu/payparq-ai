import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'theme.dart';
import 'main_scaffold.dart';
import 'screens/auth_screen.dart';

import 'widgets/pulsating_loading_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://iafjygownkhedereaoxw.supabase.co',
    anonKey: 'sb_publishable_ah4iveg_PBowEdtSgQo4Qg_KjLUzWBV',
  );

  runApp(
    // Wrap entire app in ProviderScope for Riverpod
    const ProviderScope(
      child: PayParqApp(),
    ),
  );
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
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const PulsatingLoadingScreen();
          }

          final session = snapshot.data?.session;
          if (session != null) {
            return const MasterScaffold();
          } else {
            return const AuthScreen();
          }
        },
      ),
      debugShowCheckedModeBanner: false,
    );
  }
}
