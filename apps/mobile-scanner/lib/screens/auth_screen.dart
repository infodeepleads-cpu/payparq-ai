import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'terms_conditions_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import '../logic/providers/locale_provider.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  bool isSignIn = true;
  bool isObscured = true;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String get _title => 'payparq.ai';
  String _subtitle(bool isCroatian) => isCroatian
      ? 'Započnimo ispunjavanjem donjeg obrasca.'
      : 'Let\'s get started by filling out the form below.';
  String _emailLabel(bool isCroatian) => isCroatian ? 'E-pošta' : 'Email';
  String _passwordLabel(bool isCroatian) => isCroatian ? 'Lozinka' : 'Password';
  String get _signInTab => 'Sign In';
  String get _signUpTab => 'Sign Up';
  String _forgotPassword(bool isCroatian) =>
      isCroatian ? 'Zaboravljena lozinka' : 'Forgot Password';
  String _termsText(bool isCroatian) => isCroatian
      ? 'Registracijom prihvaćate naše Uvjete i pravila privatnosti.'
      : 'By signing up, you agree to our Terms & Privacy Policy.';

  Future<void> _handleAuth() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email and password')),
      );
      return;
    }

    try {
      if (isSignIn) {
        await Supabase.instance.client.auth.signInWithPassword(
          email: email,
          password: password,
        );
      } else {
        final response = await Supabase.instance.client.auth.signUp(
          email: email,
          password: password,
        );

        if (response.user != null && response.session == null) {
          // If email confirmation is enabled, session will be null
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                    'Signup successful! Please check your email to verify your account before logging in.'),
                backgroundColor: Colors.blue,
                duration: Duration(seconds: 10),
              ),
            );
            setState(() => isSignIn = true); // Switch to sign in tab
          }
          return;
        }
      }

      // No manual Navigator.pushReplacement here. main.dart handles it.
    } on AuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('An unexpected error occurred'),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _showResetPasswordDialog() async {
    final emailCtrl = TextEditingController();
    final rootContext = context;
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Reset Password'),
        content: TextField(
          controller: emailCtrl,
          decoration: const InputDecoration(hintText: 'Enter your email'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final email = emailCtrl.text.trim();
              if (email.isEmpty) return;
              Navigator.pop(dialogContext);
              await Supabase.instance.client.auth
                  .resetPasswordForEmail(email);
              if (!mounted) return;
              ScaffoldMessenger.of(rootContext).showSnackBar(
                const SnackBar(content: Text('Password reset link sent!')),
              );
            },
            child: const Text('Send Reset Link'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 800;
    final isCroatian = ref.watch(localeIsCroatianProvider);

    return Scaffold(
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
                      // Custom Tab Toggle
                      Row(
                        children: [
                          _buildTabButton(_signInTab, true),
                          const SizedBox(width: 24),
                          _buildTabButton(_signUpTab, false),
                        ],
                      ),
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
                            isSignIn ? _signInTab : _signUpTab,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      if (!isSignIn) ...[
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
                      ],
                      const SizedBox(height: 24),
                      Center(
                        child: TextButton(
                          onPressed: _showResetPasswordDialog,
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
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.black,
                  image: DecorationImage(
                    image: NetworkImage(
                      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', // Skyscraper worm's eye view
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.2),
                        Colors.black.withValues(alpha: 0.6),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTabButton(String title, bool isSelectedTab) {
    final selected = isSignIn == isSelectedTab;
    return GestureDetector(
      onTap: () => setState(() => isSignIn = isSelectedTab),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              color: selected ? Colors.black : Colors.grey[400],
            ),
          ),
          const SizedBox(height: 8),
          if (selected)
            Container(
              height: 2,
              width: 40,
              color: AppTheme.primary,
            ),
        ],
      ),
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
