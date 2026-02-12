import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/app_error.dart';

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
        await _auth.signInWithPassword(email: email, password: password);
        return const AuthActionResult();
      } else {
        final response = await _auth.signUp(email: email, password: password);
        if (response.user != null && response.session == null) {
          return const AuthActionResult(requiresEmailVerification: true);
        }
        return const AuthActionResult();
      }
    } on AuthException catch (e) {
      throw AppError(e.message, cause: e);
    } catch (e) {
      throw AppError('An unexpected error occurred', cause: e);
    }
  }

  Future<void> resetPassword(String email) async {
    try {
      await _auth.resetPasswordForEmail(email);
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
