import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'terms_conditions_screen.dart';
import '../theme.dart';
import '../logic/providers/locale_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _orgController = TextEditingController(text: 'PayParq Metropolis');
  final _emailController = TextEditingController(text: 'admin@payparq.ai');

  @override
  void dispose() {
    _orgController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    final showAdvanced = ref.watch(showAdvancedTabsProvider);
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(isCroatian ? 'Postavke' : 'Settings',
                style: const TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                    letterSpacing: -1)),
            const SizedBox(height: 8),
            Text(
                isCroatian
                    ? 'Upravljajte svojom organizacijom i postavkama sustava.'
                    : 'Manage your organization and system preferences.',
                style: const TextStyle(
                    fontSize: 14, color: AppTheme.textSecondary)),
            const SizedBox(height: 48),
            _buildSection(
              title:
                  isCroatian ? 'Profil organizacije' : 'Organization Profile',
              children: [
                _buildTextField(
                    isCroatian ? 'Naziv organizacije' : 'Organization Name',
                    _orgController),
                const SizedBox(height: 24),
                _buildTextField(
                    isCroatian ? 'E-pošta administratora' : 'Admin Email',
                    _emailController),
              ],
            ),
            const SizedBox(height: 48),
            _buildSection(
              title: isCroatian ? 'Jezik' : 'Language',
              children: [
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 44,
                        child: OutlinedButton(
                          onPressed: () {
                            ref.read(localeIsCroatianProvider.notifier).state =
                                false;
                          },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                                color: isCroatian
                                    ? Colors.grey[300]!
                                    : Colors.black),
                            backgroundColor:
                                isCroatian ? Colors.white : Colors.black,
                          ),
                          child: Text(
                            'English',
                            style: TextStyle(
                              color: isCroatian ? Colors.black : Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SizedBox(
                        height: 44,
                        child: OutlinedButton(
                          onPressed: () {
                            ref.read(localeIsCroatianProvider.notifier).state =
                                true;
                          },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                                color: isCroatian
                                    ? Colors.black
                                    : Colors.grey[300]!),
                            backgroundColor:
                                isCroatian ? Colors.black : Colors.white,
                          ),
                          child: Text(
                            'Hrvatski',
                            style: TextStyle(
                              color: isCroatian ? Colors.white : Colors.black,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 48),
            _buildSection(
              title: isCroatian ? 'Napredne kartice' : 'Advanced Tabs',
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isCroatian
                                ? 'Prikaži Analytics i Dinamičko određivanje cijena'
                                : 'Show Analytics and Dynamic Pricing',
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.black),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isCroatian
                                ? 'Omogućite kartice bez obzira na ulogu korisnika.'
                                : 'Enable tabs regardless of user role.',
                            style: const TextStyle(
                                fontSize: 13, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: showAdvanced,
                      activeThumbColor: Colors.black,
                      onChanged: (v) =>
                          ref.read(showAdvancedTabsProvider.notifier).state = v,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 48),
            Center(
              child: TextButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TermsConditionsScreen(),
                  ),
                ),
                child: Text(
                  isCroatian
                      ? 'Uvjeti i pravila privatnosti'
                      : 'Terms & Privacy Policy',
                  style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 13,
                      decoration: TextDecoration.underline),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Center(
              child: SizedBox(
                width: 200,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Settings updated successfully')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4)),
                  ),
                  child: Text(isCroatian ? 'Spremi promjene' : 'Save Changes',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
      {required String title, required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black)),
          const SizedBox(height: 32),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.black)),
        const SizedBox(height: 12),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            filled: true,
            fillColor: AppTheme.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ],
    );
  }
}
