import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final authStateProvider = StreamProvider<AuthState>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange;
});

final userProfileProvider = StreamProvider<Map<String, dynamic>?>((ref) {
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value(null);

  final controller = StreamController<Map<String, dynamic>?>();

  // 1. Initial fetch with timeout
  Supabase.instance.client
      .from('profiles')
      .select()
      .eq('id', user.id)
      .maybeSingle()
      .timeout(const Duration(seconds: 5))
      .then((data) {
    if (!controller.isClosed) controller.add(data);
  }).catchError((e) {
    debugPrint('Profile Fetch Error/Timeout: $e');
    // If database fetch fails, try to build a basic profile from JWT metadata
    final metadata = user.userMetadata;
    if (metadata != null && !controller.isClosed) {
      controller.add({
        'id': user.id,
        'email': user.email,
        'role': metadata['role'] ?? 'officer',
        'location_id': metadata['location_id'],
        'full_name': metadata['name'] ?? 'User',
      });
    } else {
      if (!controller.isClosed) controller.add(null);
    }
  });

  // 2. Real-time subscription
  final subscription = Supabase.instance.client
      .from('profiles')
      .stream(primaryKey: ['id'])
      .eq('id', user.id)
      .listen((data) {
        if (data.isNotEmpty && !controller.isClosed) {
          controller.add(data.first);
        }
      });

  ref.onDispose(() {
    subscription.cancel();
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

// The currently selected location display_id (5-digit)
final selectedLocationIdProvider = StateProvider<String?>((ref) {
  return null;
});

// Stream of locations available to the user
final availableLocationsProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  final profile = ref.watch(userProfileProvider).value;
  // Fallback to metadata if profile is not yet loaded to prevent "red lot" flicker
  final role = profile?['role'] ?? user.userMetadata?['role'] ?? 'admin';

  final controller = StreamController<List<Map<String, dynamic>>>();

  // Helper to fetch and add to stream
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

      // Auto-select the first lot if none is selected OR current selection is invalid
      final currentSelectedId = ref.read(selectedLocationIdProvider);
      final bool selectionInvalid = currentSelectedId != null &&
          !locations.any((l) => l['display_id'] == currentSelectedId);

      if (locations.isNotEmpty &&
          (currentSelectedId == null || selectionInvalid)) {
        final firstId = locations.first['display_id'];
        if (firstId != null) {
          Future.microtask(() {
            ref.read(selectedLocationIdProvider.notifier).state = firstId;
          });
        }
      }

      if (!controller.isClosed) controller.add(locations);
    } catch (e) {
      debugPrint('Locations Fetch Error: $e');
      if (!controller.isClosed) controller.add([]);
    }
  }

  fetch();

  // Subscribe to changes (simplified)
  final subscription = Supabase.instance.client
      .from('locations')
      .stream(primaryKey: ['id']).listen((_) => fetch(),
          onError: (e) => debugPrint('Loc Stream Error: $e'));

  ref.onDispose(() {
    subscription.cancel();
    controller.close();
  });

  return controller.stream;
});
