import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppUpdateInfo {
  final String latestVersion;
  final int latestBuildNumber;
  final String downloadUrl;
  final bool isMandatory;

  AppUpdateInfo({
    required this.latestVersion,
    required this.latestBuildNumber,
    required this.downloadUrl,
    this.isMandatory = false,
  });

  factory AppUpdateInfo.fromJson(Map<String, dynamic> json) {
    return AppUpdateInfo(
      latestVersion: json['version'] ?? '1.0.0',
      latestBuildNumber: json['buildNumber'] ?? 1,
      downloadUrl: json['url'] ?? '',
      isMandatory: json['mandatory'] ?? false,
    );
  }
}

final updateCheckProvider = FutureProvider<AppUpdateInfo?>((ref) async {
  try {
    // 1. Get local version info
    final packageInfo = await PackageInfo.fromPlatform();
    final currentBuildNumber = int.tryParse(packageInfo.buildNumber) ?? 0;

    // 2. Fetch remote version info from the dashboard deployment
    // This assumes you will place a version.json file in your web project's 'web' folder
    final response = await http.get(Uri.parse('https://payparq-d-6rex95.web.app/version.json'));
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final updateInfo = AppUpdateInfo.fromJson(data);

      // 3. Compare build numbers
      if (updateInfo.latestBuildNumber > currentBuildNumber) {
        return updateInfo;
      }
    }
  } catch (e) {
    debugPrint('Error checking for updates: $e');
  }
  return null;
});
