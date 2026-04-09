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
    try {
      final encodable = data
          .map((e) => e.map(
              (k, v) => MapEntry(k, v is DateTime ? v.toIso8601String() : v)))
          .toList();
      prefs.setString(key, jsonEncode(encodable));
    } catch (e) {
      debugPrint('Cache encode failed for $key: $e');
    }
    return data;
  });
}

Stream<List<Map<String, dynamic>>> _cachedOnlyStream(String key) async* {
  final prefs = await SharedPreferences.getInstance();
  final cached = prefs.getString(key);
  if (cached != null) {
    yield _decodeList(cached);
  }
}

String _normalizeRoleValue(String? rawRole) {
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
      } else if (RegExp(r'^\d{5}$').hasMatch(locationId)) {
        // Fallback for display_id if it's not a UUID but a 5-digit string
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
      } else if (RegExp(r'^\d{5}$').hasMatch(locationId)) {
        // Fallback for display_id if it's not a UUID but a 5-digit string
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
    final response = await _client.functions.invoke(
      'create-officer',
      body: {'action': 'delete_staff', 'userId': id},
    );
    if (response.status < 200 || response.status >= 300) {
      final data = response.data;
      final message = data is Map && data['error'] != null
          ? data['error'].toString()
          : 'Failed to delete staff account';
      throw Exception(message);
    }
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
          debounce = Timer(const Duration(milliseconds: 100), () {
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
  final profileAsync = ref.watch(userProfileProvider);
  final profile = profileAsync.value;
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  final role = _normalizeRoleValue(
      (profile?['role'] ?? user.userMetadata?['role'])?.toString());
  final isSuperAdmin = role == 'super_admin';
  final isAdmin = role == 'admin';
  final isManager = role == 'manager';
  final isOfficer = role == 'officer';

  // Use a predictable cache key that doesn't depend on location details if possible
  final cacheKey = 'permits_${role}_${user.id}';
  final uuidRegExp = RegExp(
      r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
      caseSensitive: false);

  if (isSuperAdmin) {
    final effUuidAsync = ref.watch(selectedEffectiveLocationUuidProvider);
    final effUuid = effUuidAsync.value;
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    if ((effUuid == null || effUuid.isEmpty) &&
        selectedDisplayId != null &&
        selectedDisplayId.isNotEmpty) {
      return _cachedOnlyStream('${cacheKey}_super');
    }
    final baseStream = (effUuid != null && effUuid.isNotEmpty)
        ? repo.getPermitsStream(locationId: effUuid)
        : repo.getPermitsStream();

    return _cachedStream('${cacheKey}_super', baseStream).map((items) {
      final locsAsync = ref.watch(availableLocationsProvider);
      final Map<String, String> idToDisplay = {};
      if (locsAsync.hasValue) {
        for (final l in (locsAsync.value ?? [])) {
          final id = (l['id'] ?? '').toString();
          final did = (l['display_id'] ?? '').toString();
          if (id.isNotEmpty && did.isNotEmpty) idToDisplay[id] = did;
        }
      }
      return items.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        String uiDid = raw;
        if (uuidRegExp.hasMatch(raw.toLowerCase())) {
          uiDid = idToDisplay[raw] ?? raw;
        }
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  if (isAdmin || isManager || isOfficer) {
    final effectiveUuidAsync = ref.watch(selectedEffectiveLocationUuidProvider);
    final effectiveUuid = effectiveUuidAsync.value;
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    if ((effectiveUuid == null || effectiveUuid.isEmpty) &&
        selectedDisplayId != null &&
        selectedDisplayId.isNotEmpty) {
      return _cachedOnlyStream(cacheKey);
    }
    final baseStream = (effectiveUuid != null && effectiveUuid.isNotEmpty)
        ? repo.getPermitsStream(locationId: effectiveUuid)
        : repo.getPermitsStream();

    return _cachedStream(cacheKey, baseStream).map((items) {
      final locationsAsync = ref.watch(availableLocationsProvider);
      final locs = locationsAsync.value ?? [];
      final ownedIds = <String>{};
      final Map<String, String> idToDisplay = {};

      for (final l in locs) {
        final id = (l['id'] ?? '').toString();
        final displayId = (l['display_id'] ?? '').toString();
        if (id.isNotEmpty) ownedIds.add(id);
        if (displayId.isNotEmpty) ownedIds.add(displayId);
        if (id.isNotEmpty && displayId.isNotEmpty) idToDisplay[id] = displayId;
      }

      final selectedDisplayId = ref.read(selectedLocationIdProvider);
      final selectedUuid = ref.watch(selectedLocationUuidProvider).value;
      final fallbackLocId =
          ref.read(userLocationIdProvider) ?? user.userMetadata?['location_id'];

      if (!locationsAsync.hasValue) {
        if (isManager || isOfficer) {
          return items;
        }
        return <Map<String, dynamic>>[];
      }

      final noFilters = ownedIds.isEmpty &&
          (selectedDisplayId == null || selectedDisplayId.isEmpty) &&
          (selectedUuid == null || selectedUuid.isEmpty) &&
          (effectiveUuid == null || effectiveUuid.isEmpty) &&
          (fallbackLocId == null || fallbackLocId.toString().isEmpty);

      if (noFilters) {
        return <Map<String, dynamic>>[];
      }

      final filtered = items.where((it) {
        final locId = (it['location_id'] ?? '').toString();
        return ownedIds.contains(locId) ||
            (selectedUuid != null && locId == selectedUuid) ||
            (effectiveUuid != null && locId == effectiveUuid) ||
            (selectedDisplayId != null && locId == selectedDisplayId) ||
            (fallbackLocId != null && locId == fallbackLocId.toString());
      }).toList();

      final shouldFallbackToRlsScopedItems =
          (isManager || isOfficer) && filtered.isEmpty && items.isNotEmpty;
      final visibleItems = shouldFallbackToRlsScopedItems ? items : filtered;

      return visibleItems.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        String uiDid = raw;
        if (uuidRegExp.hasMatch(raw.toLowerCase())) {
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
  return _cachedStream(
      'permits_$uuid', repo.getPermitsStream(locationId: uuid));
});

final sessionsStreamProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(cacheInvalidationProvider);
  final repo = ref.watch(parkingRepositoryProvider);
  final profileAsync = ref.watch(userProfileProvider);
  final profile = profileAsync.value;
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  final role = _normalizeRoleValue(
      (profile?['role'] ?? user.userMetadata?['role'])?.toString());
  final isSuperAdmin = role == 'super_admin';
  final isAdmin = role == 'admin';
  final isManager = role == 'manager';
  final isOfficer = role == 'officer';

  final cacheKey = 'sessions_${role}_${user.id}';
  final uuidRegExp = RegExp(
      r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', // Corrected UUID regex for simplicity
      caseSensitive: false);

  if (isSuperAdmin) {
    final effUuidAsync = ref.watch(selectedEffectiveLocationUuidProvider);
    final effUuid = effUuidAsync.value;
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    if ((effUuid == null || effUuid.isEmpty) &&
        selectedDisplayId != null &&
        selectedDisplayId.isNotEmpty) {
      return _cachedOnlyStream('${cacheKey}_super');
    }
    final baseStream = (effUuid != null && effUuid.isNotEmpty)
        ? repo.getSessionsStream(locationId: effUuid)
        : repo.getSessionsStream();

    return _cachedStream('${cacheKey}_super', baseStream).map((items) {
      final locsAsync = ref.watch(availableLocationsProvider);
      final Map<String, String> idToDisplay = {};
      if (locsAsync.hasValue) {
        for (final l in (locsAsync.value ?? [])) {
          final id = (l['id'] ?? '').toString();
          final did = (l['display_id'] ?? '').toString();
          if (id.isNotEmpty && did.isNotEmpty) idToDisplay[id] = did;
        }
      }
      return items.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        String uiDid = raw;
        if (uuidRegExp.hasMatch(raw.toLowerCase())) {
          uiDid = idToDisplay[raw] ?? raw;
        }
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  if (isAdmin || isManager || isOfficer) {
    final effectiveUuidAsync = ref.watch(selectedEffectiveLocationUuidProvider);
    final effectiveUuid = effectiveUuidAsync.value;
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    if ((effectiveUuid == null || effectiveUuid.isEmpty) &&
        selectedDisplayId != null &&
        selectedDisplayId.isNotEmpty) {
      return _cachedOnlyStream(cacheKey);
    }
    final baseStream = (effectiveUuid != null && effectiveUuid.isNotEmpty)
        ? repo.getSessionsStream(locationId: effectiveUuid)
        : repo.getSessionsStream();

    return _cachedStream(cacheKey, baseStream).map((items) {
      final locationsAsync = ref.watch(availableLocationsProvider);
      final locs = locationsAsync.value ?? [];
      final ownedIds = <String>{};
      final Map<String, String> idToDisplay = {};

      for (final l in locs) {
        final id = (l['id'] ?? '').toString();
        final displayId = (l['display_id'] ?? '').toString();
        if (id.isNotEmpty) ownedIds.add(id);
        if (displayId.isNotEmpty) ownedIds.add(displayId);
        if (id.isNotEmpty && displayId.isNotEmpty) idToDisplay[id] = displayId;
      }

      final selectedDisplayId = ref.read(selectedLocationIdProvider);
      final selectedUuid = ref.watch(selectedLocationUuidProvider).value;
      final fallbackLocId =
          ref.read(userLocationIdProvider) ?? user.userMetadata?['location_id'];

      if (!locationsAsync.hasValue) {
        if (isManager || isOfficer) {
          return items;
        }
        return <Map<String, dynamic>>[];
      }

      final noFilters = ownedIds.isEmpty &&
          (selectedDisplayId == null || selectedDisplayId.isEmpty) &&
          (selectedUuid == null || selectedUuid.isEmpty) &&
          (effectiveUuid == null || effectiveUuid.isEmpty) &&
          (fallbackLocId == null || fallbackLocId.toString().isEmpty);

      if (noFilters) {
        return <Map<String, dynamic>>[];
      }

      final filtered = items.where((it) {
        final locId = (it['location_id'] ?? '').toString();
        return ownedIds.contains(locId) ||
            (selectedUuid != null && locId == selectedUuid) ||
            (effectiveUuid != null && locId == effectiveUuid) ||
            (selectedDisplayId != null && locId == selectedDisplayId) ||
            (fallbackLocId != null && locId == fallbackLocId.toString());
      }).toList();

      final shouldFallbackToRlsScopedItems =
          (isManager || isOfficer) && filtered.isEmpty && items.isNotEmpty;
      final visibleItems = shouldFallbackToRlsScopedItems ? items : filtered;

      return visibleItems.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        String uiDid = raw;
        if (uuidRegExp.hasMatch(raw.toLowerCase())) {
          uiDid = idToDisplay[raw] ?? (selectedDisplayId ?? raw);
        }
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  return Stream.value([]);
});

final staffStreamProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  ref.watch(cacheInvalidationProvider);
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return Stream.value([]);

  final locationUuid = ref.watch(selectedLocationUuidProvider).value;
  final displayId = ref.watch(selectedLocationIdProvider);
  final role = _normalizeRoleValue(
      (profile?['role'] ?? user.userMetadata?['role'])?.toString());
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
    return _cachedStream(cacheKey, repo.getStaffStream())
        .asyncMap((items) async {
      final allowedLocationIds = <String>{...ownedIds};
      if (selectedUuid != null && selectedUuid.isNotEmpty) {
        allowedLocationIds.add(selectedUuid);
      }
      if (selectedDisplayId != null && selectedDisplayId.isNotEmpty) {
        allowedLocationIds.add(selectedDisplayId);
      }
      final fallbackLoc = fallbackLocId?.toString() ?? '';
      if (fallbackLoc.isNotEmpty) {
        allowedLocationIds.add(fallbackLoc);
      }

      bool locationAllowed(Map<String, dynamic> item) {
        if (allowedLocationIds.isEmpty) return true;
        final locId = (item['location_id'] ?? '').toString();
        return locId.isNotEmpty && allowedLocationIds.contains(locId);
      }

      if (isOfficer) {
        return items
            .where((it) => (it['id'] ?? '').toString() == user.id)
            .toList();
      }

      List<Map<String, dynamic>> assignmentRows = const [];
      try {
        final data = await Supabase.instance.client
            .from('officer_assignments')
            .select('officer_id,assigned_by,location_id');
        assignmentRows = List<Map<String, dynamic>>.from(data as List);
      } catch (_) {
        return items.where(locationAllowed).toList();
      }

      final assignmentLocationIdsByOfficer = <String, Set<String>>{};
      for (final row in assignmentRows) {
        final officerId = (row['officer_id'] ?? '').toString();
        final locId = (row['location_id'] ?? '').toString();
        if (officerId.isEmpty || locId.isEmpty) continue;
        assignmentLocationIdsByOfficer
            .putIfAbsent(officerId, () => <String>{})
            .add(locId);
      }

      bool locationAllowedForStaff(Map<String, dynamic> item) {
        if (allowedLocationIds.isEmpty) return true;
        final locId = (item['location_id'] ?? '').toString();
        if (locId.isNotEmpty && allowedLocationIds.contains(locId)) {
          return true;
        }
        final id = (item['id'] ?? '').toString();
        if (id.isEmpty) return false;
        final assignmentLocs = assignmentLocationIdsByOfficer[id];
        if (assignmentLocs == null || assignmentLocs.isEmpty) return false;
        return assignmentLocs.any(allowedLocationIds.contains);
      }

      final itemById = <String, Map<String, dynamic>>{};
      for (final item in items) {
        final id = (item['id'] ?? '').toString();
        if (id.isNotEmpty) {
          itemById[id] = item;
        }
      }

      if (isManager) {
        final createdOfficerIds = assignmentRows
            .where((row) => (row['assigned_by'] ?? '').toString() == user.id)
            .map((row) => (row['officer_id'] ?? '').toString())
            .where((id) => id.isNotEmpty)
            .toSet();
        final visibleIds = <String>{user.id, ...createdOfficerIds};
        return items.where((item) {
          final id = (item['id'] ?? '').toString();
          if (!visibleIds.contains(id)) return false;
          if (id == user.id) return true;
          if (id != user.id &&
              _normalizeRoleValue(item['role']?.toString()) != 'officer') {
            return false;
          }
          return locationAllowedForStaff(item);
        }).toList();
      }

      if (isAdmin) {
        final directlyCreatedIds = assignmentRows
            .where((row) => (row['assigned_by'] ?? '').toString() == user.id)
            .map((row) => (row['officer_id'] ?? '').toString())
            .where((id) => id.isNotEmpty)
            .toSet();

        final managerIds = directlyCreatedIds.where((id) {
          final role = _normalizeRoleValue(itemById[id]?['role']?.toString());
          return role == 'manager';
        }).toSet();

        final managerCreatedOfficerIds = assignmentRows
            .where((row) =>
                managerIds.contains((row['assigned_by'] ?? '').toString()))
            .map((row) => (row['officer_id'] ?? '').toString())
            .where((id) => id.isNotEmpty)
            .toSet();

        final visibleIds = <String>{
          user.id,
          ...directlyCreatedIds,
          ...managerCreatedOfficerIds,
        };

        final hasCreatorVisibilityData = directlyCreatedIds.isNotEmpty ||
            managerCreatedOfficerIds.isNotEmpty;

        return items.where((item) {
          final id = (item['id'] ?? '').toString();
          if (id == user.id) return true;

          final itemRole = _normalizeRoleValue(item['role']?.toString());
          final isManagedRole = itemRole == 'manager' || itemRole == 'officer';
          if (!isManagedRole) return false;

          if (hasCreatorVisibilityData && !visibleIds.contains(id)) {
            return false;
          }

          return locationAllowedForStaff(item);
        }).toList();
      }

      return items.where(locationAllowedForStaff).toList();
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
  final user = Supabase.instance.client.auth.currentUser;
  final fallbackLocId =
      ref.watch(userLocationIdProvider) ?? user?.userMetadata?['location_id'];
  final role = _normalizeRoleValue(profile['role']?.toString());
  final isSuperAdmin = role == 'super_admin';
  final isAdmin = role == 'admin';
  final isManager = role == 'manager';
  final isOfficer = role == 'officer';

  Stream<List<Map<String, dynamic>>> getBaseStream() {
    if (isSuperAdmin) return repo.getLocationsStream();
    if (isAdmin || isManager || isOfficer) return repo.getLocationsStream();
    return repo.getLocationsStream(
        locationId: locationUuid ?? displayId ?? profile['location_id']);
  }

  final cacheKey = isSuperAdmin
      ? 'locations_all'
      : (isAdmin || isManager || isOfficer)
          ? 'locations_${role}_${profile['id']}'
          : 'locations_${locationUuid ?? displayId ?? profile['location_id'] ?? 'none'}';
  if (isSuperAdmin) return _cachedStream(cacheKey, getBaseStream());

  if (isAdmin || isManager || isOfficer) {
    final locationsAsync = ref.watch(availableLocationsProvider);
    if (!locationsAsync.hasValue) {
      return _cachedStream(cacheKey, getBaseStream());
    }
    final locs = locationsAsync.value ?? [];
    final allowedIds = <String>{};
    for (final l in locs) {
      final id = (l['id'] ?? '').toString();
      final did = (l['display_id'] ?? '').toString();
      if (id.isNotEmpty) allowedIds.add(id);
      if (did.isNotEmpty) allowedIds.add(did);
    }
    return _cachedStream(cacheKey, getBaseStream()).map((items) {
      final selected = displayId ?? '';
      final selectedUuid = locationUuid ?? '';
      final fallback = fallbackLocId?.toString() ?? '';
      final noFilters = allowedIds.isEmpty &&
          selected.isEmpty &&
          selectedUuid.isEmpty &&
          fallback.isEmpty;
      if (noFilters) return items;
      final filtered = items.where((it) {
        final locId = (it['id'] ?? it['location_id'] ?? '').toString();
        final did = (it['display_id'] ?? '').toString();
        return allowedIds.contains(locId) ||
            allowedIds.contains(did) ||
            locId == selectedUuid ||
            did == selected ||
            locId == fallback ||
            did == fallback;
      }).toList();
      final canFallbackToAll =
          allowedIds.isEmpty && selectedUuid.isEmpty && fallback.isEmpty;
      if (filtered.isEmpty && items.isNotEmpty && canFallbackToAll) {
        return items;
      }
      return filtered;
    });
  }

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

  final role = _normalizeRoleValue(
      (profile?['role'] ?? user.userMetadata?['role'])?.toString());
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
    if ((effUuid == null || effUuid.isEmpty) &&
        selectedDisplayId != null &&
        selectedDisplayId.isNotEmpty) {
      return _cachedOnlyStream(cacheKey);
    }
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
      final Set<String> seen = {};
      final deduped = filtered.where((it) {
        final id = (it['id'] ?? '').toString();
        final evidence = (it['evidence_r2_url'] ?? '').toString();
        final key = id.isNotEmpty ? 'id:$id' : 'k:$evidence';
        if (seen.contains(key)) return false;
        seen.add(key);
        return true;
      }).toList();
      return deduped.map((it) {
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
    final locationUuid = ref.watch(selectedLocationUuidProvider).value;
    if ((locationUuid == null || locationUuid.isEmpty) &&
        selectedDisplayId != null &&
        selectedDisplayId.isNotEmpty) {
      return _cachedOnlyStream(cacheKey);
    }
    final baseStream = (locationUuid != null && locationUuid.isNotEmpty)
        ? repo.getViolationsStream(locationId: locationUuid)
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
      final Set<String> seen = {};
      final deduped = items.where((it) {
        final id = (it['id'] ?? '').toString();
        final evidence = (it['evidence_r2_url'] ?? '').toString();
        final key = id.isNotEmpty ? 'id:$id' : 'k:$evidence';
        if (seen.contains(key)) return false;
        seen.add(key);
        return true;
      }).toList();
      return deduped.map((it) {
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
    final effectiveUuid =
        ref.watch(selectedEffectiveLocationUuidProvider).value;
    final selectedDisplayId = ref.watch(selectedLocationIdProvider);
    if ((effectiveUuid == null || effectiveUuid.isEmpty) &&
        selectedDisplayId != null &&
        selectedDisplayId.isNotEmpty) {
      return _cachedOnlyStream(cacheKey);
    }
    final baseStream = (effectiveUuid != null && effectiveUuid.isNotEmpty)
        ? repo.getViolationsStream(locationId: effectiveUuid)
        : repo.getViolationsStream();
    return _cachedStream(cacheKey, baseStream);
  }

  final locationFilter = locationUuid ?? displayId ?? fallbackLocId;
  final cacheKey = 'violations_${locationFilter ?? 'all'}';
  return _cachedStream(
          cacheKey, repo.getViolationsStream(locationId: locationFilter))
      .map((items) {
    final filtered = items.where((item) {
      final locId = item['location_id']?.toString();
      return locId == locationUuid ||
          locId == displayId ||
          locId == fallbackLocId;
    }).toList();
    final Set<String> seen = {};
    return filtered.where((it) {
      final id = (it['id'] ?? '').toString();
      final evidence = (it['evidence_r2_url'] ?? '').toString();
      final key = id.isNotEmpty ? 'id:$id' : 'k:$evidence';
      if (seen.contains(key)) return false;
      seen.add(key);
      return true;
    }).toList();
  });
});
