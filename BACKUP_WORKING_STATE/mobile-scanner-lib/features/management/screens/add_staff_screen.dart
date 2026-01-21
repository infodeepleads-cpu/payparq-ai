import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../repositories/parking_repository.dart';

class AddStaffScreen extends ConsumerStatefulWidget {
  const AddStaffScreen({super.key});

  @override
  ConsumerState<AddStaffScreen> createState() => _AddStaffScreenState();
}

class _AddStaffScreenState extends ConsumerState<AddStaffScreen> {
  late Future<List<Map<String, dynamic>>> _staffFuture;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _refreshList();
  }

  void _refreshList() {
    setState(() {
      _staffFuture = Future(() async {
        final response = await Supabase.instance.client
            .from('app_users')
            .select()
            .order('created_at', ascending: false);
        return List<Map<String, dynamic>>.from(response);
      });
    });
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
            // --- HEADER ---
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Admins & Officers',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Manage your team and access levels.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () => _showAddStaffDialog(context),
                  icon: const Icon(Icons.person_add_alt_1, size: 18),
                  label: const Text('Add Staff'),
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

            // --- SEARCH BAR ---
            TextField(
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.trim().toLowerCase();
                });
              },
              decoration: InputDecoration(
                hintText: 'Search by name or email...',
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppTheme.primary, width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // --- STAFF LIST ---
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: FutureBuilder<List<Map<String, dynamic>>>(
                  future: _staffFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    if (snapshot.hasError) {
                      return Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.error_outline, color: Colors.red, size: 48),
                            const SizedBox(height: 16),
                            Text('Error loading staff: ${snapshot.error}'),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _refreshList,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      );
                    }

                    final allStaff = snapshot.data ?? [];
                    final filteredStaff = allStaff.where((user) {
                      final name = (user['name'] ?? '').toString().toLowerCase();
                      final email = (user['email'] ?? '').toString().toLowerCase();
                      return name.contains(_searchQuery) || email.contains(_searchQuery);
                    }).toList();

                    if (filteredStaff.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.people_outline, size: 48, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            Text(
                              _searchQuery.isEmpty 
                                  ? 'No staff members found.' 
                                  : 'No matches for "$_searchQuery"',
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      );
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.all(0),
                      itemCount: filteredStaff.length,
                      separatorBuilder: (context, index) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final user = filteredStaff[index];
                        final isOfficer = (user['role'] == 'officer');
                        final id = user['id'].toString();
                        
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          leading: CircleAvatar(
                            radius: 24,
                            backgroundColor: isOfficer ? Colors.blue[50] : Colors.purple[50],
                            child: Icon(
                              isOfficer ? Icons.local_police : Icons.admin_panel_settings,
                              color: isOfficer ? Colors.blue : Colors.purple,
                              size: 24,
                            ),
                          ),
                          title: Text(
                            user['name'] ?? 'Unknown Name',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w600, 
                              fontSize: 16,
                              color: Colors.black87
                            ),
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              user['email'] ?? 'No Email',
                              style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 14),
                            ),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isOfficer ? Colors.blue[50] : Colors.purple[50],
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isOfficer ? Colors.blue.withOpacity(0.3) : Colors.purple.withOpacity(0.3)
                                  ),
                                ),
                                child: Text(
                                  (user['role'] ?? 'staff').toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isOfficer ? Colors.blue[800] : Colors.purple[800],
                                    letterSpacing: 0.5,
                                  ),
                                ),
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
        title: const Text('Delete Staff Member'),
        content: const Text('Are you sure you want to delete this staff member?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              await ref.read(parkingRepositoryProvider).deleteStaff(id);
              if (mounted) {
                Navigator.pop(context);
                _refreshList();
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  // --- ADD STAFF DIALOG ---
  void _showAddStaffDialog(BuildContext parentContext) {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    
    // Default values
    String role = 'officer';
    String? selectedLocationId;
    
    final formKey = GlobalKey<FormState>();
    bool isProcessing = false;

    showDialog(
      context: parentContext,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Add New Staff Member'),
          content: SizedBox(
            width: 400,
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Full Name',
                      prefixIcon: Icon(Icons.person_outline),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'Name is required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: emailCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Email Address',
                      prefixIcon: Icon(Icons.email_outlined),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'Email is required' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: role,
                    decoration: const InputDecoration(
                      labelText: 'Role',
                      prefixIcon: Icon(Icons.shield_outlined),
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'admin', child: Text('Admin (Full Access)')),
                      DropdownMenuItem(value: 'officer', child: Text('Officer (Enforcement Only)')),
                    ],
                    onChanged: (v) => setDialogState(() => role = v!),
                  ),
                  const SizedBox(height: 16),
                  // Fetch locations for assignment
                  FutureBuilder<List<Map<String, dynamic>>>(
                    future: Supabase.instance.client.from('locations').select(),
                    builder: (context, snapshot) {
                      // While loading locations, show a disabled dropdown or loader
                      if (!snapshot.hasData) {
                        return const LinearProgressIndicator(minHeight: 2);
                      }
                      
                      final locations = snapshot.data!;
                      return DropdownButtonFormField<String>(
                        value: selectedLocationId,
                        decoration: const InputDecoration(
                          labelText: 'Assigned Location',
                          prefixIcon: Icon(Icons.location_on_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('All Locations (Global)')),
                          ...locations.map((loc) => DropdownMenuItem(
                                value: loc['id'] as String,
                                child: Text(loc['name'] ?? 'Unnamed'),
                              ))
                        ],
                        onChanged: (v) => setDialogState(() => selectedLocationId = v),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
              ),
              onPressed: isProcessing ? null : () async {
                if (formKey.currentState!.validate()) {
                  setDialogState(() => isProcessing = true);
                  
                  try {
                    // Insert into Supabase
                    await Supabase.instance.client.from('app_users').insert({
                      'name': nameCtrl.text.trim(),
                      'email': emailCtrl.text.trim(),
                      'role': role,
                      'assigned_location_id': selectedLocationId,
                      'status': 'active',
                    });

                    // On success:
                    if (context.mounted) {
                      Navigator.pop(context); // Close dialog
                      
                      // Show success message
                      ScaffoldMessenger.of(parentContext).showSnackBar(
                        const SnackBar(
                          content: Text('Staff member added successfully'),
                          backgroundColor: Colors.green,
                        ),
                      );
                      
                      // Refresh the list in the parent widget
                      _refreshList();
                    }
                  } catch (e) {
                    // On error:
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Error adding staff: $e'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  } finally {
                    // Reset processing state
                    if (context.mounted) {
                      setDialogState(() => isProcessing = false);
                    }
                  }
                }
              },
              child: isProcessing 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Create Account'),
            ),
          ],
        ),
      ),
    );
  }
}
