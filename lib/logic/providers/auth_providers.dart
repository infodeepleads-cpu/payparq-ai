import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/supabase_service.dart';
import '../../services/performance_monitor.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('Initialize in main()');
});

class LocationSelection {
  final String? uuid;
  final String? displayId;
  final String source;
  final bool isValidated;
  LocationSelection({
    this.uuid,
    this.displayId,
    required this.source,
    this.isValidated = false,
  });
}

final RegExp _displayIdRegex = RegExp(r'^\d{5}$');
final RegExp _uuidRegex = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    caseSensitive: false);

bool _isValidDisplayId(String? value) =>
    value != null && _displayIdRegex.hasMatch(value);

bool _isValidUuid(String? value) => value != null && value.isNotEmpty;

Map<String, dynamic>? _findLocationByDisplayId(
  List<Map<String, dynamic>> locations,
  String? displayId,
) {
  if (!_isValidDisplayId(displayId)) return null;
  for (final location in locations) {
    if ((location['display_id'] ?? '').toString() == displayId) {
      return location;
    }
  }
  return null;
}

Map<String, dynamic>? _findLocationByUuid(
  List<Map<String, dynamic>> locations,
  String? uuid,
) {
  if (!_isValidUuid(uuid)) return null;
  for (final location in locations) {
    if ((location['id'] ?? '').toString() == uuid) {
      return location;
    }
  }
  return null;
}

LocationSelection _selectionFromRow(
  Map<String, dynamic>? row, {
  required String source,
}) {
  final uuid = (row?['id'] ?? '').toString();
  final displayId = (row?['display_id'] ?? '').toString();
  return LocationSelection(
    uuid: uuid.isNotEmpty ? uuid : null,
    displayId: _isValidDisplayId(displayId) ? displayId : null,
    source: source,
    isValidated: row != null,
  );
}

Future<void> _clearPersistedLocationSelection(String? userId) async {
  await persistSelectedLocationPreference(
    userId: userId,
    displayId: null,
    uuid: null,
  );
}

