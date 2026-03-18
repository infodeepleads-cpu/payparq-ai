import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'terms_conditions_screen.dart';
import '../config/app_config.dart';
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
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 1100;
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: isDesktop
          ? null
          : AppBar(
              backgroundColor: Colors.black,
              title: Text(isCroatian ? 'Postavke' : 'Settings'),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.save_outlined, color: Colors.white),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                          content: Text(isCroatian
                              ? 'Postavke su ažurirane'
                              : 'Settings updated successfully')),
                    );
                  },
                ),
              ],
            ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(isDesktop ? 48.0 : 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (isDesktop)
                        Text(isCroatian ? 'Postavke' : 'Settings',
                            style: const TextStyle(
                                fontSize: 40,
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                                letterSpacing: -1)),
                      if (isDesktop) const SizedBox(height: 8),
                      Text(
                        isCroatian
                            ? 'Upravljajte svojom organizacijom i postavkama sustava.'
                            : 'Manage your organization and system preferences.',
                        style: const TextStyle(
                            fontSize: 14, color: AppTheme.textSecondary),
                        softWrap: true,
                      ),
                    ],
                  ),
                ),
                if (isDesktop)
                  SizedBox(
                    height: 44,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                              content: Text(isCroatian
                                  ? 'Postavke su ažurirane'
                                  : 'Settings updated successfully')),
                        );
                      },
                      icon: const Icon(Icons.save_outlined, size: 18),
                      label:
                          Text(isCroatian ? 'Spremi promjene' : 'Save Changes'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4)),
                      ),
                    ),
                  ),
              ],
            ),
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
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: isCroatian ? 'Hrvatski' : 'English',
                          isExpanded: true,
                          style: const TextStyle(
                              color: Colors.black,
                              fontSize: 14,
                              fontWeight: FontWeight.w500),
                          items: const [
                            DropdownMenuItem(
                                value: 'English', child: Text('English')),
                            DropdownMenuItem(
                                value: 'Hrvatski', child: Text('Hrvatski')),
                          ],
                          onChanged: (v) {
                            if (v != null) {
                              ref
                                  .read(localeIsCroatianProvider.notifier)
                                  .state = v == 'Hrvatski';
                            }
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 48),
            _buildSection(
              title: isCroatian ? 'Aplikacija' : 'Application',
              children: [
                SizedBox(
                  height: 44,
                  child: ElevatedButton.icon(
                    onPressed: _downloadApk,
                    icon: const Icon(Icons.android, size: 18),
                    label: Text(isCroatian ? 'Preuzmi APK' : 'Download APK'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4)),
                    ),
                  ),
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
          ],
        ),
      ),
    );
  }

  Future<bool> _isApkUrlReachable(Uri url) async {
    try {
      final response = await http.get(url, headers: const {
        'Range': 'bytes=0-7'
      }).timeout(const Duration(seconds: 8));
      final contentType =
          (response.headers['content-type'] ?? '').toLowerCase();
      final looksLikeHtml = response.bodyBytes.length >= 2 &&
          response.bodyBytes[0] == 0x3C &&
          response.bodyBytes[1] == 0x21;
      final isApkContentType =
          contentType.contains('application/vnd.android.package-archive') ||
              contentType.contains('application/octet-stream');
      return response.statusCode >= 200 &&
          response.statusCode < 300 &&
          !looksLikeHtml &&
          (isApkContentType || url.path.toLowerCase().endsWith('.apk'));
    } catch (_) {
      return false;
    }
  }

  Future<void> _downloadApk() async {
    final isCroatian = ref.read(localeIsCroatianProvider);
    final ts = DateTime.now().millisecondsSinceEpoch;
    final webUrl = Uri.parse('${Uri.base.origin}/app-release.apk?v=$ts');
    final configuredUrl = Uri.parse(AppConfig.apkDownloadUrl);
    final urls = kIsWeb ? [webUrl, configuredUrl] : [configuredUrl];
    final launchMode =
        kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication;

    for (final url in urls) {
      final isReachable = await _isApkUrlReachable(url);
      if (!isReachable) {
        continue;
      }
      if (await launchUrl(url, mode: launchMode)) {
        return;
      }
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(Lang.sel(isCroatian, 'Failed to load APK',
            'Došlo je do problema s učitavanjem APK-a')),
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
