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

  Future<String> createConnectAccount({String? country}) async {
    try {
      return await _repo.createConnectAccount(country: country);
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

  Future<List<Map<String, dynamic>>> loadOwnerLedger() async {
    try {
      return await _repo.loadOwnerLedger();
    } catch (e) {
      throw AppError('Failed to load owner ledger: $e', cause: e);
    }
  }

  Future<void> allocateOwnerPayout({
    required String ownerId,
    required int ownerAmountCents,
    required int payparqAmountCents,
    String? notes,
  }) async {
    try {
      await _repo.allocateOwnerPayout(
        ownerId: ownerId,
        ownerAmountCents: ownerAmountCents,
        payparqAmountCents: payparqAmountCents,
        notes: notes,
      );
    } catch (e) {
      throw AppError('Payout failed: $e', cause: e);
    }
  }

  Future<String> sendManualPayout({
    required String recipientId,
    required String role,
    required int amountCents,
    String? weekLabel,
    String? note,
  }) async {
    try {
      return await _repo.sendManualPayout(
        recipientId: recipientId,
        role: role,
        amountCents: amountCents,
        weekLabel: weekLabel,
        note: note,
      );
    } catch (e) {
      throw AppError('Manual payout failed: $e', cause: e);
    }
  }
}
