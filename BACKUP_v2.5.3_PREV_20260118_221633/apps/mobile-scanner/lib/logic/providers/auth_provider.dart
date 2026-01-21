import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// Supabase Client Provider
final supabaseProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

// Session Stream Provider (Authentication State)
final sessionProvider = StreamProvider<Session?>((ref) {
  final supabase = ref.watch(supabaseProvider);
  return supabase.auth.onAuthStateChange.map((event) => event.session);
});

// User Role Provider (Mock Logic for Phase 1)
final userRoleProvider = FutureProvider<String>((ref) async {
  final session = ref.watch(sessionProvider).value;
  if (session == null) return 'guest';
  
  // In a real app, fetch from 'profiles' table
  // final user = await ref.read(supabaseProvider).from('profiles').select().eq('id', session.user.id).single();
  // return user['role'];
  
  return 'admin'; // Default to admin for Phase 1 Demo
});
