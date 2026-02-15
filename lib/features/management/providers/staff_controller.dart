import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../logic/providers/auth_providers.dart';
import '../repositories/staff_repository.dart';
import '../repositories/parking_repository.dart';
import '../../../services/app_error.dart';

final staffRepositoryProvider = Provider<StaffRepository>((ref) {
  return StaffRepository(Supabase.instance.client);
});

final staffControllerProvider = Provider<StaffController>((ref) {
  final repo = ref.watch(staffRepositoryProvider);
  return StaffController(ref, repo);
});

class StaffController {
  final Ref _ref;
  final StaffRepository _repo;

  StaffController(this._ref, this._repo);

  Future<void> createStaff({
    required String email,
    required String name,
    required String role,
    required List<String> locationIds,
  }) async {
    final allowedRoles = {'super_admin', 'admin', 'manager', 'officer'};
    if (!allowedRoles.contains(role)) {
      throw const AppError('Invalid role');
    }
    final requiresAssignment = role == 'manager' || role == 'officer';
    if (requiresAssignment && locationIds.isEmpty) {
      throw const AppError('No locations selected');
    }
    final primaryLocationId = requiresAssignment
        ? (locationIds.isNotEmpty ? locationIds.first : null)
        : null;
    final response = await _repo.createOfficer(
      email: email,
      name: name,
      role: role,
      locationId: primaryLocationId,
    );
    final newStaffId = response['user']?['id'];
    if (newStaffId == null) {
      throw const AppError('Staff creation failed');
    }
    if (requiresAssignment && locationIds.length > 1) {
      final assignments = locationIds.skip(1).map((lid) {
        return {
          'officer_id': newStaffId,
          'location_id': lid,
          'assigned_by': Supabase.instance.client.auth.currentUser?.id,
        };
      }).toList();
      await _repo.insertAssignments(assignments);
    }
    _ref.invalidate(staffStreamProvider);
    _ref.invalidate(userProfileProvider);
  }

  Future<void> deleteStaff(String id) async {
    try {
      final currentUserId = Supabase.instance.client.auth.currentUser?.id;
      try {
        await Supabase.instance.client
            .from('officer_assignments')
            .delete()
            .eq('officer_id', id);
      } catch (_) {}
      if (currentUserId != null) {
        try {
          await Supabase.instance.client
              .from('locations')
              .update({'owner_id': currentUserId}).eq('owner_id', id);
        } catch (_) {}
      } else {
        try {
          await Supabase.instance.client
              .from('locations')
              .update({'owner_id': null}).eq('owner_id', id);
        } catch (_) {}
      }
      await _repo.deleteStaff(id);
      _ref.invalidate(staffStreamProvider);
      _ref.invalidate(availableLocationsProvider);
      _ref.invalidate(locationsStreamProvider);
    } catch (e) {
      throw AppError('Delete failed: $e', cause: e);
    }
  }
}
