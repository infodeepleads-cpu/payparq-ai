import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../repositories/parking_repository.dart';
import 'add_pass_screen.dart';
import 'pass_detail_screen.dart';

class PassesListScreen extends ConsumerStatefulWidget {
  const PassesListScreen({super.key});

  @override
  ConsumerState<PassesListScreen> createState() => _PassesListScreenState();
}

class _PassesListScreenState extends ConsumerState<PassesListScreen> {
  @override
  Widget build(BuildContext context) {
    final permitsAsync = ref.watch(permitsStreamProvider);

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      body: Padding(
        padding: const EdgeInsets.all(24.0),
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
                      'Guest Passes & Subscriptions',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Manage user access and permits.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const AddPassScreen()),
                    );
                  },
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add New'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
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
                child: permitsAsync.when(
                  data: (permits) {
                    if (permits.isEmpty) {
                      return const Center(child: Text('No permits found.'));
                    }

                    return ListView.separated(
                      itemCount: permits.length,
                      separatorBuilder: (context, index) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final permit = permits[index];
                        final type = permit['type'] ?? 'pass';
                        final plate = permit['plate'] ?? 'UNKNOWN';
                        final status = permit['status'] ?? 'active';
                        final id = permit['id'].toString();
                        
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          leading: CircleAvatar(
                            backgroundColor: type == 'subscription' ? Colors.purple[100] : Colors.blue[100],
                            child: Icon(
                              type == 'subscription' ? Icons.loop : Icons.confirmation_number_outlined,
                              color: type == 'subscription' ? Colors.purple : Colors.blue,
                              size: 20,
                            ),
                          ),
                          title: Text(
                            plate,
                            style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16),
                          ),
                          subtitle: Text(
                            type == 'subscription' ? 'Monthly Subscription' : 'Guest Pass',
                            style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 13),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _buildStatusBadge(status),
                              const SizedBox(width: 16),
                              OutlinedButton(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) => PassDetailScreen(permit: permit),
                                    ),
                                  );
                                },
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.grey),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('View', style: TextStyle(color: Colors.black)),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                 icon: const Icon(Icons.delete, color: Colors.red),
                                 onPressed: () => _confirmDelete(id),
                               ),
                            ],
                          ),
                        );
                      },
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, _) => Center(child: Text('Error: $err')),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Permit'),
        content: const Text('Are you sure you want to delete this permit? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              await ref.read(parkingRepositoryProvider).deletePermit(id);
              if (mounted) Navigator.pop(context);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = status == 'active' ? Colors.green : Colors.red;
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
