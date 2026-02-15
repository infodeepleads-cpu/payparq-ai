import 'package:supabase_flutter/supabase_flutter.dart';

class StaffRepository {
  final SupabaseClient _client;

  StaffRepository(this._client);

  Future<Map<String, dynamic>> createOfficer({
    required String email,
    required String name,
    required String role,
    String? locationId,
  }) async {
    final Map<String, dynamic> body = {
      'email': email,
      'name': name,
      'role': role,
    };
    if (locationId != null && locationId.isNotEmpty) {
      body['location_id'] = locationId;
    }
    final response =
        await _client.functions.invoke('create-officer', body: body);
    if (response.status != 200) {
      final errorMsg = response.data is Map
          ? (response.data['error'] ?? 'Server Error')
          : 'Staff creation failed.';
      throw Exception(errorMsg);
    }
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> insertAssignments(List<Map<String, dynamic>> assignments) async {
    if (assignments.isEmpty) return;
    await _client.from('officer_assignments').insert(assignments);
  }

  Future<void> deleteStaff(String id) async {
    await _client.functions.invoke('delete-staff', body: {'userId': id});
  }
}
