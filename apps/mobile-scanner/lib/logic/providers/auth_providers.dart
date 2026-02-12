import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/supabase_service.dart';
import '../../services/performance_monitor.dart';

final authStateProvider = StreamProvider<AuthState>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange;
});

final userProfileProvider = StreamProvider<Map<String, dynamic>?>((ref) {
  debugPrint('userProfileProvider: starting');
  debugPrint('userProfileProvider: timestamp: ${DateTime.now()}');

  final user = Supabase.instance.client.auth.currentUser;
  debugPrint('userProfileProvider: currentUser: $user');

  if (user == null) {
    debugPrint('userProfileProvider: no user, returning null');
    return Stream.value(null);
  }

  final controller = StreamController<Map<String, dynamic>?>();
  debugPrint('userProfileProvider: created controller');

  // IMMEDIATE FALLBACK: Send minimal profile immediately
  final immediateFallback = {
    'id': user.id,
    'email': user.email,
    'role': user.userMetadata?['role'] ?? 'officer',
    'location_id': user.userMetadata?['location_id'],
    'full_name': user.userMetadata?['name'] ?? 'User',
    '_immediate': true,
  };
  debugPrint('userProfileProvider: IMMEDIATE FALLBACK: $immediateFallback');
  controller.add(immediateFallback);

  // Enhanced fallback after 500ms if database is slow
  Future.delayed(const Duration(milliseconds: 500), () {
    if (!controller.isClosed && controller.hasListener) {
      debugPrint('userProfileProvider: Enhanced fallback check');
      // This ensures we have at least some data if database is very slow
    }
  });

  // 1. Initial fetch with timeout (runs in parallel)
  debugPrint('userProfileProvider: starting database fetch');
  final stopwatch = Stopwatch()..start();
  SupabaseService.instance
      .executeQuery<Map<String, dynamic>?>(
    queryId: 'profile_${user.id}',
    timeout: const Duration(seconds: 5),
    query: () => Supabase.instance.client
        .from('profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle(),
  )
      .then((data) {
    stopwatch.stop();
    PerformanceMonitor.instance.recordMetric(
      operation: 'profile_fetch',
      duration: stopwatch.elapsed,
      success: true,
      metadata: {'userId': user.id, 'source': 'database'},
    );

    debugPrint('userProfileProvider: database fetch success: $data');
    if (!controller.isClosed) {
      if (data != null) {
        controller.add(data);
      }
    }
  }).catchError((e) {
    stopwatch.stop();
    PerformanceMonitor.instance.recordMetric(
      operation: 'profile_fetch',
      duration: stopwatch.elapsed,
      success: false,
      metadata: {'userId': user.id, 'error': e.toString()},
    );

    debugPrint('userProfileProvider: database fetch failed: $e');
    // If database fetch fails, try to build a basic profile from JWT metadata
    final metadata = user.userMetadata;
    if (metadata != null && !controller.isClosed) {
      final fallback = {
        'id': user.id,
        'email': user.email,
        'role': metadata['role'] ?? 'officer',
        'location_id': metadata['location_id'],
        'full_name': metadata['name'] ?? 'User',
        '_jwt_fallback': true,
      };
      debugPrint('userProfileProvider: JWT fallback: $fallback');
      controller.add(fallback);
    }
  });

  // 2. Real-time subscription (with debouncing to prevent excessive updates)
  Timer? updateTimer;
  final subscription = Supabase.instance.client
      .from('profiles')
      .stream(primaryKey: ['id'])
      .eq('id', user.id)
      .listen((data) {
        if (data.isNotEmpty && !controller.isClosed) {
          // Debounce updates to prevent excessive rebuilds
          updateTimer?.cancel();
          updateTimer = Timer(const Duration(milliseconds: 300), () {
            if (!controller.isClosed) {
              controller.add(data.first);
            }
          });
        }
      });

  ref.onDispose(() {
    updateTimer?.cancel();
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

// The currently selected location UUID
final selectedLocationUuidProvider = FutureProvider<String?>((ref) async {
  final displayId = ref.watch(selectedLocationIdProvider);
  if (displayId == null) return null;

  try {
    final res = await Supabase.instance.client
        .from('locations')
        .select('id')
        .eq('display_id', displayId)
        .maybeSingle();
    return res?['id'] as String?;
  } catch (e) {
    return null;
  }
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
        debugPrint(
            'availableLocationsProvider role=$role user=${user.id} location_ids=$locIds');
        if (locIds.isEmpty) {
          if (!controller.isClosed) controller.add([]);
          return;
        }
        query = query.filter('id', 'in', locIds);
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
          if (ref.read(selectedLocationIdProvider) == null ||
              selectionInvalid) {
            ref.read(selectedLocationIdProvider.notifier).state = firstId;
          }
        }
      }

      if (!controller.isClosed) controller.add(locations);
    } catch (e) {
      debugPrint('Locations Fetch Error: $e');
      if (!controller.isClosed) controller.add([]);
    }
  }

  fetch();

  Timer? fetchDebounce;
  final subscription = Supabase.instance.client
      .from('locations')
      .stream(primaryKey: ['id']).listen((_) {
    fetchDebounce?.cancel();
    fetchDebounce = Timer(const Duration(milliseconds: 800), () {
      fetch();
    });
  }, onError: (e) => debugPrint('Loc Stream Error: $e'));

  ref.onDispose(() {
    fetchDebounce?.cancel();
    subscription.cancel();
    controller.close();
  });

  return controller.stream;
});
