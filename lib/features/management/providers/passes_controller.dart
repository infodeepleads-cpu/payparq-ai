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

  Future<void> createPermit(Map<String, dynamic> data) async {
    try {
      await _repo.createPermit(data);
      _ref.invalidate(permitsStreamProvider);
    } catch (e) {
      throw AppError('Permit creation failed: $e', cause: e);
    }
  }
}
