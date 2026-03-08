import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../repositories/passes_repository.dart';
import '../repositories/parking_repository.dart';
import '../../../services/app_error.dart';

final passesRepositoryProvider = Provider<PassesRepository>((ref) {
  return PassesRepository(Supabase.instance.client);
});

final passesControllerProvider = Provider<PassesController>((ref) {
  final repo = ref.watch(passesRepositoryProvider);
  return PassesController(ref, repo);
});

class PassesController {
  final Ref _ref;
  final PassesRepository _repo;

  PassesController(this._ref, this._repo);

  Future<Map<String, dynamic>> createPermit(Map<String, dynamic> data) async {
    try {
      final permit = await _repo.createPermit(data);
      _ref.invalidate(permitsStreamProvider);
      return permit;
    } catch (e) {
      throw AppError('Permit creation failed: $e', cause: e);
    }
  }
}
