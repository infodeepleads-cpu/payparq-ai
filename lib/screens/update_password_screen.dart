import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../logic/providers/auth_controller.dart';
import '../logic/providers/locale_provider.dart';
import '../services/error_mapper.dart';
import '../utils/async_action_handler.dart';
import '../theme.dart';

class UpdatePasswordScreen extends ConsumerStatefulWidget {
  final bool requestMode;
  final String? initialEmail;

  const UpdatePasswordScreen({
    super.key,
    this.requestMode = false,
    this.initialEmail,
  });

  @override
  ConsumerState<UpdatePasswordScreen> createState() =>
      _UpdatePasswordScreenState();
}

class _UpdatePasswordScreenState extends ConsumerState<UpdatePasswordScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isObscured = true;

  @override
  void initState() {
    super.initState();
    _emailController.text = widget.requestMode
        ? (widget.initialEmail?.trim() ?? '')
        : (ref.read(authControllerProvider).currentUser()?.email ?? '');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _handleUpdate() async {
    final isCroatian = ref.read(localeIsCroatianProvider);
    final email = _emailController.text.trim().toLowerCase();
    final password = _passwordController.text.trim();
    final confirm = _confirmController.text.trim();

    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isCroatian ? 'Unesite svoju e-poštu' : 'Please enter your email',
          ),
        ),
      );
      return;
    }

    if (password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isCroatian
                ? 'Unesite novu lozinku'
                : 'Please enter a new password',
          ),
        ),
      );
      return;
    }

    if (password != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isCroatian ? 'Lozinke se ne podudaraju' : 'Passwords do not match',
          ),
        ),
      );
      return;
    }

    await AsyncActionHandler.run<void>(
      context: context,
      action: () => widget.requestMode
          ? ref.read(authControllerProvider).requestPasswordChange(
                email: email,
                newPassword: password,
              )
          : ref.read(authControllerProvider).updatePasswordAndSignOut(password),
      successMessage: widget.requestMode
          ? (isCroatian
              ? 'Link za potvrdu je poslan. Otvorite e-poštu i kliknite poveznicu za aktivaciju nove lozinke.'
              : 'Confirmation link sent. Open your email and click the link to activate your new password.')
          : (isCroatian
              ? 'Lozinka je ažurirana. Prijavite se s novom lozinkom.'
              : 'Password updated. Please sign in with your new password.'),
      errorBuilder: ErrorMapper.message,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
            widget.requestMode
                ? (isCroatian ? 'Resetiranje lozinke' : 'Reset Password')
                : (isCroatian ? 'Ažuriranje lozinke' : 'Update Password'),
            style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    widget.requestMode
                        ? (isCroatian
                            ? 'Resetirajte lozinku'
                            : 'Reset your password')
                        : (isCroatian
                            ? 'Postavite novu lozinku'
                            : 'Set your new password'),
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.requestMode
                        ? (isCroatian
                            ? 'Unesite e-poštu i novu lozinku. Poslat ćemo vam e-poruku s poveznicom za potvrdu.'
                            : 'Enter your email and new password. We will email you a confirmation link.')
                        : (isCroatian
                            ? 'Unesite novu lozinku i potvrdite je.'
                            : 'Enter your new password and confirm it.'),
                    style: GoogleFonts.inter(color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  TextFormField(
                    controller: _emailController,
                    readOnly: !widget.requestMode,
                    decoration: InputDecoration(
                      labelText: isCroatian ? 'E-pošta' : 'Email',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passwordController,
                    obscureText: _isObscured,
                    decoration: InputDecoration(
                      labelText: isCroatian ? 'Nova lozinka' : 'New Password',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      suffixIcon: IconButton(
                        icon: Icon(_isObscured
                            ? Icons.visibility
                            : Icons.visibility_off),
                        onPressed: () =>
                            setState(() => _isObscured = !_isObscured),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _confirmController,
                    obscureText: _isObscured,
                    decoration: InputDecoration(
                      labelText: isCroatian
                          ? 'Ponovite novu lozinku'
                          : 'Repeat New Password',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _handleUpdate,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        widget.requestMode
                            ? (isCroatian
                                ? 'Pošalji e-poruku za potvrdu'
                                : 'Send Confirmation Email')
                            : (isCroatian
                                ? 'Ažuriraj lozinku'
                                : 'Update Password'),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
