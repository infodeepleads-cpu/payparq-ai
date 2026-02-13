import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../logic/providers/auth_providers.dart';

List<Map<String, dynamic>> _decodeList(String raw) {
  final decoded = jsonDecode(raw);
  if (decoded is! List) return [];
  return decoded
      .whereType<Map>()
      .map((e) => Map<String, dynamic>.from(e))
      .toList();
}

Future<void> _clearCachePrefixes(Set<String> prefixes) async {
  final prefs = await SharedPreferences.getInstance();
  final keys = prefs.getKeys();
  for (final k in keys) {
    for (final p in prefixes) {
      if (k.startsWith(p)) {
        await prefs.remove(k);
        break;
      }
    }
  }
}

Stream<List<Map<String, dynamic>>> _cachedStream(
    String key, Stream<List<Map<String, dynamic>>> live) async* {
  final prefs = await SharedPreferences.getInstance();
  final cached = prefs.getString(key);
  if (cached != null) {
    yield _decodeList(cached);
  }
  yield* live.map((data) {
    prefs.setString(key, jsonEncode(data));
    return data;
  });
}

/// Repository for handling all parking-related data interactions with Supabase.
/// This abstracts the data layer from the UI, following Clean Architecture principles.
class ParkingRepository {
  final SupabaseClient _client;

  ParkingRepository(this._client);

  /// Streams list of parking permits (users/subscriptions).
  Stream<List<Map<String, dynamic>>> getPermitsStream({String? locationId}) {
    debugPrint('getPermitsStream locationId=$locationId');
    if (locationId != null) {
      final isUuid = RegExp(
              r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
              caseSensitive: false)
          .hasMatch(locationId.toLowerCase());
      if (isUuid) {
        return _client
            .from('parking_permits')
            .stream(primaryKey: ['id'])
            .eq('location_id', locationId)
            .order('created_at', ascending: false);
      }
    }
    debugPrint('getPermitsStream global stream');
    return _client
        .from('parking_permits')
        .stream(primaryKey: ['id']).order('created_at', ascending: false);
  }

  /// Streams list of active parking sessions (scan/pay).
  Stream<List<Map<String, dynamic>>> getSessionsStream({String? locationId}) {
    debugPrint('getSessionsStream locationId=$locationId');
    if (locationId != null) {
      final isUuid = RegExp(
              r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
              caseSensitive: false)
          .hasMatch(locationId.toLowerCase());
      if (isUuid) {
        return _client
            .from('parking_sessions')
            .stream(primaryKey: ['id'])
            .eq('location_id', locationId)
            .order('created_at', ascending: false);
      }
    }
    debugPrint('getSessionsStream global stream');
    return _client
        .from('parking_sessions')
        .stream(primaryKey: ['id']).order('created_at', ascending: false);
  }

