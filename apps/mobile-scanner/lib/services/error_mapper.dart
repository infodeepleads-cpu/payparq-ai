import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app_error.dart';

class ErrorMapper {
  static String message(Object error) {
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
