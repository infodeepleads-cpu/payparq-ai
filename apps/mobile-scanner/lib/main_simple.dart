import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'theme.dart';
import 'main_scaffold.dart';
import 'screens/auth_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Simple initialization without complex timeout logic
  try {
    await Supabase.initialize(
      url: 'https://iafjygownkhedereaoxw.supabase.co',
      anonKey: 'sb_publishable_ah4iveg_PBowEdtSgQo4Qg_KjLUzWBV',
    );
    print('Supabase initialized successfully');
  } catch (e) {
    print('Supabase initialization error: $e');
  }
  
  runApp(const ProviderScope(child: PayParqApp()));
}

class PayParqApp extends StatelessWidget {
  const PayParqApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'payparq.ai',
      theme: AppTheme.lightTheme,
      home: StreamBuilder<AuthState>(
        stream: Supabase.instance.client.auth.onAuthStateChange,
        builder: (context, snapshot) {
          final session = Supabase.instance.client.auth.currentSession;
          
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