String _normalizeRole(String? rawRole) {
  final role = (rawRole ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .replaceAll('-', '_')
      .replaceAll(' ', '_');
  if (role == 'superadmin' || role.startsWith('super_admin')) {
    return 'super_admin';
  }
  if (role.startsWith('admin')) {
    return 'admin';
  }
  if (role.startsWith('manager')) {
    return 'manager';
  }
  if (role.startsWith('officer')) {
    return 'officer';
  }
  return 'officer';
}

bool _isAdminOverrideEmail(String? email) {
  final normalized = (email ?? '').trim().toLowerCase();
  return normalized == 'kzamic@gmail.com' ||
      normalized == 'pension.zamic@gmail.com' ||
      normalized == 'pension.zamic@gmai.com';
}

String _selectedLocationDisplayKeyFor(String userId) =>
    'selected_location_display_id_$userId';

String _selectedLocationUuidKeyFor(String userId) =>
    'selected_location_uuid_$userId';

Future<void> persistSelectedLocationPreference({
  required String? userId,
  String? displayId,
  String? uuid,
}) async {
  final prefs = await SharedPreferences.getInstance();
  final normalizedDisplayId =
      (displayId != null && displayId.isNotEmpty) ? displayId : null;
  final normalizedUuid = (uuid != null && uuid.isNotEmpty) ? uuid : null;

  final isScoped = userId != null && userId.isNotEmpty;
  if (normalizedDisplayId != null) {
    if (isScoped) {
      await prefs.setString(
          _selectedLocationDisplayKeyFor(userId), normalizedDisplayId);
      await prefs.remove('selected_location_display_id');
    } else {
      await prefs.setString(
          'selected_location_display_id', normalizedDisplayId);
    }
  } else {
    if (isScoped) {
      await prefs.remove(_selectedLocationDisplayKeyFor(userId));
      await prefs.remove('selected_location_display_id');
    } else {
      await prefs.remove('selected_location_display_id');
    }
  }

  if (normalizedUuid != null) {
    if (isScoped) {
      await prefs.setString(
          _selectedLocationUuidKeyFor(userId), normalizedUuid);
      await prefs.remove('selected_location_uuid');
    } else {
      await prefs.setString('selected_location_uuid', normalizedUuid);
    }
  } else {
    if (isScoped) {
      await prefs.remove(_selectedLocationUuidKeyFor(userId));
      await prefs.remove('selected_location_uuid');
    } else {
      await prefs.remove('selected_location_uuid');
    }
  }
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
  final metadata = user.userMetadata;
  if (metadata != null && !controller.isClosed) {
    controller.add({
      'id': user.id,
      'email': user.email,
      'role': _normalizeRole(metadata['role']?.toString()),
      'location_id': metadata['location_id'],
      'location_display_id': metadata['location_display_id'],
      'location_name': metadata['location_name'],
      'full_name': metadata['name'] ?? 'User',
      '_jwt_warm_start': true,
    });
  }

  // 1. Initial fetch with timeout and RETRY
  final stopwatch = Stopwatch()..start();

  Future<Map<String, dynamic>?> fetchProfile({int attempt = 1}) async {
    try {
      final data =
          await SupabaseService.instance.executeQuery<Map<String, dynamic>?>(
        queryId: 'profile_${user.id}_attempt_$attempt',
        timeout: Duration(seconds: attempt == 1 ? 8 : 15), // Increased timeouts
        query: () => Supabase.instance.client
            .from('profiles')
            .select()
            .eq('id', user.id)
            .maybeSingle(),
      );
      return data;
    } catch (e) {
      final errorStr = e.toString().toLowerCase();
      final isNetworkError = errorStr.contains('connection') ||
          errorStr.contains('socket') ||
          errorStr.contains('network') ||
          errorStr.contains('failed to host');

      if (attempt < 4 && isNetworkError) {
        // More attempts for network issues
        debugPrint(
            'Profile fetch attempt $attempt failed (network), retrying in ${attempt}s...');
        await Future.delayed(Duration(seconds: attempt));
        return fetchProfile(attempt: attempt + 1);
      }
      debugPrint('Profile fetch failed after $attempt attempts: $e');
      return null; // Return null instead of rethrowing to avoid stream error
    }
  }

  fetchProfile().then((data) {
    stopwatch.stop();
    if (data != null) {
      final mergedData = {
        ...data,
        'location_id': data['location_id'] ?? metadata?['location_id'],
        'location_display_id':
            data['location_display_id'] ?? metadata?['location_display_id'],
        'location_name': data['location_name'] ?? metadata?['location_name'],
      };
      PerformanceMonitor.instance.recordMetric(
        operation: 'profile_fetch',
        duration: stopwatch.elapsed,
        success: true,
        metadata: {'userId': user.id, 'source': 'database'},
      );
      if (!controller.isClosed) {
        controller.add(mergedData);
      }
    } else {
      if (metadata != null && !controller.isClosed) {
        final fallback = {
          'id': user.id,
          'email': user.email,
          'role': _normalizeRole(metadata['role']?.toString()),
          'location_id': metadata['location_id'],
          'location_display_id': metadata['location_display_id'],
          'location_name': metadata['location_name'],
          'full_name': metadata['name'] ?? 'User',
          '_jwt_fallback_after_fail': true,
        };
        controller.add(fallback);
      }
    }
  }).catchError((e) {
    stopwatch.stop();
    debugPrint('Unexpected error in userProfileProvider: $e');
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
final selectedLocationIdProvider = StateProvider<String?>((ref) => null);

final activeLocationSelectionProvider =
    FutureProvider<LocationSelection>((ref) async {
  final locations = await ref.watch(availableLocationsProvider.future);
  final user = Supabase.instance.client.auth.currentUser;
  final userId = user?.id;
  final profile = ref.read(userProfileProvider).value;
  final prefs = await SharedPreferences.getInstance();
  final currentSelectedDisplayId = ref.watch(selectedLocationIdProvider);
  final savedDisplayId = userId != null && userId.isNotEmpty
      ? prefs.getString(_selectedLocationDisplayKeyFor(userId))
      : null;
  final savedUuid = userId != null && userId.isNotEmpty
      ? prefs.getString(_selectedLocationUuidKeyFor(userId))
      : null;
  final metadataDisplayId = (profile?['location_display_id'] ??
          user?.userMetadata?['location_display_id'])
      ?.toString();
  final metadataLocationId =
      (profile?['location_id'] ?? user?.userMetadata?['location_id'])
          ?.toString();

  Map<String, dynamic>? matchedRow =
      _findLocationByDisplayId(locations, currentSelectedDisplayId);
  String source = 'selected_display';

  matchedRow ??= _findLocationByDisplayId(locations, savedDisplayId);
  if (matchedRow != null) {
    source = 'saved_display';
  }

  matchedRow ??= _findLocationByUuid(locations, savedUuid);
  if (matchedRow != null && source == 'selected_display') {
    source = 'saved_uuid';
  }

  matchedRow ??= _findLocationByDisplayId(locations, metadataDisplayId);
  if (matchedRow != null && source == 'selected_display') {
    source = 'metadata_display';
  }

  matchedRow ??= _findLocationByUuid(locations, metadataLocationId);
  if (matchedRow != null && source == 'selected_display') {
    source = 'metadata_uuid';
  }

  if (matchedRow == null && locations.isNotEmpty) {
    matchedRow = locations.first;
    source = 'first_accessible';
  }

  if (matchedRow != null) {
    final selection = _selectionFromRow(matchedRow, source: source);
    if (selection.displayId != null) {
      await persistSelectedLocationPreference(
        userId: userId,
        displayId: selection.displayId,
        uuid: selection.uuid,
      );
      final current = ref.read(selectedLocationIdProvider);
      if (current != selection.displayId) {
        ref.read(selectedLocationIdProvider.notifier).state =
            selection.displayId;
      }
    }
    return selection;
  }

  if (ref.read(selectedLocationIdProvider) != null) {
    ref.read(selectedLocationIdProvider.notifier).state = null;
  }
  await _clearPersistedLocationSelection(userId);
  return LocationSelection(source: 'none');
});

final selectedLocationUuidProvider = FutureProvider<String?>((ref) async {
  final selection = await ref.watch(activeLocationSelectionProvider.future);
  return selection.isValidated ? selection.uuid : null;
});

final selectedEffectiveLocationUuidProvider =
    FutureProvider<String?>((ref) async {
  final selection = await ref.watch(activeLocationSelectionProvider.future);
  return selection.isValidated ? selection.uuid : null;
});

final guaranteedLocationSelectionProvider =
    FutureProvider<LocationSelection>((ref) async {
  return ref.watch(activeLocationSelectionProvider.future);
});
// Stream of locations available to the user
final availableLocationsProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  // Keep reactive dependency so this provider refreshes when profile updates
  ref.watch(userProfileProvider);

  final controller = StreamController<List<Map<String, dynamic>>>();
  var hasEmitted = false;

  void emit(List<Map<String, dynamic>> value) {
    if (controller.isClosed) return;
    hasEmitted = true;
    controller.add(value);
  }

  var fetchInFlight = false;
  DateTime? lastFetchAt;

  final initialRole = _normalizeRole(user.userMetadata?['role']?.toString());
  if (initialRole == 'super_admin') {
    try {
      final prefs = ref.read(sharedPreferencesProvider);
      final cachedJson =
          prefs.getString('cached_available_locations_${user.id}');
      if (cachedJson != null) {
        final List<dynamic> decoded = jsonDecode(cachedJson);
        final List<Map<String, dynamic>> cachedList =
            List<Map<String, dynamic>>.from(decoded);
        if (cachedList.isNotEmpty) {
          emit(cachedList);
        }
      }
    } catch (_) {}
  }

  // Helper to fetch and add to stream
  Future<void> fetch({int attempt = 1, bool force = false}) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null || controller.isClosed) return;
    if (fetchInFlight) return;
    final now = DateTime.now();
    if (!force &&
        lastFetchAt != null &&
        now.difference(lastFetchAt!) < const Duration(milliseconds: 750)) {
      return;
    }
    fetchInFlight = true;

    try {
      final queryTimeout = Duration(seconds: attempt == 1 ? 5 : 10);
      List<Map<String, dynamic>> data = [];

      final liveProfile = ref.read(userProfileProvider).value;
      final role = _normalizeRole(
          (liveProfile?['role'] ?? user.userMetadata?['role'])?.toString());

      if (role == 'super_admin') {
        final all = await SupabaseService.instance.executeQuery<List<dynamic>>(
          queryId: 'loc_all_accessible_${user.id}_att$attempt',
          timeout: queryTimeout,
          query: () =>
              Supabase.instance.client.from('locations').select().order('name'),
        );
        data = List<Map<String, dynamic>>.from(all);
      } else {
        final ownedFuture =
            SupabaseService.instance.executeQuery<List<dynamic>>(
          queryId: 'loc_owned_${user.id}_att$attempt',
          timeout: queryTimeout,
          query: () => Supabase.instance.client
              .from('locations')
              .select('id')
              .eq('owner_id', user.id),
        );
        final assignedFuture =
            SupabaseService.instance.executeQuery<List<dynamic>>(
          queryId: 'loc_assigned_${user.id}_att$attempt',
          timeout: queryTimeout,
          query: () => Supabase.instance.client
              .from('officer_assignments')
              .select('location_id')
              .eq('officer_id', user.id),
        );
        final profileFuture =
            SupabaseService.instance.executeQuery<Map<String, dynamic>?>(
          queryId: 'profile_location_${user.id}_att$attempt',
          timeout: queryTimeout,
          query: () => Supabase.instance.client
              .from('profiles')
              .select('location_id, location_display_id')
              .eq('id', user.id)
              .maybeSingle(),
        );

        final ownedRows = await ownedFuture;
        final assignedRows = await assignedFuture;
        final profileRow = await profileFuture;
        final ids = <String>{};
        final owned = List<Map<String, dynamic>>.from(ownedRows);
        final assigned = List<Map<String, dynamic>>.from(assignedRows);

        for (final loc in owned) {
          final v = (loc['id'] ?? '').toString();
          if (v.isNotEmpty) ids.add(v);
        }
        for (final a in assigned) {
          final v = (a['location_id'] ?? '').toString();
          if (v.isNotEmpty) ids.add(v);
        }

        final mergedLocations = <Map<String, dynamic>>[];
        final fetchFutures = <Future<void>>[];
        final fallbackLocId = ref.read(userLocationIdProvider) ??
            liveProfile?['location_id']?.toString() ??
            profileRow?['location_id']?.toString() ??
            user.userMetadata?['location_id']?.toString();
        final fallbackDisplayId =
            (fallbackLocId == null || fallbackLocId.isEmpty)
                ? ((liveProfile?['location_display_id']?.toString()) ??
                    (profileRow?['location_display_id']?.toString()) ??
                    (user.userMetadata?['location_display_id']?.toString()))
                : null;

        if (ids.isNotEmpty) {
          fetchFutures.add(SupabaseService.instance
              .executeQuery<List<dynamic>>(
            queryId: 'loc_details_${user.id}_att$attempt',
            timeout: queryTimeout,
            query: () => Supabase.instance.client
                .from('locations')
                .select()
                .or(ids.map((id) => 'id.eq.$id').join(',')),
          )
              .then((rows) {
            mergedLocations.addAll(List<Map<String, dynamic>>.from(rows));
          }));
        }

        if (fallbackDisplayId != null && fallbackDisplayId.isNotEmpty) {
          fetchFutures.add(SupabaseService.instance
              .executeQuery<Map<String, dynamic>?>(
            queryId: 'loc_profile_display_${fallbackDisplayId}_att$attempt',
            timeout: queryTimeout,
            query: () => Supabase.instance.client
                .from('locations')
                .select()
                .eq('display_id', fallbackDisplayId)
                .maybeSingle(),
          )
              .then((profileLoc) {
            if (profileLoc != null &&
                !mergedLocations.any((l) => l['id'] == profileLoc['id'])) {
              mergedLocations.add(profileLoc);
            }
          }).catchError((_) {}));
        }

        if (fallbackLocId != null && fallbackLocId.isNotEmpty) {
          final isUuid = _uuidRegex.hasMatch(fallbackLocId.toLowerCase());
          fetchFutures.add(SupabaseService.instance
              .executeQuery<Map<String, dynamic>?>(
            queryId: 'loc_fallback_${fallbackLocId}_att$attempt',
            timeout: queryTimeout,
            query: () => Supabase.instance.client
                .from('locations')
                .select()
                .eq(isUuid ? 'id' : 'display_id', fallbackLocId)
                .maybeSingle(),
          )
              .then((fb) {
            if (fb != null &&
                !mergedLocations.any((l) => l['id'] == fb['id'])) {
              mergedLocations.add(fb);
            }
          }).catchError((_) {}));
        }

        await Future.wait(fetchFutures);
        mergedLocations.sort((a, b) => (a['name'] ?? '')
            .toString()
            .compareTo((b['name'] ?? '').toString()));
        data = mergedLocations;
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

      // Restore persisted selection
      final currentSelectedId = ref.read(selectedLocationIdProvider);
      final prefs = await SharedPreferences.getInstance();
      final savedId = prefs.getString(_selectedLocationDisplayKeyFor(user.id));
      final savedUuid = prefs.getString(_selectedLocationUuidKeyFor(user.id));
      final bool currentSelectedValid = _isValidDisplayId(currentSelectedId) &&
          uniqueLocations.any(
            (l) => l['display_id']?.toString() == currentSelectedId,
          );
      final bool savedValid = _isValidDisplayId(savedId);

      if (currentSelectedValid) {
        final row = uniqueLocations.firstWhere(
          (l) => l['display_id']?.toString() == currentSelectedId,
        );
        final currentUuid = (row['id'] ?? '').toString();
        if (savedId != currentSelectedId || savedUuid != currentUuid) {
          await persistSelectedLocationPreference(
            userId: user.id,
            displayId: currentSelectedId,
            uuid: currentUuid.isNotEmpty ? currentUuid : null,
          );
        }
      } else if (savedValid &&
          uniqueLocations.any((l) => l['display_id']?.toString() == savedId)) {
        if (currentSelectedId != savedId) {
          ref.read(selectedLocationIdProvider.notifier).state = savedId;
        }
        // Cache the UUID if we found it
        final row = uniqueLocations
            .firstWhere((l) => l['display_id']?.toString() == savedId);
        final uuid = (row['id'] ?? '').toString();
        if (uuid.isNotEmpty) {
          await persistSelectedLocationPreference(
            userId: user.id,
            displayId: savedId,
            uuid: uuid,
          );
        }
      } else if (uniqueLocations.isNotEmpty &&
          (currentSelectedId == null ||
              !uniqueLocations
                  .any((l) => l['display_id'] == currentSelectedId))) {
        final firstId = uniqueLocations.first['display_id']?.toString();
        final firstUuid = uniqueLocations.first['id']?.toString();
        if (firstId != null && firstId.isNotEmpty) {
          ref.read(selectedLocationIdProvider.notifier).state = firstId;
          await persistSelectedLocationPreference(
            userId: user.id,
            displayId: firstId,
            uuid:
                (firstUuid != null && firstUuid.isNotEmpty) ? firstUuid : null,
          );
        }
      }

      if (!controller.isClosed) {
        emit(uniqueLocations);
        // Save to cache
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('cached_available_locations_${user.id}',
              jsonEncode(uniqueLocations));
        } catch (e) {
          debugPrint('Error saving locations to cache: $e');
        }
      }
    } catch (e) {
      debugPrint('availableLocationsProvider fetch attempt $attempt error: $e');
      final errorStr = e.toString().toLowerCase();
      final isNetworkError = errorStr.contains('connection') ||
          errorStr.contains('socket') ||
          errorStr.contains('network') ||
          errorStr.contains('failed to host');

      if (attempt < 4 && isNetworkError && !controller.isClosed) {
        await Future.delayed(Duration(seconds: attempt));
        return fetch(attempt: attempt + 1, force: true);
      }

      // If we failed all retries, don't emit error, just return empty list or keep current
      if (!controller.isClosed) {
        if (!hasEmitted) {
          emit(const []);
        }
        // Only add empty list if we don't have ANY data yet
        // If we have some data (from initial emit), we'd rather keep it
        debugPrint(
            'availableLocationsProvider: failed all attempts, suppressing error.');
      }
    } finally {
      fetchInFlight = false;
      lastFetchAt = DateTime.now();
    }
  }

  fetch();

  Timer? fetchDebounce;
  final subscription = Supabase.instance.client
      .from('locations')
      .stream(primaryKey: ['id']).listen((_) {
    fetchDebounce?.cancel();
    fetchDebounce = Timer(const Duration(milliseconds: 100), () {
      fetch(force: true);
    });
  }, onError: (e) => debugPrint('Loc Stream Error: $e'));

  ref.onDispose(() {
    fetchDebounce?.cancel();
    subscription.cancel();
    controller.close();
  });

  return controller.stream;
});
