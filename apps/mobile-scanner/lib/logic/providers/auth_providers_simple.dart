import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final authStateProvider = StreamProvider<AuthState>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange;
});

final userProfileProvider = StreamProvider<Map<String, dynamic>?>((ref) {
  final user = Supabase.instance.client.auth.currentUser;

  if (user == null) {
    return Stream.value(null);
  }

  final controller = StreamController<Map<String, dynamic>?>();

  // Simple immediate fallback
  final immediateFallback = {
    'id': user.id,
    'email': user.email,
    'role': user.userMetadata?['role'] ?? 'admin',
    'location_id': user.userMetadata?['location_id'],
    'full_name': user.userMetadata?['name'] ?? 'User',
  };

  controller.add(immediateFallback);

  // Try to fetch from database
  Supabase.instance.client
      .from('profiles')
      .select()
      .eq('id', user.id)
      .maybeSingle()
      .then((data) {
    if (!controller.isClosed && data != null) {
      controller.add(data);
    }
  }).catchError((e) {
    debugPrint('Database fetch failed: $e');
  });

  ref.onDispose(() {
    controller.close();
  });

  return controller.stream;
});

final userRoleProvider = Provider<String>((ref) {
  final profile = ref.watch(userProfileProvider).value;
  return profile?['role'] ?? 'guest';
});

final userLocationIdProvider = Provider<String?>((ref) {
  final profile = ref.watch(userProfileProvider).value;
  return profile?['location_id'];
});

final selectedLocationIdProvider = StateProvider<String?>((ref) {
  return null;
});

final availableLocationsProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  final profile = ref.watch(userProfileProvider).value;
  final role = profile?['role'] ?? user.userMetadata?['role'] ?? 'admin';

  final controller = StreamController<List<Map<String, dynamic>>>();

  Future<void> fetch() async {
    try {
      dynamic query = Supabase.instance.client.from('locations').select();

      if (role == 'admin') {
        query = query.eq('owner_id', user.id);
      } else if (role == 'officer' || role == 'manager') {
        final assignments = await Supabase.instance.client
            .from('officer_assignments')
            .select('location_id')
            .eq('officer_id', user.id);

        final locIds =
            assignments.map((a) => a['location_id'] as String).toList();
        if (locIds.isEmpty) {
          if (!controller.isClosed) controller.add([]);
          return;
        }
        query = query.filter('display_id', 'in', locIds);
      }

      final data = await query.order('name');
      final List<Map<String, dynamic>> locations =
          List<Map<String, dynamic>>.from(data);

      if (!controller.isClosed) controller.add(locations);
    } catch (e) {
      debugPrint('Locations fetch error: $e');
      if (!controller.isClosed) controller.add([]);
    }
  }

  fetch();

  ref.onDispose(() {
    controller.close();
  });

  return controller.stream;
});
