import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/supabase_service.dart';
import '../../services/performance_monitor.dart';

class LocationSelection {
  final String? uuid;
  final String? displayId;
  final String source;
  LocationSelection({this.uuid, this.displayId, required this.source});
}

String _normalizeRole(String? rawRole) {
  final role = (rawRole ?? '').toString().trim().toLowerCase();
  if (role == 'super_admin' ||
      role == 'admin' ||
      role == 'manager' ||
      role == 'officer') {
    return role;
  }
  return 'admin';
}

bool _isAdminOverrideEmail(String? email) {
  final normalized = (email ?? '').trim().toLowerCase();
  return normalized == 'kzamic@gmail.com' ||
      normalized == 'pension.zamic@gmail.com' ||
      normalized == 'pension.zamic@gmai.com';
}

final authStateProvider = StreamProvider<AuthState>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange;
});

final userProfileProvider = StreamProvider<Map<String, dynamic>?>((ref) {
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) {
    return Stream.value(null);
  }

  final controller = StreamController<Map<String, dynamic>?>(sync: true);

  // IMMEDIATE FALLBACK: Send minimal profile immediately
  final immediateFallback = {
    'id': user.id,
    'email': user.email,
    'role': user.userMetadata?['role'] ?? 'admin',
    'location_id': user.userMetadata?['location_id'],
    'full_name': user.userMetadata?['name'] ?? 'User',
    '_immediate': true,
  };
  controller.add(immediateFallback);

  // 1. Initial fetch with timeout (runs in parallel)
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

    // If database fetch fails, try to build a basic profile from JWT metadata
    final metadata = user.userMetadata;
    if (metadata != null && !controller.isClosed) {
      final fallback = {
        'id': user.id,
        'email': user.email,
        'role': metadata['role'] ?? 'admin',
        'location_id': metadata['location_id'],
        'full_name': metadata['name'] ?? 'User',
        '_jwt_fallback': true,
      };
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
          updateTimer = Timer(const Duration(milliseconds: 120), () {
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
  final user = Supabase.instance.client.auth.currentUser;
  final email =
      (profile?['email'] ?? user?.email)?.toString().trim().toLowerCase();
  if (_isAdminOverrideEmail(email)) return 'admin';
  return _normalizeRole(
      (profile?['role'] ?? user?.userMetadata?['role'])?.toString());
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

  final available = ref.watch(availableLocationsProvider).value;
  if (available != null) {
    for (final loc in available) {
      if ((loc['display_id'] ?? '').toString() == displayId) {
        final id = (loc['id'] ?? '').toString();
        if (id.isNotEmpty) return id;
      }
    }
  }

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

final selectedEffectiveLocationUuidProvider =
    FutureProvider<String?>((ref) async {
  final selectedUuid = await ref.watch(selectedLocationUuidProvider.future);
  if (selectedUuid != null && selectedUuid.isNotEmpty) return selectedUuid;

  final role = ref.watch(userRoleProvider);
  if (role == 'officer') {
    return null;
  }

  final available = ref.watch(availableLocationsProvider);
  if (available.hasValue) {
    final locs = available.value ?? [];
    if (locs.isNotEmpty) {
      final id = (locs.first['id'] ?? '').toString();
      if (id.isNotEmpty) return id;
    }
  }

  final user = Supabase.instance.client.auth.currentUser;
  final fallbackId =
      ref.watch(userLocationIdProvider) ?? user?.userMetadata?['location_id'];
  if (fallbackId == null) return null;
  final fb = fallbackId.toString();
  final isUuid = RegExp(
          r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
          caseSensitive: false)
      .hasMatch(fb.toLowerCase());
  if (isUuid) return fb;

  try {
    final res = await Supabase.instance.client
        .from('locations')
        .select('id')
        .eq('display_id', fb)
        .maybeSingle();
    final id = res?['id']?.toString();
    if (id != null && id.isNotEmpty) return id;
  } catch (_) {}
  return null;
});

final guaranteedLocationSelectionProvider =
    FutureProvider<LocationSelection>((ref) async {
  final locations = await ref.watch(availableLocationsProvider.future);
  final prefs = await SharedPreferences.getInstance();
  final saved = prefs.getString('selected_location_display_id');
  String? displayId;
  String? uuid;
  final savedValid = saved != null && RegExp(r'^\d{5}$').hasMatch(saved);
  if (saved != null && !savedValid) {
    await prefs.remove('selected_location_display_id');
  }
  if (savedValid &&
      locations.any((l) => (l['display_id'] ?? '').toString() == saved)) {
    displayId = saved;
    final row = locations
        .firstWhere((l) => (l['display_id'] ?? '').toString() == saved);
    uuid = (row['id'] ?? '').toString();
  } else if (locations.isNotEmpty) {
    final row = locations.first;
    displayId = (row['display_id'] ?? '').toString();
    uuid = (row['id'] ?? '').toString();
    if (displayId.isNotEmpty) {
      await prefs.setString('selected_location_display_id', displayId);
    }
  } else {
    final fb = ref.read(userLocationIdProvider);
    uuid = (fb ?? '').toString();
  }
  if (displayId != null && displayId.isNotEmpty) {
    final current = ref.read(selectedLocationIdProvider);
    if (current != displayId) {
      ref.read(selectedLocationIdProvider.notifier).state = displayId;
    }
  }
  return LocationSelection(
      uuid: uuid, displayId: displayId, source: 'guaranteed');
});
// Stream of locations available to the user
final availableLocationsProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  final profile = ref.watch(userProfileProvider).value;
  // Fallback to metadata if profile is not yet loaded to prevent "red lot" flicker
  final role = _normalizeRole(
      (profile?['role'] ?? user.userMetadata?['role'])?.toString());

  final controller = StreamController<List<Map<String, dynamic>>>();

  // Helper to fetch and add to stream
  Future<void> fetch() async {
    try {
      List<Map<String, dynamic>> data = [];
      final email =
          (profile?['email'] ?? user.email)?.toString().trim().toLowerCase();
      if (role == 'admin' || role == 'manager' || role == 'officer') {
        final responses = await Future.wait([
          Supabase.instance.client
              .from('locations')
              .select('id')
              .eq('owner_id', user.id),
          Supabase.instance.client
              .from('officer_assignments')
              .select('location_id')
              .eq('officer_id', user.id),
        ]);
        final owned = List<Map<String, dynamic>>.from(responses[0] as List);
        final assigned = List<Map<String, dynamic>>.from(responses[1] as List);
        final ids = <String>{};
        for (final loc in owned) {
          final v = (loc['id'] ?? '').toString();
          if (v.isNotEmpty) ids.add(v);
        }
        for (final a in assigned) {
          final v = (a['location_id'] ?? '').toString();
          if (v.isNotEmpty) ids.add(v);
        }
        debugPrint(
            'availableLocationsProvider role=$role user=${user.id} merged_ids=$ids');
        final List<Map<String, dynamic>> mergedLocations = [];
        if (ids.isNotEmpty) {
          final filter = ids.map((id) => 'id.eq.$id').join(',');
          final rows = await Supabase.instance.client
              .from('locations')
              .select()
              .or(filter);
          final List<Map<String, dynamic>> acc =
              List<Map<String, dynamic>>.from(rows);
          acc.sort((a, b) => (a['name'] ?? '')
              .toString()
              .compareTo((b['name'] ?? '').toString()));
          mergedLocations.addAll(acc);
        }
        final selectedDisplayId = ref.read(selectedLocationIdProvider);
        final fallbackLocId = ref.read(userLocationIdProvider) ??
            user.userMetadata?['location_id'];
        if (selectedDisplayId != null &&
            !mergedLocations.any((l) => l['display_id'] == selectedDisplayId)) {
          try {
            final sel = await Supabase.instance.client
                .from('locations')
                .select()
                .eq('display_id', selectedDisplayId)
                .maybeSingle();
            if (sel != null) mergedLocations.add(sel);
          } catch (_) {}
        }
        if (fallbackLocId != null &&
            !mergedLocations.any((l) =>
                l['id']?.toString() == fallbackLocId ||
                l['display_id']?.toString() == fallbackLocId)) {
          try {
            final isUuid = RegExp(
                    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                    caseSensitive: false)
                .hasMatch(fallbackLocId.toLowerCase());
            final fb = await Supabase.instance.client
                .from('locations')
                .select()
                .eq(isUuid ? 'id' : 'display_id', fallbackLocId)
                .maybeSingle();
            if (fb != null) mergedLocations.add(fb);
          } catch (_) {}
        }
        if (mergedLocations.isEmpty &&
            (role == 'admin' || _isAdminOverrideEmail(email))) {
          try {
            final all = await Supabase.instance.client
                .from('locations')
                .select()
                .order('name');
            mergedLocations.addAll(List<Map<String, dynamic>>.from(all));
          } catch (_) {}
        }
        mergedLocations.sort((a, b) => (a['name'] ?? '')
            .toString()
            .compareTo((b['name'] ?? '').toString()));
        data = mergedLocations;
      } else {
        final all = await Supabase.instance.client
            .from('locations')
            .select()
            .order('name');
        data = List<Map<String, dynamic>>.from(all);
      }
      final List<Map<String, dynamic>> locations =
          List<Map<String, dynamic>>.from(data);
      final Map<String, Map<String, dynamic>> byKey = {};
      for (final l in locations) {
        final did = (l['display_id'] ?? '').toString();
        final id = (l['id'] ?? '').toString();
        final key = did.isNotEmpty ? 'did:$did' : 'id:$id';
        if (key != 'id:') byKey[key] = l;
      }
      final uniqueLocations = byKey.values.toList();

      // Restore persisted selection or auto-select first available for all roles
      final currentSelectedId = ref.read(selectedLocationIdProvider);
      final bool selectionInvalid = currentSelectedId != null &&
          !uniqueLocations.any((l) => l['display_id'] == currentSelectedId);
      final prefs = await SharedPreferences.getInstance();
      final savedId = prefs.getString('selected_location_display_id');
      final bool savedValid =
          (savedId != null) && RegExp(r'^\d{5}$').hasMatch(savedId);
      if (savedValid &&
          uniqueLocations.any((l) => l['display_id']?.toString() == savedId)) {
        if (currentSelectedId != savedId) {
          ref.read(selectedLocationIdProvider.notifier).state = savedId;
        }
      } else if (uniqueLocations.isNotEmpty &&
          (currentSelectedId == null || selectionInvalid)) {
        final firstId = uniqueLocations.first['display_id']?.toString();
        if (firstId != null && firstId.isNotEmpty) {
          ref.read(selectedLocationIdProvider.notifier).state = firstId;
          await prefs.setString('selected_location_display_id', firstId);
        } else {
          ref.read(selectedLocationIdProvider.notifier).state = null;
          await prefs.remove('selected_location_display_id');
        }
      } else if (uniqueLocations.isEmpty && currentSelectedId != null) {
        ref.read(selectedLocationIdProvider.notifier).state = null;
        await prefs.remove('selected_location_display_id');
      }

      if (!controller.isClosed) controller.add(uniqueLocations);
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
    fetchDebounce = Timer(const Duration(milliseconds: 80), () {
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
