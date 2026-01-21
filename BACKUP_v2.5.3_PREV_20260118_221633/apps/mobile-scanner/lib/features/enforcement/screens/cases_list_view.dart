import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../../management/repositories/parking_repository.dart';
import '../../../logic/providers/auth_providers.dart';

class CasesListView extends ConsumerStatefulWidget {
  const CasesListView({super.key});

  @override
  ConsumerState<CasesListView> createState() => _CasesListViewState();
}

class _CasesListViewState extends ConsumerState<CasesListView> {
  final ImagePicker _picker = ImagePicker();
  bool _isProcessing = false;

  Future<void> _handleQuickAction({required bool isWarning}) async {
    final profile = ref.read(userProfileProvider).value;
    if (profile == null) return;

    // Priority: 1. Manually selected location, 2. Profile location
    final locationId =
        ref.read(selectedLocationIdProvider) ?? profile['location_id'];

    if (locationId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Error: No Location ID selected or assigned.')),
      );
      return;
    }

    // 1. Capture Photo
    final XFile? image =
        await _picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (image == null) return;

    setState(() => _isProcessing = true);

    try {
      final supabase = Supabase.instance.client;
      // Use a placeholder plate for "Quick Actions" until LPR is integrated
      final plate =
          'QUICK-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$plate.jpg';

      // 2. Upload Evidence
      final bytes = await image.readAsBytes();
      await supabase.storage.from('evidence').uploadBinary(
            fileName,
            bytes,
            fileOptions: const FileOptions(contentType: 'image/jpeg'),
          );

      // 3. Create Violation Record with location_id
      await supabase.from('violations').insert({
        'plate': plate,
        'violation_type': isWarning ? 'Quick Warning' : 'Quick Ticket',
        'fine_amount': isWarning ? 0.00 : 50.00,
        'status': isWarning ? 'warning' : 'issued',
        'location_id': locationId,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isWarning ? 'Warning Issued!' : 'Ticket Issued!'),
            backgroundColor: isWarning ? Colors.orange : Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final violationsAsync = ref.watch(violationsStreamProvider);
    final selectedLocId = ref.watch(selectedLocationIdProvider);

    // Watch global selection
    ref.listen(selectedLocationIdProvider, (previous, next) {
      if (next != null && next != previous) {
        ref.invalidate(violationsStreamProvider);
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Padding(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cases Log',
                      style: GoogleFonts.inter(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      selectedLocId != null
                          ? 'Monitoring Lot: $selectedLocId'
                          : 'Please select a lot in the top bar.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
                if (selectedLocId != null)
                  Row(
                    children: [
                      if (_isProcessing)
                        const Padding(
                          padding: EdgeInsets.only(right: 16.0),
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.black),
                          ),
                        ),
                      ElevatedButton.icon(
                        onPressed: _isProcessing
                            ? null
                            : () => _handleQuickAction(isWarning: true),
                        icon: const Icon(Icons.warning_amber_rounded, size: 18),
                        label: const Text('Quick Warning'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.black,
                          side: const BorderSide(color: AppTheme.border),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 12),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton.icon(
                        onPressed: _isProcessing
                            ? null
                            : () => _handleQuickAction(isWarning: false),
                        icon: const Icon(Icons.receipt_long, size: 18),
                        label: const Text('Quick Ticket'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 12),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4)),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: 48),

            // List
            Expanded(
              child: violationsAsync.when(
                loading: () => const Center(
                    child: CircularProgressIndicator(color: Colors.black)),
                error: (err, stack) => Center(child: Text('Error: $err')),
                data: (violations) {
                  if (violations.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.folder_open_outlined,
                              size: 64, color: Colors.grey[200]),
                          const SizedBox(height: 16),
                          Text('No active cases found.',
                              style: TextStyle(color: Colors.grey[400])),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    itemCount: violations.length,
                    itemBuilder: (context, index) {
                      final violation = violations[index];
                      final status = violation['status'] ?? 'issued';
                      final issuedAtStr = violation['issued_at'];
                      final issuedAt = issuedAtStr != null
                          ? DateTime.parse(issuedAtStr)
                          : DateTime.now();

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.black,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                (violation['plate'] ?? 'UNKNOWN').toUpperCase(),
                                style: GoogleFonts.inter(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                            const SizedBox(width: 24),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    violation['violation_type'] ?? 'General',
                                    style: GoogleFonts.inter(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: Colors.black),
                                  ),
                                  Text(
                                    'Zone A • ${_formatDate(issuedAt)}',
                                    style: GoogleFonts.inter(
                                        color: AppTheme.textSecondary,
                                        fontSize: 14),
                                  ),
                                ],
                              ),
                            ),
                            _buildStatusBadge(status),
                            const SizedBox(width: 24),
                            Text(
                              '\$${violation['fine_amount'] ?? 0}',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                                color: Colors.black,
                              ),
                            ),
                            const SizedBox(width: 24),
                            ElevatedButton(
                              onPressed: () {},
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(4)),
                              ),
                              child: const Text('View'),
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    bool isPaid = status.toLowerCase() == 'paid';
    bool isWarning = status.toLowerCase() == 'warning';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isPaid
                  ? Colors.green[400]
                  : (isWarning ? Colors.orange[400] : Colors.red[400]),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            status.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return "${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}";
  }
}
