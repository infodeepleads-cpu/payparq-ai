import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../../theme.dart';

final pendingVerificationsProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  return Supabase.instance.client
      .from('locations')
      .stream(primaryKey: ['id'])
      .eq('verification_status', 'pending')
      .order('verification_submitted_at', ascending: false);
});

class VerificationInboxScreen extends ConsumerWidget {
  const VerificationInboxScreen({super.key});

  Future<void> _updateStatus(
      BuildContext context, String locationId, String status,
      {bool? isRunByPayparq}) async {
    try {
      final updates = <String, dynamic>{
        'verification_status': status,
        'verification_reviewed_at': DateTime.now().toIso8601String(),
        'verification_reviewed_by':
            Supabase.instance.client.auth.currentUser?.id,
      };

      if (isRunByPayparq != null) {
        updates['is_run_by_payparq'] = isRunByPayparq;
      }

      await Supabase.instance.client
          .from('locations')
          .update(updates)
          .eq('id', locationId);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Status updated to $status'),
              backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showVerificationDetail(BuildContext context, Map<String, dynamic> loc) {
    final rootContext = context;
    final List<dynamic> photos = loc['verification_photos'] ?? [];
    final submittedAt = loc['verification_submitted_at'] != null
        ? DateTime.parse(loc['verification_submitted_at'])
        : null;
    bool isRunByPayparq = false;

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog.fullscreen(
          backgroundColor: Colors.black,
          child: Column(
            children: [
              AppBar(
                backgroundColor: Colors.black,
                title: Text(loc['name'] ?? 'Verification Detail'),
                leading: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Submitted on: ${submittedAt != null ? DateFormat('MMM dd, yyyy HH:mm').format(submittedAt) : 'N/A'}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Lot Management Type',
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.1),
                          ),
                        ),
                        child: const Column(
                          children: [
                            RadioListTile<bool>(
                              title: Text('Regular Lot',
                                  style: TextStyle(color: Colors.white)),
                              subtitle: Text(
                                  'Admin managed. Standard commissions apply.',
                                  style: TextStyle(color: Colors.grey)),
                              value: false,
                            ),
                            RadioListTile<bool>(
                              title: Text('Run by Payparq',
                                  style: TextStyle(color: Colors.white)),
                              subtitle: Text(
                                  'Payparq managed. 50% flat commission on all shared revenue.',
                                  style: TextStyle(color: Colors.grey)),
                              value: true,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      Text(
                        'Verification Photos (${photos.length})',
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 16),
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 1,
                        ),
                        itemCount: photos.length,
                        itemBuilder: (context, index) {
                          return InkWell(
                            onTap: () {
                              showDialog(
                                context: context,
                                builder: (context) => Dialog.fullscreen(
                                  backgroundColor: Colors.black,
                                  child: Stack(
                                    children: [
                                      Center(
                                        child: Image.network(photos[index]),
                                      ),
                                      Positioned(
                                        top: 40,
                                        right: 20,
                                        child: IconButton(
                                          icon: const Icon(Icons.close,
                                              color: Colors.white, size: 30),
                                          onPressed: () =>
                                              Navigator.pop(context),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                photos[index],
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    Container(
                                  color: Colors.grey[900],
                                  child: const Icon(Icons.error_outline,
                                      color: Colors.red),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 48),
                      Text(
                        'Actions',
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          _buildActionButton(context, 'Approve', Colors.green,
                              () async {
                            await _updateStatus(
                                rootContext, loc['id'], 'verified',
                                isRunByPayparq: isRunByPayparq);
                            if (dialogContext.mounted) {
                              Navigator.pop(dialogContext);
                            }
                          }),
                          _buildActionButton(
                              context, 'Contact Required', Colors.blue,
                              () async {
                            await _updateStatus(
                                rootContext, loc['id'], 'contact_required');
                            if (dialogContext.mounted) {
                              Navigator.pop(dialogContext);
                            }
                          }),
                          _buildActionButton(context, 'Reject', Colors.red,
                              () async {
                            await _updateStatus(
                                rootContext, loc['id'], 'rejected');
                            if (dialogContext.mounted) {
                              Navigator.pop(dialogContext);
                            }
                          }),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton(
      BuildContext context, String label, Color color, VoidCallback onPressed) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.1),
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: 0.5)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(fontWeight: FontWeight.bold),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingVerifications = ref.watch(pendingVerificationsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              // Fallback for web if no history
              Navigator.pushReplacementNamed(context, '/');
            }
          },
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Verification Inbox',
              style: GoogleFonts.inter(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: Colors.black,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Super Admin: Review pending lot verifications',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 48),
            Expanded(
              child: pendingVerifications.when(
                loading: () => const Center(
                    child: CircularProgressIndicator(color: Colors.black)),
                error: (err, stack) => Center(child: Text('Error: $err')),
                data: (locations) {
                  if (locations.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inbox_outlined,
                              size: 64, color: Colors.grey[300]),
                          const SizedBox(height: 16),
                          Text(
                            'No pending verifications.',
                            style: TextStyle(color: Colors.grey[400]),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    itemCount: locations.length,
                    itemBuilder: (context, index) {
                      final loc = locations[index];
                      final name = loc['name'] ?? 'Unnamed Lot';
                      final displayId = loc['display_id'] ?? 'N/A';
                      final submittedAt =
                          loc['verification_submitted_at'] != null
                              ? DateTime.parse(loc['verification_submitted_at'])
                              : null;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: Colors.black,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                displayId.toUpperCase(),
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 24),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Submitted: ${submittedAt != null ? DateFormat('MMM dd, yyyy HH:mm').format(submittedAt) : 'N/A'}',
                                    style: TextStyle(
                                        color: Colors.grey[600], fontSize: 14),
                                  ),
                                ],
                              ),
                            ),
                            ElevatedButton(
                              onPressed: () =>
                                  _showVerificationDetail(context, loc),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 24, vertical: 16),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('Review'),
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
}
