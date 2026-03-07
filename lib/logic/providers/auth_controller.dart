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

  Future<void> _sendPasswordRecoveryViaFunction({
    required String email,
    String? redirectTo,
  }) async {
    final payload = <String, dynamic>{'email': email};
    if (redirectTo != null && redirectTo.isNotEmpty) {
      payload['redirectTo'] = redirectTo;
    }
    final response = await _client.functions.invoke(
      'send-password-recovery',
      body: payload,
    );
    if (response.status < 200 || response.status >= 300) {
      final data = response.data;
      String message = 'Password reset email failed';
      if (data is Map && data['error'] != null) {
        message = data['error'].toString();
      } else if (data != null) {
        message = data.toString();
      }
      throw AppError(message);
    }
    final data = response.data;
    if (data is Map && data['error'] != null) {
      throw AppError(data['error'].toString());
    }
  }

  Future<AuthActionResult> handleAuth({
    required bool isSignIn,
    required String email,
    required String password,
  }) async {
    try {
      if (isSignIn) {
        final e = email.trim();
        final p = password.trim();
        debugPrint(
            'AuthController: signInWithPassword emailLen=${e.length} passLen=${p.length}');
        await _auth.signInWithPassword(email: e, password: p);
        debugPrint('AuthController: signInWithPassword success');
        return const AuthActionResult();
      } else {
        final redirectBase = _validatedRedirectUrl();
        final response = redirectBase != null
            ? await _auth.signUp(
                email: email.trim(),
                password: password.trim(),
                data: {'role': 'admin'},
                emailRedirectTo: redirectBase,
              )
            : await _auth.signUp(
                email: email.trim(),
                password: password.trim(),
                data: {'role': 'admin'},
              );
        if (response.user != null && response.session == null) {
          return const AuthActionResult(requiresEmailVerification: true);
        }
        return const AuthActionResult();
      }
    } on AuthException catch (e) {
      debugPrint('AuthController: AuthException ${e.message}');
      debugPrint('AuthController: AuthException raw=${e.toString()}');
      throw AppError(e.message, cause: e);
    } catch (e) {
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
    try {
      if (redirectTo != null) {
        await _auth.resetPasswordForEmail(normalized, redirectTo: redirectTo);
        return;
      }
      await _auth.resetPasswordForEmail(normalized);
    } on AuthException catch (e) {
      try {
        await _sendPasswordRecoveryViaFunction(
          email: normalized,
          redirectTo: redirectTo,
        );
        return;
      } catch (_) {}
      final msg = e.message.toLowerCase();
      final shouldRetryWithoutRedirect = msg.contains('unexpected') ||
          msg.contains('failure') ||
          msg.contains('redirect') ||
          msg.contains('invalid request');
      if (shouldRetryWithoutRedirect && redirectTo != null) {
        try {
          await _auth.resetPasswordForEmail(normalized);
          return;
        } catch (_) {}
      }
      try {
        await _sendPasswordRecoveryViaFunction(email: normalized);
        return;
      } catch (fallbackError) {
        if (fallbackError is AppError) {
          rethrow;
        }
        throw AppError(e.message, cause: e);
      }
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
