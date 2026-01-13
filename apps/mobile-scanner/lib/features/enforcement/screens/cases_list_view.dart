import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../theme.dart';

class CasesListView extends StatefulWidget {
  const CasesListView({super.key});

  @override
  State<CasesListView> createState() => _CasesListViewState();
}

class _CasesListViewState extends State<CasesListView> {
  final _violationsStream = Supabase.instance.client
      .from('violations')
      .stream(primaryKey: ['id']).order('issued_at', ascending: false);
  final ImagePicker _picker = ImagePicker();
  bool _isProcessing = false;

  Future<void> _handleQuickAction({required bool isWarning}) async {
    // 1. Capture Photo
    final XFile? image = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (image == null) return;

    setState(() => _isProcessing = true);

    try {
      final supabase = Supabase.instance.client;
      // Use a placeholder plate for "Quick Actions" until LPR is integrated
      final plate = 'QUICK-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$plate.jpg';

      // 2. Upload Evidence
      final bytes = await image.readAsBytes();
      await supabase.storage.from('evidence').uploadBinary(
        fileName,
        bytes,
        fileOptions: const FileOptions(contentType: 'image/jpeg'),
      );

      // 3. Create Violation Record
      await supabase.from('violations').insert({
        'plate': plate,
        'violation_type': isWarning ? 'Quick Warning' : 'Quick Ticket',
        'fine_amount': isWarning ? 0.00 : 50.00,
        'status': isWarning ? 'warning' : 'issued',
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
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Quick Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cases Log',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Real-time enforcement actions and citations.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                // Quick Actions Buttons
                Row(
                  children: [
                    if (_isProcessing)
                      const Padding(
                        padding: EdgeInsets.only(right: 16.0),
                        child: SizedBox(
                          width: 20, 
                          height: 20, 
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ),
                    ElevatedButton.icon(
                      onPressed: _isProcessing ? null : () => _handleQuickAction(isWarning: true),
                      icon: const Icon(Icons.warning_amber_rounded, size: 18),
                      label: const Text('Quick Warning'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      onPressed: _isProcessing ? null : () => _handleQuickAction(isWarning: false),
                      icon: const Icon(Icons.receipt_long, size: 18),
                      label: const Text('Quick Ticket'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),

            // List
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: StreamBuilder<List<Map<String, dynamic>>>(
                  stream: _violationsStream,
                  builder: (context, snapshot) {
                    if (snapshot.hasError) {
                      return Center(child: Text('Error: ${snapshot.error}'));
                    }
                    if (!snapshot.hasData) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    final violations = snapshot.data!;
                    if (violations.isEmpty) {
                      return const Center(child: Text('No active cases found.'));
                    }

                    return ListView.separated(
                      itemCount: violations.length,
                      separatorBuilder: (context, index) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final violation = violations[index];
                        final status = violation['status'] ?? 'issued';
                        final issuedAt = DateTime.parse(violation['issued_at']);
                        
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          leading: CircleAvatar(
                            backgroundColor: _getStatusColor(status).withOpacity(0.1),
                            child: Icon(
                              _getStatusIcon(status),
                              color: _getStatusColor(status),
                              size: 20,
                            ),
                          ),
                          title: Row(
                            children: [
                              Text(
                                violation['plate'] ?? 'UNKNOWN',
                                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16),
                              ),
                              const SizedBox(width: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.grey[100],
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: Colors.grey[300]!),
                                ),
                                child: Text(
                                  violation['violation_type'] ?? 'General',
                                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w500),
                                ),
                              ),
                            ],
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              'Zone A • ${_formatDate(issuedAt)}',
                              style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 13),
                            ),
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '\$${violation['fine_amount'] ?? 0}',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 4),
                              _buildStatusBadge(status),
                            ],
                          ),
                          onTap: () {
                            // TODO: Open Case Detail
                          },
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return "${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}";
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid': return Colors.green;
      case 'voided': return Colors.grey;
      case 'warning': return Colors.orange;
      default: return Colors.red; // issued/pending
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'paid': return Icons.check_circle_outline;
      case 'voided': return Icons.block;
      case 'warning': return Icons.warning_amber;
      default: return Icons.gavel;
    }
  }

  Widget _buildStatusBadge(String status) {
    Color color = _getStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: GoogleFonts.inter(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 10,
        ),
      ),
    );
  }
}
