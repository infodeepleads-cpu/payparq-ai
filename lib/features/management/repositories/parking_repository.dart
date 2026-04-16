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
  yield* live.handleError((error, _) {
    // WebSocket normal-close (code 1000) fires as RealtimeSubscribeException —
    // not a real error, just suppress it so Sentry stays clean.
    debugPrint('Realtime stream closed: $error');
  }).map((data) {
    // Deduplicate by id to guard against Realtime initial-fetch + INSERT race
    final seen = <String>{};
    final deduped = data.where((e) {
      final id = e['id']?.toString();
      if (id == null) return true;
      return seen.add(id);
    }).toList();
    try {
      final encodable = deduped
          .map((e) => e.map(
              (k, v) => MapEntry(k, v is DateTime ? v.toIso8601String() : v)))
          .toList();
      prefs.setString(key, jsonEncode(encodable));
    } catch (e) {
      debugPrint('Cache encode failed for $key: $e');
    }
    return deduped;
  });
}

Stream<List<Map<String, dynamic>>> _deferUntilSelectionReady(
  Ref ref, {
  required bool wait,
  required Stream<List<Map<String, dynamic>>> Function() build,
}) {
  if (!wait) {
    return build();
  }
  return Stream.fromFuture(
          ref.watch(guaranteedLocationSelectionProvider.future))
      .asyncExpand((_) => build());
}

Map<String, String> _locationIdToDisplayMap(
  List<Map<String, dynamic>> locations,
) {
  final idToDisplay = <String, String>{};
  for (final location in locations) {
    final id = (location['id'] ?? '').toString();
    final displayId = (location['display_id'] ?? '').toString();
    if (id.isNotEmpty && displayId.isNotEmpty) {
      idToDisplay[id] = displayId;
    }
  }
  return idToDisplay;
}

String? _uuidForDisplayId(
  List<Map<String, dynamic>> locations,
  String? displayId,
) {
  if (displayId == null || displayId.isEmpty) return null;
  for (final location in locations) {
    if ((location['display_id'] ?? '').toString() != displayId) {
      continue;
    }
    final id = (location['id'] ?? '').toString();
    if (id.isNotEmpty) {
      return id;
    }
  }
  return null;
}

String _displayIdForLocationId(
  String rawLocationId,
  RegExp uuidRegExp,
  Map<String, String> idToDisplay, {
  String? fallbackDisplayId,
}) {
  if (!uuidRegExp.hasMatch(rawLocationId.toLowerCase())) {
    return rawLocationId;
  }
  return idToDisplay[rawLocationId] ?? (fallbackDisplayId ?? rawLocationId);
}

