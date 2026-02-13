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
  return AuthController(Supabase.instance.client.auth);
});

class AuthController {
  final GoTrueClient _auth;

  AuthController(this._auth);

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
        final redirectBase = AppConfig.supabaseRedirectUrl;
        final response = await _auth.signUp(
          email: email.trim(),
          password: password.trim(),
          data: {'role': 'admin'},
          emailRedirectTo: '$redirectBase/',
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
    try {
      await _auth.resetPasswordForEmail(email,
          redirectTo: AppConfig.supabaseRedirectUrl);
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
