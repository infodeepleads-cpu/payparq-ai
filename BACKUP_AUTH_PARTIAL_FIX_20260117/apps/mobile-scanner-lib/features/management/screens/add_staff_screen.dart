import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../repositories/parking_repository.dart';
import '../../../logic/providers/auth_providers.dart';

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
        final profile = ref.read(userProfileProvider).value;
        if (profile == null) return [];

        final isSuperAdmin = profile['role'] == 'super_admin';

        var query = Supabase.instance.client.from('profiles').select();

        // If not super admin, only show staff from the same location
        if (!isSuperAdmin) {
          query = query.eq('location_id', profile['location_id']);
        }

        final response = await query.order('created_at', ascending: false);
        return List<Map<String, dynamic>>.from(response);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);

    return profileAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (err, stack) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text('Failed to load access profile: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(userProfileProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (profile) {
        final isSuperAdmin = profile?['role'] == 'super_admin';
        final isAdmin = profile?['role'] == 'admin';

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
                          isSuperAdmin
                              ? 'All Staff Accounts'
                              : 'Admins & Officers',
                          style: GoogleFonts.inter(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isSuperAdmin
                              ? 'Super Admin Mode: Full access to all team members.'
                              : 'Manage your team and access levels.',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    if (isAdmin || isSuperAdmin)
                      ElevatedButton.icon(
                        onPressed: () => _showAddStaffDialog(context),
                        icon: const Icon(Icons.person_add_alt_1, size: 18),
                        label: const Text('Add Staff'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
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
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
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
                      borderSide:
                          BorderSide(color: AppTheme.primary, width: 1.5),
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
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const Center(
                              child: CircularProgressIndicator());
                        }

                        if (snapshot.hasError) {
                          return Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.error_outline,
                                    color: Colors.red, size: 48),
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
                          final name =
                              (user['name'] ?? '').toString().toLowerCase();
                          final email =
                              (user['email'] ?? '').toString().toLowerCase();
                          return name.contains(_searchQuery) ||
                              email.contains(_searchQuery);
                        }).toList();

                        if (filteredStaff.isEmpty) {
                          return Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.people_outline,
                                    size: 48, color: Colors.grey[400]),
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
                          separatorBuilder: (context, index) =>
                              const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final user = filteredStaff[index];
                            final isOfficer = (user['role'] == 'officer');
                            final id = user['id'].toString();

                            return ListTile(
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 24, vertical: 16),
                              leading: CircleAvatar(
                                radius: 24,
                                backgroundColor: isOfficer
                                    ? Colors.blue[50]
                                    : Colors.purple[50],
                                child: Icon(
                                  isOfficer
                                      ? Icons.local_police
                                      : Icons.admin_panel_settings,
                                  color:
                                      isOfficer ? Colors.blue : Colors.purple,
                                  size: 24,
                                ),
                              ),
                              title: Text(
                                user['name'] ?? 'Unknown Name',
                                style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                    color: Colors.black87),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4.0),
                                child: Text(
                                  user['email'] ?? 'No Email',
                                  style: GoogleFonts.inter(
                                      color: Colors.grey[500], fontSize: 14),
                                ),
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: isOfficer
                                          ? Colors.blue[50]
                                          : Colors.purple[50],
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                          color: isOfficer
                                              ? Colors.blue.withOpacity(0.3)
                                              : Colors.purple.withOpacity(0.3)),
                                    ),
                                    child: Text(
                                      (user['role'] ?? 'staff').toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: isOfficer
                                            ? Colors.blue[800]
                                            : Colors.purple[800],
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(Icons.delete,
                                        color: Colors.red),
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
      },
    );
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Staff Member'),
        content:
            const Text('Are you sure you want to delete this staff member?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
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
    final passwordCtrl = TextEditingController();

    // Default values
    String role = 'officer';

    final formKey = GlobalKey<FormState>();
    bool isProcessing = false;

    showDialog(
      context: parentContext,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Name is required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: emailCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Email Address',
                      prefixIcon: Icon(Icons.email_outlined),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Email is required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: passwordCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Temporary Password',
                      prefixIcon: Icon(Icons.lock_outline),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v == null || v.length < 6
                        ? 'Password must be at least 6 chars'
                        : null,
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
                      DropdownMenuItem(
                          value: 'admin', child: Text('Admin (Full Access)')),
                      DropdownMenuItem(
                          value: 'officer',
                          child: Text('Officer (Enforcement Only)')),
                    ],
                    onChanged: (v) => setDialogState(() => role = v!),
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
              onPressed: isProcessing
                  ? null
                  : () async {
                      if (formKey.currentState!.validate()) {
                        setDialogState(() => isProcessing = true);

                        try {
                          // Call the Edge Function to create the user
                          final response =
                              await Supabase.instance.client.functions.invoke(
                            'create-officer',
                            body: {
                              'email': emailCtrl.text.trim(),
                              'password': passwordCtrl.text.trim(),
                              'name': nameCtrl.text.trim(),
                              'role': role,
                            },
                          );

                          if (response.status != 200) {
                            throw Exception(response.data['error'] ??
                                'Failed to create staff');
                          }

                          // On success:
                          if (context.mounted) {
                            Navigator.pop(context); // Close dialog

                            // Show success message
                            ScaffoldMessenger.of(parentContext).showSnackBar(
                              const SnackBar(
                                content: Text(
                                    'Staff member added successfully. Share the password with them!'),
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
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('Create Account'),
            ),
          ],
        ),
      ),
    );
  }
}
