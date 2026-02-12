import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../repositories/finance_repository.dart';
import '../../../services/app_error.dart';

final financeRepositoryProvider = Provider<FinanceRepository>((ref) {
  return FinanceRepository(Supabase.instance.client);
});

final financeControllerProvider = Provider<FinanceController>((ref) {
  final repo = ref.watch(financeRepositoryProvider);
  return FinanceController(repo);
});

class FinanceController {
  final FinanceRepository _repo;

  FinanceController(this._repo);

  Future<String> createConnectAccount() async {
    try {
      return await _repo.createConnectAccount();
    } catch (e) {
      throw AppError('Stripe connect failed: $e', cause: e);
    }
  }

  Future<String> getDashboardLink() async {
    try {
      return await _repo.getDashboardLink();
    } catch (e) {
      throw AppError('Dashboard link failed: $e', cause: e);
    }
  }
}
