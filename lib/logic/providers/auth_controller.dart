import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/app_error.dart';
import '../../config/app_config.dart';

class AuthActionResult {
  final bool requiresEmailVerification;

  const AuthActionResult({this.requiresEmailVerification = false});
}

final authControllerProvider = Provider<AuthController>((ref) {
  return AuthController(Supabase.instance.client);
});

class AuthController {
  final SupabaseClient _client;
  GoTrueClient get _auth => _client.auth;

  AuthController(this._client);

  String _redirectUrl() {
    final base = AppConfig.supabaseRedirectUrl.trim();
    if (base.isEmpty) return base;
    return base.endsWith('/') ? base : '$base/';
  }

  String? _validatedRedirectUrl() {
    final value = _redirectUrl();
    if (value.isEmpty) return null;
    final uri = Uri.tryParse(value);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) return null;
    return value;
  }

  bool _isEmailValid(String value) {
    final email = value.trim();
    final regex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    return regex.hasMatch(email);
  }

  Future<AuthActionResult> handleAuth({
    required bool isSignIn,
    required String email,
    required String password,
  }) async {
    int attempts = 0;
    const maxAttempts = 2; // Try up to 2 times (initial + 1 retry)

    while (attempts < maxAttempts) {
      try {
        if (isSignIn) {
          final e = email.trim();
          final p = password;
          debugPrint(
              'AuthController: signInWithPassword attempt=${attempts + 1} emailLen=${e.length}');

          // Use a shorter timeout for the first attempt, longer for the second
          final timeout = Duration(seconds: attempts == 0 ? 10 : 20);

          await _auth
              .signInWithPassword(email: e, password: p)
              .timeout(timeout);
          debugPrint('AuthController: signInWithPassword success');
          return const AuthActionResult();
        } else {
          throw AppError(
            'Sign up is disabled. Ask an administrator to create your account.',
          );
        }
      } catch (e) {
        attempts++;
        final isLastAttempt = attempts >= maxAttempts;
        final errorStr = e.toString().toLowerCase();

        // If it's a credentials error, don't retry
        if (errorStr.contains('invalid login credentials') ||
            errorStr.contains('invalid email') ||
            errorStr.contains('password') ||
            errorStr.contains('not found')) {
          _handleAuthError(e);
        }

        // If it's a connection error or timeout, and we have attempts left, retry
        final isConnectionError = errorStr.contains('connection') ||
            errorStr.contains('socket') ||
            errorStr.contains('timeout') ||
            errorStr.contains('failed to host') ||
            errorStr.contains('network');

        if (isConnectionError && !isLastAttempt) {
          debugPrint(
              'AuthController: connection error on attempt $attempts, retrying... $e');
          // Small delay before retry
          await Future.delayed(Duration(milliseconds: 500 * attempts));
          continue;
        }

        // Otherwise, throw the error
        _handleAuthError(e);
      }
    }
    throw AppError('Authentication failed after multiple attempts');
  }

  void _handleAuthError(Object e) {
    if (e is AuthException) {
      debugPrint('AuthController: AuthException ${e.message}');
      throw AppError(e.message, cause: e);
    } else if (e is TimeoutException) {
      debugPrint('AuthController: TimeoutException');
      throw AppError(
          'Connection timed out. Please check your internet and try again.');
    } else {
      debugPrint('AuthController: unexpected error $e');
      throw AppError('An unexpected error occurred', cause: e);
    }
  }

  Future<void> resetPassword(String email) async {
    final normalized = email.trim().toLowerCase();
    if (normalized.isEmpty || !_isEmailValid(normalized)) {
      throw AppError('Please enter a valid email address');
    }
    final redirectTo = _validatedRedirectUrl();
    if (redirectTo == null) {
      throw AppError('Password reset redirect URL is missing');
    }
    try {
      await _auth.resetPasswordForEmail(normalized, redirectTo: redirectTo);
    } on AuthException catch (e) {
      throw AppError(e.message, cause: e);
    } catch (e) {
      throw AppError('Failed to send reset link', cause: e);
    }
  }

  String? currentUserId() => _auth.currentUser?.id;
  User? currentUser() => _auth.currentUser;

  Future<void> refreshSession() async {
    try {
      await _auth.refreshSession();
    } on AuthException catch (e) {
      throw AppError(e.message, cause: e);
    } catch (e) {
      throw AppError('Session refresh failed', cause: e);
    }
  }

  Future<void> updatePassword(String newPassword) async {
    try {
      await _auth.updateUser(UserAttributes(password: newPassword));
    } on AuthException catch (e) {
      throw AppError(e.message, cause: e);
    } catch (e) {
      throw AppError('Failed to update password', cause: e);
    }
  }

  Future<void> updatePasswordAndSignOut(String newPassword) async {
    try {
      await _auth.updateUser(UserAttributes(password: newPassword));
      await _auth.signOut();
    } on AuthException catch (e) {
      throw AppError(e.message, cause: e);
    } catch (e) {
      throw AppError('Failed to finalize password reset', cause: e);
    }
  }

  Future<void> requestPasswordChange({
    required String email,
    required String newPassword,
  }) async {
    final normalized = email.trim().toLowerCase();
    if (normalized.isEmpty || !_isEmailValid(normalized)) {
      throw AppError('Please enter a valid email address');
    }
    if (newPassword.trim().length < 8) {
      throw AppError('Password must be at least 8 characters');
    }
    final response = await _client.functions.invoke(
      'send-password-recovery',
      body: <String, dynamic>{
        'action': 'request_password_change',
        'email': normalized,
        'newPassword': newPassword,
      },
    );
    if (response.status < 200 || response.status >= 300) {
      final data = response.data;
      final message = data is Map && data['error'] != null
          ? data['error'].toString()
          : 'Failed to send reset email (Status: ${response.status}). Please try again later.';
      throw AppError(message);
    }
    final data = response.data;
    if (data is Map && data['error'] != null) {
      throw AppError(data['error'].toString());
    }
  }

  Future<void> signOut() async {
    try {
      await _auth.signOut();
    } on AuthException catch (e) {
      throw AppError(e.message, cause: e);
    } catch (e) {
      throw AppError('Sign out failed', cause: e);
    }
  }
}
