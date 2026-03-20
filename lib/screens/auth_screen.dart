import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'terms_conditions_screen.dart';
import 'update_password_screen.dart';
import '../theme.dart';
import '../logic/providers/locale_provider.dart';
import '../logic/providers/auth_controller.dart';
import '../services/error_mapper.dart';
import '../utils/async_action_handler.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  bool isObscured = true;
  bool _resetStatusHandled = false;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String get _title => 'payparq.ai';
  String _subtitle(bool isCroatian) => isCroatian
      ? 'Započnimo ispunjavanjem donjeg obrasca.'
      : 'Let\'s get started by filling out the form below.';
  String _emailLabel(bool isCroatian) => isCroatian ? 'E-pošta' : 'Email';
  String _passwordLabel(bool isCroatian) => isCroatian ? 'Lozinka' : 'Password';
  String _signInTab(bool isCroatian) => isCroatian ? 'Prijava' : 'Sign In';
  String _forgotPassword(bool isCroatian) =>
      isCroatian ? 'Zaboravljena lozinka' : 'Forgot Password';
  String _termsText(bool isCroatian) => isCroatian
      ? 'Prijavom prihvaćate naše Uvjete i pravila privatnosti.'
      : 'By signing in, you agree to our Terms & Privacy Policy.';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _showPasswordResetStatusIfPresent();
    });
  }

  void _showPasswordResetStatusIfPresent() {
    if (!mounted || _resetStatusHandled || !kIsWeb) return;
    _resetStatusHandled = true;
    final status = Uri.base.queryParameters['pw_reset']?.trim().toLowerCase();
    if (status == null || status.isEmpty) return;
    final isCroatian = ref.read(localeIsCroatianProvider);
    if (status == 'success') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isCroatian
                ? 'Lozinka je uspješno promijenjena. Prijavite se s novom lozinkom.'
                : 'Password was updated successfully. Sign in with your new password.',
          ),
          backgroundColor: Colors.green,
        ),
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isCroatian
              ? 'Link za promjenu lozinke nije valjan ili je istekao. Zatražite novi.'
              : 'Password reset link is invalid or expired. Request a new one.',
        ),
      ),
    );
  }

  Future<void> _handleAuth() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email and password')),
      );
      return;
    }

    final result = await AsyncActionHandler.run<AuthActionResult>(
      context: context,
      action: () => ref.read(authControllerProvider).handleAuth(
            isSignIn: true,
            email: email,
            password: password,
          ),
      errorBuilder: ErrorMapper.message,
    );

    if (result?.requiresEmailVerification == true) return;
  }

  Future<void> _openResetPasswordPage() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => UpdatePasswordScreen(
          requestMode: true,
          initialEmail: _emailController.text.trim(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 800;
    final isCroatian = ref.watch(localeIsCroatianProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Color(0xD9FFFFFF),
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
        systemNavigationBarColor: Colors.white,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppTheme.lightBackground,
        body: Row(
          children: [
            // Left Side (Form)
            Expanded(
              flex: 1,
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _title,
                                style: GoogleFonts.inter(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.grey[600],
                                ),
                              ),
                              TextButton.icon(
                                onPressed: () {
                                  final current =
                                      ref.read(localeIsCroatianProvider);
                                  ref
                                      .read(localeIsCroatianProvider.notifier)
                                      .state = !current;
                                },
                                icon: const Icon(Icons.language,
                                    size: 16, color: Colors.grey),
                                label: Text(isCroatian ? 'EN' : 'HR',
                                    style: GoogleFonts.inter(
                                        color: Colors.grey[600],
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),
                          _buildSignInHeader(isCroatian),
                          const SizedBox(height: 24),
                          Text(
                            _subtitle(isCroatian),
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 32),
                          _buildTextField(
                              _emailLabel(isCroatian), _emailController),
                          const SizedBox(height: 24),
                          _buildTextField(
                              _passwordLabel(isCroatian), _passwordController,
                              isPassword: true),
                          const SizedBox(height: 32),
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton(
                              onPressed: _handleAuth,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                elevation: 0,
                              ),
                              child: Text(
                                _signInTab(isCroatian),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Center(
                            child: InkWell(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const TermsConditionsScreen(),
                                ),
                              ),
                              child: Text(
                                _termsText(isCroatian),
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  color: Colors.grey[500],
                                  fontSize: 12,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Center(
                            child: TextButton(
                              onPressed: _openResetPasswordPage,
                              child: Text(
                                _forgotPassword(isCroatian),
                                style: GoogleFonts.inter(
                                  color: Colors.grey[600],
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // Right Side (Image - Desktop Only)
            if (isDesktop)
              Expanded(
                flex: 1,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(color: Colors.black),
                    Image.network(
                      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                      fit: BoxFit.cover,
                      filterQuality: FilterQuality.high,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Image.asset(
                          'assets/images/auth_bg.jpg',
                          fit: BoxFit.cover,
                          filterQuality: FilterQuality.high,
                        );
                      },
                      errorBuilder: (context, error, stackTrace) {
                        return Image.network(
                          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2070&q=80',
                          fit: BoxFit.cover,
                          filterQuality: FilterQuality.high,
                          errorBuilder: (context, error, stackTrace) {
                            return Image.asset(
                              'assets/images/auth_bg.jpg',
                              fit: BoxFit.cover,
                              filterQuality: FilterQuality.high,
                            );
                          },
                        );
                      },
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSignInHeader(bool isCroatian) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _signInTab(isCroatian),
          style: GoogleFonts.inter(
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 2,
          width: 40,
          color: AppTheme.primary,
        ),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller,
      {bool isPassword = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isPassword && isObscured,
          decoration: InputDecoration(
            hintText: label,
            hintStyle: TextStyle(color: Colors.grey[400]),
            filled: true,
            fillColor: const Color(0xFFF9FAFB), // Very light grey
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.primary),
            ),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                      isObscured
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: Colors.grey[400],
                    ),
                    onPressed: () => setState(() => isObscured = !isObscured),
                  )
                : null,
          ),
        ),
      ],
    );
  }
}