String? _displayIdForUuid(
  Map<String, String> idToDisplay,
  String? uuid,
) {
  if (uuid == null || uuid.isEmpty) return null;
  return idToDisplay[uuid];
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
  final locationsAsync = ref.watch(availableLocationsProvider);
  final selectedDisplayId = ref.watch(selectedLocationIdProvider);
  final selectedUuid = ref.watch(selectedLocationUuidProvider).value;
  final effectiveUuid = ref.watch(selectedEffectiveLocationUuidProvider).value;
  final fallbackLocId =
      ref.read(userLocationIdProvider) ?? user.userMetadata?['location_id'];

  Stream<List<Map<String, dynamic>>> buildSuperAdminStream(
    String? scopedUuid,
    String? scopedDisplayId,
    AsyncValue<List<Map<String, dynamic>>> scopedLocationsAsync,
  ) {
    final locs = scopedLocationsAsync.value ?? [];
    final idToDisplay = _locationIdToDisplayMap(locs);
    final resolvedScopedUuid = (scopedUuid != null && scopedUuid.isNotEmpty)
        ? scopedUuid
        : _uuidForDisplayId(locs, scopedDisplayId);
    final baseStream =
        (resolvedScopedUuid != null && resolvedScopedUuid.isNotEmpty)
            ? repo.getPermitsStream(locationId: resolvedScopedUuid)
            : repo.getPermitsStream();

    return _cachedStream('${cacheKey}_super', baseStream).map((items) {
      final filtered = items.where((it) {
        final raw = (it['location_id'] ?? '').toString();
        final uiDid = _displayIdForLocationId(
          raw,
          uuidRegExp,
          idToDisplay,
          fallbackDisplayId: scopedDisplayId,
        );
        if (resolvedScopedUuid != null && resolvedScopedUuid.isNotEmpty) {
          return raw == resolvedScopedUuid;
        }
        if (scopedDisplayId != null && scopedDisplayId.isNotEmpty) {
          return uiDid == scopedDisplayId;
        }
        return true;
      }).toList();
      return filtered.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        final uiDid = _displayIdForLocationId(
          raw,
          uuidRegExp,
          idToDisplay,
          fallbackDisplayId: scopedDisplayId,
        );
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  Stream<List<Map<String, dynamic>>> buildManagedStream(
    String? scopedUuid,
    String? scopedDisplayId,
    String? scopedSelectedUuid,
    AsyncValue<List<Map<String, dynamic>>> scopedLocationsAsync,
  ) {
    final locs = scopedLocationsAsync.value ?? [];
    final resolvedScopedUuid = (scopedUuid != null && scopedUuid.isNotEmpty)
        ? scopedUuid
        : (scopedSelectedUuid != null && scopedSelectedUuid.isNotEmpty)
            ? scopedSelectedUuid
            : _uuidForDisplayId(locs, scopedDisplayId);
    final baseStream =
        (resolvedScopedUuid != null && resolvedScopedUuid.isNotEmpty)
            ? repo.getPermitsStream(locationId: resolvedScopedUuid)
            : repo.getPermitsStream();

    return _cachedStream(cacheKey, baseStream).map((items) {
      final ownedIds = <String>{};
      final idToDisplay = _locationIdToDisplayMap(locs);
      final resolvedScopedDisplayId =
          (scopedDisplayId != null && scopedDisplayId.isNotEmpty)
              ? scopedDisplayId
              : _displayIdForUuid(idToDisplay, resolvedScopedUuid);

      for (final entry in idToDisplay.entries) {
        ownedIds.add(entry.key);
        ownedIds.add(entry.value);
      }

      if (!scopedLocationsAsync.hasValue) {
        if (isManager || isOfficer) {
          return items;
        }
        return <Map<String, dynamic>>[];
      }

      final noFilters = ownedIds.isEmpty &&
          (scopedDisplayId == null || scopedDisplayId.isEmpty) &&
          (scopedSelectedUuid == null || scopedSelectedUuid.isEmpty) &&
          (scopedUuid == null || scopedUuid.isEmpty) &&
          (fallbackLocId == null || fallbackLocId.toString().isEmpty);

      if (noFilters) {
        return <Map<String, dynamic>>[];
      }

      final hasExplicitSelection =
          (resolvedScopedUuid != null && resolvedScopedUuid.isNotEmpty) ||
              (resolvedScopedDisplayId != null &&
                  resolvedScopedDisplayId.isNotEmpty);
      final filtered = items.where((it) {
        final locId = (it['location_id'] ?? '').toString();
        final uiDid = _displayIdForLocationId(
          locId,
          uuidRegExp,
          idToDisplay,
          fallbackDisplayId: resolvedScopedDisplayId,
        );
        if (hasExplicitSelection) {
          return (resolvedScopedUuid != null && locId == resolvedScopedUuid) ||
              (resolvedScopedDisplayId != null &&
                  uiDid == resolvedScopedDisplayId);
        }
        return ownedIds.contains(locId) ||
            ownedIds.contains(uiDid) ||
            (fallbackLocId != null &&
                (locId == fallbackLocId.toString() ||
                    uiDid == fallbackLocId.toString()));
      }).toList();

      final shouldFallbackToRlsScopedItems =
          (isManager || isOfficer) && filtered.isEmpty && items.isNotEmpty;
      final visibleItems = shouldFallbackToRlsScopedItems ? items : filtered;

      return visibleItems.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        final uiDid = _displayIdForLocationId(
          raw,
          uuidRegExp,
          idToDisplay,
          fallbackDisplayId: resolvedScopedDisplayId,
        );
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  final shouldWaitForSelection =
      (selectedDisplayId == null || selectedDisplayId.isEmpty) &&
          (effectiveUuid == null || effectiveUuid.isEmpty) &&
          (isSuperAdmin || isAdmin || isManager || isOfficer);

  if (isSuperAdmin) {
    return _deferUntilSelectionReady(
      ref,
      wait: shouldWaitForSelection,
      build: () => buildSuperAdminStream(
        shouldWaitForSelection
            ? ref.read(selectedEffectiveLocationUuidProvider).value
            : effectiveUuid,
        shouldWaitForSelection
            ? ref.read(selectedLocationIdProvider)
            : selectedDisplayId,
        shouldWaitForSelection
            ? ref.read(availableLocationsProvider)
            : locationsAsync,
      ),
    );
  }

  if (isAdmin || isManager || isOfficer) {
    return _deferUntilSelectionReady(
      ref,
      wait: shouldWaitForSelection,
      build: () => buildManagedStream(
        shouldWaitForSelection
            ? ref.read(selectedEffectiveLocationUuidProvider).value
            : effectiveUuid,
        shouldWaitForSelection
            ? ref.read(selectedLocationIdProvider)
            : selectedDisplayId,
        shouldWaitForSelection
            ? ref.read(selectedLocationUuidProvider).value
            : selectedUuid,
        shouldWaitForSelection
            ? ref.read(availableLocationsProvider)
            : locationsAsync,
      ),
    );
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
      r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
      caseSensitive: false);
  final locationsAsync = ref.watch(availableLocationsProvider);
  final selectedDisplayId = ref.watch(selectedLocationIdProvider);
  final selectedUuid = ref.watch(selectedLocationUuidProvider).value;
  final effectiveUuid = ref.watch(selectedEffectiveLocationUuidProvider).value;
  final fallbackLocId =
      ref.read(userLocationIdProvider) ?? user.userMetadata?['location_id'];

  Stream<List<Map<String, dynamic>>> buildSuperAdminStream(
    String? scopedUuid,
    String? scopedDisplayId,
    AsyncValue<List<Map<String, dynamic>>> scopedLocationsAsync,
  ) {
    final locs = scopedLocationsAsync.value ?? [];
    final idToDisplay = _locationIdToDisplayMap(locs);
    final resolvedScopedUuid = (scopedUuid != null && scopedUuid.isNotEmpty)
        ? scopedUuid
        : _uuidForDisplayId(locs, scopedDisplayId);
    final baseStream =
        (resolvedScopedUuid != null && resolvedScopedUuid.isNotEmpty)
            ? repo.getSessionsStream(locationId: resolvedScopedUuid)
            : repo.getSessionsStream();

    return _cachedStream('${cacheKey}_super', baseStream).map((items) {
      final filtered = items.where((it) {
        final raw = (it['location_id'] ?? '').toString();
        final uiDid = _displayIdForLocationId(
          raw,
          uuidRegExp,
          idToDisplay,
          fallbackDisplayId: scopedDisplayId,
        );
        if (resolvedScopedUuid != null && resolvedScopedUuid.isNotEmpty) {
          return raw == resolvedScopedUuid;
        }
        if (scopedDisplayId != null && scopedDisplayId.isNotEmpty) {
          return uiDid == scopedDisplayId;
        }
        return true;
      }).toList();
      return filtered.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        final uiDid = _displayIdForLocationId(
          raw,
          uuidRegExp,
          idToDisplay,
          fallbackDisplayId: scopedDisplayId,
        );
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  Stream<List<Map<String, dynamic>>> buildManagedStream(
    String? scopedUuid,
    String? scopedDisplayId,
    String? scopedSelectedUuid,
    AsyncValue<List<Map<String, dynamic>>> scopedLocationsAsync,
  ) {
    final locs = scopedLocationsAsync.value ?? [];
    final resolvedScopedUuid = (scopedUuid != null && scopedUuid.isNotEmpty)
        ? scopedUuid
        : (scopedSelectedUuid != null && scopedSelectedUuid.isNotEmpty)
            ? scopedSelectedUuid
            : _uuidForDisplayId(locs, scopedDisplayId);
    final baseStream =
        (resolvedScopedUuid != null && resolvedScopedUuid.isNotEmpty)
            ? repo.getSessionsStream(locationId: resolvedScopedUuid)
            : repo.getSessionsStream();

    return _cachedStream(cacheKey, baseStream).map((items) {
      final ownedIds = <String>{};
      final idToDisplay = _locationIdToDisplayMap(locs);
      final resolvedScopedDisplayId =
          (scopedDisplayId != null && scopedDisplayId.isNotEmpty)
              ? scopedDisplayId
              : _displayIdForUuid(idToDisplay, resolvedScopedUuid);

      for (final entry in idToDisplay.entries) {
        ownedIds.add(entry.key);
        ownedIds.add(entry.value);
      }

      if (!scopedLocationsAsync.hasValue) {
        if (isManager || isOfficer) {
          return items;
        }
        return <Map<String, dynamic>>[];
      }

      final noFilters = ownedIds.isEmpty &&
          (scopedDisplayId == null || scopedDisplayId.isEmpty) &&
          (scopedSelectedUuid == null || scopedSelectedUuid.isEmpty) &&
          (scopedUuid == null || scopedUuid.isEmpty) &&
          (fallbackLocId == null || fallbackLocId.toString().isEmpty);

      if (noFilters) {
        return <Map<String, dynamic>>[];
      }

      final hasExplicitSelection =
          (resolvedScopedUuid != null && resolvedScopedUuid.isNotEmpty) ||
              (resolvedScopedDisplayId != null &&
                  resolvedScopedDisplayId.isNotEmpty);
      final filtered = items.where((it) {
        final locId = (it['location_id'] ?? '').toString();
        final uiDid = _displayIdForLocationId(
          locId,
          uuidRegExp,
          idToDisplay,
          fallbackDisplayId: resolvedScopedDisplayId,
        );
        if (hasExplicitSelection) {
          return (resolvedScopedUuid != null && locId == resolvedScopedUuid) ||
              (resolvedScopedDisplayId != null &&
                  uiDid == resolvedScopedDisplayId);
        }
        return ownedIds.contains(locId) ||
            ownedIds.contains(uiDid) ||
            (fallbackLocId != null &&
                (locId == fallbackLocId.toString() ||
                    uiDid == fallbackLocId.toString()));
      }).toList();

      final shouldFallbackToRlsScopedItems =
          (isManager || isOfficer) && filtered.isEmpty && items.isNotEmpty;
      final visibleItems = shouldFallbackToRlsScopedItems ? items : filtered;

      return visibleItems.map((it) {
        final raw = (it['location_id'] ?? '').toString();
        final uiDid = _displayIdForLocationId(
          raw,
          uuidRegExp,
          idToDisplay,
          fallbackDisplayId: resolvedScopedDisplayId,
        );
        return {...it, 'location_display_id': uiDid};
      }).toList();
    });
  }

  final shouldWaitForSelection =
      (selectedDisplayId == null || selectedDisplayId.isEmpty) &&
          (effectiveUuid == null || effectiveUuid.isEmpty) &&
          (isSuperAdmin || isAdmin || isManager || isOfficer);

  if (isSuperAdmin) {
    return _deferUntilSelectionReady(
      ref,
      wait: shouldWaitForSelection,
      build: () => buildSuperAdminStream(
        shouldWaitForSelection
            ? ref.read(selectedEffectiveLocationUuidProvider).value
            : effectiveUuid,
        shouldWaitForSelection
            ? ref.read(selectedLocationIdProvider)
            : selectedDisplayId,
        shouldWaitForSelection
            ? ref.read(availableLocationsProvider)
            : locationsAsync,
      ),
    );
  }

  if (isAdmin || isManager || isOfficer) {
    return _deferUntilSelectionReady(
      ref,
      wait: shouldWaitForSelection,
      build: () => buildManagedStream(
        shouldWaitForSelection
            ? ref.read(selectedEffectiveLocationUuidProvider).value
            : effectiveUuid,
        shouldWaitForSelection
            ? ref.read(selectedLocationIdProvider)
            : selectedDisplayId,
        shouldWaitForSelection
            ? ref.read(selectedLocationUuidProvider).value
            : selectedUuid,
        shouldWaitForSelection
            ? ref.read(availableLocationsProvider)
            : locationsAsync,
      ),
    );
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
  final locationsAsync = ref.watch(availableLocationsProvider);
  final selectedDisplayId = ref.watch(selectedLocationIdProvider);
  final effectiveUuid = ref.watch(selectedEffectiveLocationUuidProvider).value;
  if (isSuperAdmin) {
    final cacheKey =
        'violations_${selectedDisplayId ?? effectiveUuid ?? 'all'}';
    final uuidRegExp = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false);
    return _deferUntilSelectionReady(
      ref,
      wait: (selectedDisplayId == null || selectedDisplayId.isEmpty) &&
          (effectiveUuid == null || effectiveUuid.isEmpty),
      build: () {
        final resolvedEffUuid =
            ref.read(selectedEffectiveLocationUuidProvider).value;
        final resolvedDisplayId = ref.read(selectedLocationIdProvider);
        final resolvedLocationsAsync = ref.read(availableLocationsProvider);
        final activeUuid =
            (resolvedEffUuid != null && resolvedEffUuid.isNotEmpty)
                ? resolvedEffUuid
                : effectiveUuid;
        final activeDisplayId =
            (resolvedDisplayId != null && resolvedDisplayId.isNotEmpty)
                ? resolvedDisplayId
                : selectedDisplayId;
        final activeLocationsAsync = resolvedLocationsAsync.hasValue
            ? resolvedLocationsAsync
            : locationsAsync;
        final locs = activeLocationsAsync.value ?? [];
        final idToDisplay = _locationIdToDisplayMap(locs);
        final resolvedActiveUuid = (activeUuid != null && activeUuid.isNotEmpty)
            ? activeUuid
            : _uuidForDisplayId(locs, activeDisplayId);
        final baseStream =
            (resolvedActiveUuid != null && resolvedActiveUuid.isNotEmpty)
                ? repo.getViolationsStream(locationId: resolvedActiveUuid)
                : repo.getViolationsStream();
        return _cachedStream(cacheKey, baseStream).map((items) {
          final filtered = items.where((it) {
            final raw = (it['location_id'] ?? '').toString();
            final did = _displayIdForLocationId(
              raw,
              uuidRegExp,
              idToDisplay,
              fallbackDisplayId: activeDisplayId,
            );
            if (resolvedActiveUuid != null && resolvedActiveUuid.isNotEmpty) {
              return raw == resolvedActiveUuid;
            }
            if ((activeDisplayId ?? '').isNotEmpty) {
              return did == activeDisplayId;
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
            final uiDid = _displayIdForLocationId(
              raw,
              uuidRegExp,
              idToDisplay,
              fallbackDisplayId: activeDisplayId,
            );
            return {...it, 'location_display_id': uiDid};
          }).toList();
        });
      },
    );
  }

  if (isOfficer) {
    final cacheKey = 'violations_officer_${user.id}';
    final locationUuid = ref.watch(selectedLocationUuidProvider).value;
    final locsAsync = ref.watch(availableLocationsProvider);
    final locs = locsAsync.value ?? [];
    final idToDisplay = _locationIdToDisplayMap(locs);
    final resolvedLocationUuid =
        (locationUuid != null && locationUuid.isNotEmpty)
            ? locationUuid
            : _uuidForDisplayId(locs, selectedDisplayId);
    final baseStream =
        (resolvedLocationUuid != null && resolvedLocationUuid.isNotEmpty)
            ? repo.getViolationsStream(locationId: resolvedLocationUuid)
            : repo.getViolationsStream();
    final uuidRegExp = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false);
    return _cachedStream(cacheKey, baseStream).map((items) {
      final filtered = items.where((it) {
        final raw = (it['location_id'] ?? '').toString();
        final did = _displayIdForLocationId(
          raw,
          uuidRegExp,
          idToDisplay,
          fallbackDisplayId: selectedDisplayId,
        );
        if (resolvedLocationUuid != null && resolvedLocationUuid.isNotEmpty) {
          return raw == resolvedLocationUuid;
        }
        if ((selectedDisplayId ?? '').isNotEmpty) {
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

  if (isAdmin || isManager) {
    final cacheKey = 'violations_${role}_${user.id}_all';
    return _deferUntilSelectionReady(
      ref,
      wait: (selectedDisplayId == null || selectedDisplayId.isEmpty) &&
          (effectiveUuid == null || effectiveUuid.isEmpty),
      build: () {
        final resolvedEffUuid =
            ref.read(selectedEffectiveLocationUuidProvider).value;
        final resolvedDisplayId = ref.read(selectedLocationIdProvider);
        final activeUuid =
            (resolvedEffUuid != null && resolvedEffUuid.isNotEmpty)
                ? resolvedEffUuid
                : effectiveUuid;
        final activeDisplayId =
            (resolvedDisplayId != null && resolvedDisplayId.isNotEmpty)
                ? resolvedDisplayId
                : selectedDisplayId;
        final locs = locationsAsync.value ?? [];
        final idToDisplay = _locationIdToDisplayMap(locs);
        final resolvedActiveUuid = (activeUuid != null && activeUuid.isNotEmpty)
            ? activeUuid
            : _uuidForDisplayId(locs, activeDisplayId);
        final resolvedActiveDisplayId =
            (activeDisplayId != null && activeDisplayId.isNotEmpty)
                ? activeDisplayId
                : _displayIdForUuid(idToDisplay, resolvedActiveUuid);
        final baseStream =
            (resolvedActiveUuid != null && resolvedActiveUuid.isNotEmpty)
                ? repo.getViolationsStream(locationId: resolvedActiveUuid)
                : repo.getViolationsStream();
        return _cachedStream(cacheKey, baseStream).map((items) {
          if ((resolvedActiveUuid == null || resolvedActiveUuid.isEmpty) &&
              (resolvedActiveDisplayId == null ||
                  resolvedActiveDisplayId.isEmpty)) {
            return items;
          }
          return items.where((it) {
            final raw = (it['location_id'] ?? '').toString();
            final did = _displayIdForLocationId(
              raw,
              RegExp(
                r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                caseSensitive: false,
              ),
              idToDisplay,
              fallbackDisplayId: resolvedActiveDisplayId,
            );
            if (resolvedActiveUuid != null && resolvedActiveUuid.isNotEmpty) {
              return raw == resolvedActiveUuid ||
                  (resolvedActiveDisplayId != null &&
                      did == resolvedActiveDisplayId);
            }
            return did == resolvedActiveDisplayId;
          }).toList();
        });
      },
    );
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
