import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app_error.dart';

class ErrorMapper {
  static bool _isQuickTicketDuplicateText(String text) {
    final normalized = text.toLowerCase();
    final has23505 = normalized.contains('23505');
    final hasDuplicateKey = normalized.contains('duplicate key');
    final hasConstraintName =
        normalized.contains('violations_quick_ticket_one_per_day_idx') ||
            normalized.contains('violations__quickticket_one_per_day_idx') ||
            normalized.contains('quickticket_one_per_day_idx') ||
            normalized.contains('quick_ticket_one_per_day_idx');
    final hasQuickTicketColumns = normalized.contains('location_id') &&
        normalized.contains('plate_normalized') &&
        normalized.contains('case_date_local');
    return (has23505 && hasDuplicateKey && hasConstraintName) ||
        (has23505 && hasDuplicateKey && hasQuickTicketColumns);
  }

  static bool _isQuickTicketDuplicatePostgrest(PostgrestException error) {
    final code = (error.code ?? '').toString().toLowerCase();
    final message = (error.message).toString().toLowerCase();
    final details = (error.details ?? '').toString().toLowerCase();
    final hint = (error.hint ?? '').toString().toLowerCase();
    if (code == '23505' &&
        (message.contains('quick') ||
            details.contains('quick') ||
            hint.contains('quick'))) {
      return true;
    }
    final combined = '$code $message $details $hint';
    return _isQuickTicketDuplicateText(combined);
  }

  static bool _isQuickTicketDuplicateError(Object error) {
    if (error is PostgrestException) {
      return _isQuickTicketDuplicatePostgrest(error);
    }
    if (error is AppError) {
      if (_isQuickTicketDuplicateText(error.message)) return true;
      final cause = error.cause;
      if (cause is PostgrestException) {
        return _isQuickTicketDuplicatePostgrest(cause);
      }
      if (cause != null) {
        return _isQuickTicketDuplicateText(cause.toString());
      }
    }
    return _isQuickTicketDuplicateText(error.toString());
  }

  static String message(Object error) {
    if (_isQuickTicketDuplicateError(error)) {
      return 'Quick ticket already exists today for this plate at this location.';
    }
    if (error is AppError) return error.message;
    if (error is AuthException) return error.message;
    if (error is PostgrestException) return error.message;
    if (error is StorageException) return error.message;
    if (error is TimeoutException) return error.message ?? 'Request timed out';
    final text = error.toString();
    if (text.contains('Invalid format')) {
      return 'The email address format is invalid.';
    }
    if (text.contains('already in use')) {
      return 'This email is already registered.';
    }
    return text;
  }
}