  /// Streams location data (occupancy, settings).
  Stream<List<Map<String, dynamic>>> getLocationsStream(
      {String? locationId, String? ownerId}) {
    debugPrint('getLocationsStream locationId=$locationId ownerId=$ownerId');
    if (ownerId != null) {
      return _client
          .from('locations')
          .stream(primaryKey: ['id'])
          .eq('owner_id', ownerId)
          .order('updated_at', ascending: false);
    } else if (locationId != null) {
      // Check if it's a UUID or display_id
      final isUuid = RegExp(
              r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
          .hasMatch(locationId.toLowerCase());
      return _client
          .from('locations')
          .stream(primaryKey: ['id'])
          .eq(isUuid ? 'id' : 'display_id', locationId)
          .order('updated_at', ascending: false);
    }
    debugPrint('getLocationsStream global stream');

    return _client
        .from('locations')
        .stream(primaryKey: ['id']).order('updated_at', ascending: false);
  }

  /// Streams list of enforcement violations (cases).
  Stream<List<Map<String, dynamic>>> getViolationsStream({String? locationId}) {
    debugPrint('getViolationsStream locationId=$locationId');
    if (locationId != null) {
      // Check if it's a UUID or display_id
      final isUuid = RegExp(
              r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
          .hasMatch(locationId.toLowerCase());
      // Note: RLS handles the complex filtering, but we can do a simple eq if we have a UUID
      if (isUuid) {
        return _client
            .from('violations')
            .stream(primaryKey: ['id'])
            .eq('location_id', locationId)
            .order('issued_at', ascending: false);
      }
    }
    debugPrint('getViolationsStream global stream');
    return _client
        .from('violations')
        .stream(primaryKey: ['id']).order('issued_at', ascending: false);
  }

  /// Streams list of staff (profiles).
  Stream<List<Map<String, dynamic>>> getStaffStream(
      {String? locationId, bool isSuperAdmin = false}) {
    if (locationId != null) {
      return _client
          .from('profiles')
          .stream(primaryKey: ['id'])
          .eq('location_id', locationId)
          .order('created_at', ascending: false);
    }

    return _client
        .from('profiles')
        .stream(primaryKey: ['id']).order('created_at', ascending: false);
  }

  /// Deletes a parking permit.
  Future<void> deletePermit(String id) async {
    await _client.from('parking_permits').delete().eq('id', id);
  }

  /// Deletes a staff member (Auth + Profile).
  Future<void> deleteStaff(String id) async {
    // We must use an Edge Function to delete from Auth as well
    await _client.functions.invoke('delete-staff', body: {'userId': id});
  }

  /// Deletes a location.
  Future<void> deleteLocation(String id) async {
    await _client.from('locations').delete().eq('id', id);
  }
}

/// Provider for the ParkingRepository.
/// UI widgets should watch this provider to access repository methods.
final parkingRepositoryProvider = Provider<ParkingRepository>((ref) {
  return ParkingRepository(Supabase.instance.client);
});

final cacheInvalidationProvider = Provider<void>((ref) {
  final role = ref.watch(userRoleProvider);
  ref.listen<String?>(selectedLocationIdProvider, (prev, next) {
    _clearCachePrefixes({
      'permits_${role}_',
      'sessions_${role}_',
      'violations_${role}_',
      'staff_${role}_',
    });
  });
  final user = Supabase.instance.client.auth.currentUser;
  if (user != null) {
    Timer? debounce;
    final sub = Supabase.instance.client
        .from('officer_assignments')
        .stream(primaryKey: ['id'])
        .eq('officer_id', user.id)
        .listen((_) {
          debounce?.cancel();
          debounce = Timer(const Duration(milliseconds: 500), () {
            _clearCachePrefixes({'violations_'});
          });
        });
    ref.onDispose(() {
      debounce?.cancel();
      sub.cancel();
    });
  }
  return;
});

/// Stream Providers for easier consumption in UI
final permitsStreamProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(cacheInvalidationProvider);
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  final role = profile?['role'] ?? user.userMetadata?['role'] ?? 'admin';
  final isSuperAdmin = role == 'super_admin';
  final isAdmin = role == 'admin';
  final isManager = role == 'manager';
  final isOfficer = role == 'officer';
  if (isSuperAdmin) {
    debugPrint('permitsStreamProvider role=$role user=${user.id} path=global');
    final effUuid = ref.watch(selectedEffectiveLocationUuidProvider).value;
    final baseStream = (effUuid != null && effUuid.isNotEmpty)
        ? repo.getPermitsStream(locationId: effUuid)
        : repo.getPermitsStream();
    final cacheKey = 'permits_super_admin_${effUuid ?? 'all'}';
    final locsAsync = ref.watch(availableLocationsProvider);
    final Map<String, String> idToDisplay = {};
    if (locsAsync.hasValue) {
      for (final l in (locsAsync.value ?? [])) {
        final id = (l['id'] ?? '').toString();
        final did = (l['display_id'] ?? '').toString();
        if (id.isNotEmpty && did.isNotEmpty) idToDisplay[id] = did;
      }
    }
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    final uuidRegExp = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false);
    return _cachedStream(cacheKey, baseStream).map((items) {
      return items.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        String uiDid = raw;
        if (uuidRegExp.hasMatch(raw.toLowerCase())) {
          uiDid = idToDisplay[raw] ?? (selectedDisplayId ?? raw);
        }
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  if (isAdmin || isManager || isOfficer) {
    final locationsAsync = ref.watch(availableLocationsProvider);
    if (!locationsAsync.hasValue) return repo.getPermitsStream();
    final locs = locationsAsync.value ?? [];
    final ownedIds = <String>{};
    for (final l in locs) {
      final id = (l['id'] ?? '').toString();
      final displayId = (l['display_id'] ?? '').toString();
      if (id.isNotEmpty) ownedIds.add(id);
      if (displayId.isNotEmpty) ownedIds.add(displayId);
    }
    final cacheKey = 'permits_${role}_${user.id}';
    debugPrint(
        'permitsStreamProvider role=$role user=${user.id} ids=$ownedIds path=filtered');
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    final selectedUuid = ref.watch(selectedLocationUuidProvider).value;
    final effectiveUuid =
        ref.watch(selectedEffectiveLocationUuidProvider).value;
    final fallbackLocId =
        ref.watch(userLocationIdProvider) ?? user.userMetadata?['location_id'];
    final baseStream = (effectiveUuid != null && effectiveUuid.isNotEmpty)
        ? repo.getPermitsStream(locationId: effectiveUuid)
        : repo.getPermitsStream();
    final uuidRegExp = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false);
    return _cachedStream(cacheKey, baseStream).map((items) {
      final noFilters = ownedIds.isEmpty &&
          selectedDisplayId == null &&
          (selectedUuid == null || selectedUuid.isEmpty) &&
          (effectiveUuid == null || effectiveUuid.isEmpty) &&
          (fallbackLocId == null || fallbackLocId.toString().isEmpty);
      if (noFilters) return items;
      final filtered = items.where((it) {
        final locId = (it['location_id'] ?? '').toString();
        return ownedIds.contains(locId) ||
            locId == (selectedUuid ?? '') ||
            locId == (effectiveUuid ?? '') ||
            locId == (selectedDisplayId ?? '') ||
            locId == (fallbackLocId?.toString() ?? '');
      }).toList();
      return filtered.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        String uiDid = raw;
        if (uuidRegExp.hasMatch(raw.toLowerCase())) {
          // Try match by selected or by ownedIds map from availableLocationsProvider
          final locsAsync = ref.read(availableLocationsProvider);
          final Map<String, String> idToDisplay = {};
          if (locsAsync.hasValue) {
            for (final l in (locsAsync.value ?? [])) {
              final id = (l['id'] ?? '').toString();
              final did = (l['display_id'] ?? '').toString();
              if (id.isNotEmpty && did.isNotEmpty) idToDisplay[id] = did;
            }
          }
          uiDid = idToDisplay[raw] ?? (selectedDisplayId ?? raw);
        }
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  final locationUuidAsync = ref.watch(selectedLocationUuidProvider);
  if (!locationUuidAsync.hasValue || locationUuidAsync.value == null) {
    return Stream.value([]);
  }

  final uuid = locationUuidAsync.value!;
  final cacheKey = 'permits_$uuid';
  return _cachedStream(cacheKey, repo.getPermitsStream(locationId: uuid));
});

final sessionsStreamProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(cacheInvalidationProvider);
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  final role = profile?['role'] ?? user.userMetadata?['role'] ?? 'admin';
  final isSuperAdmin = role == 'super_admin';
  final isAdmin = role == 'admin';
  final isManager = role == 'manager';
  final isOfficer = role == 'officer';
  if (isSuperAdmin) {
    debugPrint('sessionsStreamProvider role=$role user=${user.id} path=global');
    final effUuid = ref.watch(selectedEffectiveLocationUuidProvider).value;
    final baseStream = (effUuid != null && effUuid.isNotEmpty)
        ? repo.getSessionsStream(locationId: effUuid)
        : repo.getSessionsStream();
    final cacheKey = 'sessions_super_admin_${effUuid ?? 'all'}';
    return _cachedStream(cacheKey, baseStream);
  }

  if (isAdmin || isManager || isOfficer) {
    final locationsAsync = ref.watch(availableLocationsProvider);
    if (!locationsAsync.hasValue) return repo.getSessionsStream();
    final locs = locationsAsync.value ?? [];
    final ownedIds = <String>{};
    for (final l in locs) {
      final id = (l['id'] ?? '').toString();
      final displayId = (l['display_id'] ?? '').toString();
      if (id.isNotEmpty) ownedIds.add(id);
      if (displayId.isNotEmpty) ownedIds.add(displayId);
    }
    final cacheKey = 'sessions_${role}_${user.id}';
    debugPrint(
        'sessionsStreamProvider role=$role user=${user.id} ids=$ownedIds path=filtered');
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    final selectedUuid = ref.watch(selectedLocationUuidProvider).value;
    final effectiveUuid =
        ref.watch(selectedEffectiveLocationUuidProvider).value;
    final fallbackLocId =
        ref.watch(userLocationIdProvider) ?? user.userMetadata?['location_id'];
    final baseStream = (effectiveUuid != null && effectiveUuid.isNotEmpty)
        ? repo.getSessionsStream(locationId: effectiveUuid)
        : repo.getSessionsStream();
    return _cachedStream(cacheKey, baseStream).map((items) {
      final noFilters = ownedIds.isEmpty &&
          selectedDisplayId == null &&
          (selectedUuid == null || selectedUuid.isEmpty) &&
          (effectiveUuid == null || effectiveUuid.isEmpty) &&
          (fallbackLocId == null || fallbackLocId.toString().isEmpty);
      if (noFilters) return items;
      return items.where((it) {
        final locId = (it['location_id'] ?? '').toString();
        return ownedIds.contains(locId) ||
            locId == (selectedUuid ?? '') ||
            locId == (effectiveUuid ?? '') ||
            locId == (selectedDisplayId ?? '') ||
            locId == (fallbackLocId?.toString() ?? '');
      }).toList();
    });
  }

  final locationUuidAsync = ref.watch(selectedLocationUuidProvider);
  if (!locationUuidAsync.hasValue || locationUuidAsync.value == null) {
    return Stream.value([]);
  }

  final uuid = locationUuidAsync.value!;
  final cacheKey = 'sessions_$uuid';
  return _cachedStream(cacheKey, repo.getSessionsStream(locationId: uuid));
});

final staffStreamProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(cacheInvalidationProvider);
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  final locationUuid = ref.watch(selectedLocationUuidProvider).value;
  final displayId = ref.watch(selectedLocationIdProvider);
  final role = profile?['role'] ?? user.userMetadata?['role'] ?? 'admin';
  final isSuperAdmin = role == 'super_admin';
  final isAdmin = role == 'admin';
  final isManager = role == 'manager';
  final isOfficer = role == 'officer';

  if (isSuperAdmin) return repo.getStaffStream();
  if (isAdmin || isManager || isOfficer) {
    final locationsAsync = ref.watch(availableLocationsProvider);
    if (!locationsAsync.hasValue) return repo.getStaffStream();
    final locs = locationsAsync.value ?? [];
    final ownedIds = <String>{};
    for (final l in locs) {
      final id = (l['id'] ?? '').toString();
      final displayId = (l['display_id'] ?? '').toString();
      if (id.isNotEmpty) ownedIds.add(id);
      if (displayId.isNotEmpty) ownedIds.add(displayId);
    }
    final cacheKey = 'staff_${role}_${user.id}';
    debugPrint(
        'staffStreamProvider role=$role user=${user.id} ids=$ownedIds path=filtered');
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    final selectedUuid = ref.watch(selectedLocationUuidProvider).value;
    final fallbackLocId =
        ref.watch(userLocationIdProvider) ?? user.userMetadata?['location_id'];
    return _cachedStream(cacheKey, repo.getStaffStream()).map((items) {
      final noFilters = ownedIds.isEmpty &&
          selectedDisplayId == null &&
          (selectedUuid == null || selectedUuid.isEmpty) &&
          (fallbackLocId == null || fallbackLocId.toString().isEmpty);
      if (noFilters) return items;
      return items.where((it) {
        final locId = (it['location_id'] ?? '').toString();
        return ownedIds.contains(locId) ||
            locId == (selectedUuid ?? '') ||
            locId == (selectedDisplayId ?? '') ||
            locId == (fallbackLocId?.toString() ?? '');
      }).toList();
    });
  }

  final uuidRegExp =
      RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
  final locationFilter = locationUuid ??
      (uuidRegExp.hasMatch((displayId ?? '').toLowerCase()) ? displayId : null);
  final baseStream = locationFilter != null
      ? repo.getStaffStream(locationId: locationFilter)
      : repo.getStaffStream();

  final cacheKey = 'staff_${locationFilter ?? 'all'}';
  return _cachedStream(cacheKey, baseStream).map((items) {
    if (locationUuid == null && displayId == null) return items;
    return items.where((item) {
      final locId = item['location_id']?.toString();
      return locId == locationUuid || locId == displayId;
    }).toList();
  });
});

final locationsStreamProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(cacheInvalidationProvider);
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  if (profile == null) return Stream.value([]);

  final locationUuid = ref.watch(selectedLocationUuidProvider).value;
  final displayId = ref.watch(selectedLocationIdProvider);
  final isSuperAdmin = profile['role'] == 'super_admin';
  final isAdmin = profile['role'] == 'admin';

  Stream<List<Map<String, dynamic>>> getBaseStream() {
    if (isSuperAdmin) return repo.getLocationsStream();
    if (isAdmin) return repo.getLocationsStream(ownerId: profile['id']);
    return repo.getLocationsStream(
        locationId: locationUuid ?? displayId ?? profile['location_id']);
  }

  final cacheKey = isSuperAdmin
      ? 'locations_all'
      : isAdmin
          ? 'locations_owner_${profile['id']}'
          : 'locations_${locationUuid ?? displayId ?? profile['location_id'] ?? 'none'}';
  return _cachedStream(cacheKey, getBaseStream());
});

final violationsStreamProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final repo = ref.watch(parkingRepositoryProvider);
  final user = Supabase.instance.client.auth.currentUser;
  final profile = ref.watch(userProfileProvider).value;
  if (user == null) return Stream.value([]);

  final locationUuid = ref.watch(selectedLocationUuidProvider).value;
  final displayId = ref.watch(selectedLocationIdProvider);
  final fallbackLocId =
      ref.watch(userLocationIdProvider) ?? user.userMetadata?['location_id'];

  final role = profile?['role'] ?? user.userMetadata?['role'] ?? 'admin';
  final isSuperAdmin = role == 'super_admin';
  final isAdmin = role == 'admin';
  final isManager = role == 'manager';
  final isOfficer = role == 'officer';
  if (isSuperAdmin) {
    debugPrint(
        'violationsStreamProvider role=$role user=${user.id} path=global');
    final effUuid = ref.watch(selectedEffectiveLocationUuidProvider).value;
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    final cacheKey = 'violations_${selectedDisplayId ?? effUuid ?? 'all'}';
    final baseStream = (effUuid != null && effUuid.isNotEmpty)
        ? repo.getViolationsStream(locationId: effUuid)
        : repo.getViolationsStream();
    final locsAsync = ref.watch(availableLocationsProvider);
    final Map<String, String> idToDisplay = {};
    if (locsAsync.hasValue) {
      for (final l in (locsAsync.value ?? [])) {
        final id = (l['id'] ?? '').toString();
        final did = (l['display_id'] ?? '').toString();
        if (id.isNotEmpty && did.isNotEmpty) idToDisplay[id] = did;
      }
    }
    final uuidRegExp = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false);
    return _cachedStream(cacheKey, baseStream).map((items) {
      final bool idMapReady = idToDisplay.isNotEmpty;
      final filtered = items.where((it) {
        final raw = (it['location_id'] ?? '').toString();
        if (effUuid != null && effUuid.isNotEmpty) {
          return raw == effUuid;
        }
        if ((selectedDisplayId ?? '').isNotEmpty) {
          if (!idMapReady) return true;
          final did = idToDisplay[raw] ?? '';
          return did == selectedDisplayId;
        }
        return true;
      }).toList();
      return filtered.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        String uiDid = raw;
        if (uuidRegExp.hasMatch(raw.toLowerCase())) {
          uiDid = idToDisplay[raw] ?? (selectedDisplayId ?? raw);
        }
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  if (isOfficer) {
    final cacheKey = 'violations_officer_${user.id}';
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    final baseStream = repo.getViolationsStream();
    final locsAsync = ref.watch(availableLocationsProvider);
    final Map<String, String> idToDisplay = {};
    if (locsAsync.hasValue) {
      for (final l in (locsAsync.value ?? [])) {
        final id = (l['id'] ?? '').toString();
        final did = (l['display_id'] ?? '').toString();
        if (id.isNotEmpty && did.isNotEmpty) idToDisplay[id] = did;
      }
    }
    final uuidRegExp = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false);
    return _cachedStream(cacheKey, baseStream).map((items) {
      return items.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        String uiDid = raw;
        if (uuidRegExp.hasMatch(raw.toLowerCase())) {
          uiDid = idToDisplay[raw] ?? (selectedDisplayId ?? raw);
        }
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  if (isAdmin || isManager) {
    final cacheKey = 'violations_${role}_${user.id}_all';
    return _cachedStream(cacheKey, repo.getViolationsStream());
  }

  final locationFilter = locationUuid ?? displayId ?? fallbackLocId;
  final cacheKey = 'violations_${locationFilter ?? 'all'}';
  return _cachedStream(
          cacheKey, repo.getViolationsStream(locationId: locationFilter))
      .map((items) {
    return items.where((item) {
      final locId = item['location_id']?.toString();
      return locId == locationUuid ||
          locId == displayId ||
          locId == fallbackLocId;
    }).toList();
  });
});
