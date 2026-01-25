import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../theme.dart';

class AddStaffScreen extends StatefulWidget {
  const AddStaffScreen({super.key});

  @override
  State<AddStaffScreen> createState() => _AddStaffScreenState();
}

class _AddStaffScreenState extends State<AddStaffScreen> {
  // Use Future for now to avoid Realtime issues
  final _staffFuture = Supabase.instance.client
      .from('app_users')
      .select()
      .order('created_at', ascending: false);

  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
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

            // Search Bar
            TextField(
              onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
              decoration: InputDecoration(
                hintText: 'Search by name or email...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
              ),
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
                  stream: _staffStream,
                  builder: (context, snapshot) {
                    if (snapshot.hasError) {
                      return Center(child: Text('Error: ${snapshot.error}'));
                    }
                    if (!snapshot.hasData) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    final allStaff = snapshot.data!;
                    final staff = allStaff.where((user) {
                      final name = (user['name'] ?? '').toString().toLowerCase();
                      final email = (user['email'] ?? '').toString().toLowerCase();
                      return name.contains(_searchQuery) || email.contains(_searchQuery);
                    }).toList();

                    if (staff.isEmpty) {
                      return Center(
                        child: Text(_searchQuery.isEmpty 
                          ? 'No staff members found.' 
                          : 'No matches for "$_searchQuery"'),
                      );
                    }

                    return ListView.separated(
                      itemCount: staff.length,
                      separatorBuilder: (context, index) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final user = staff[index];
                        final isOfficer = user['role'] == 'officer';
                        
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          leading: CircleAvatar(
                            backgroundColor: isOfficer ? Colors.blue[50] : Colors.purple[50],
                            child: Icon(
                              isOfficer ? Icons.local_police : Icons.admin_panel_settings,
                              color: isOfficer ? Colors.blue : Colors.purple,
                            ),
                          ),
                          title: Text(
                            user['name'] ?? 'Unknown Name',
                            style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16),
                          ),
                          subtitle: Text(
                            user['email'] ?? 'No Email',
                            style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 13),
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isOfficer ? Colors.blue[100] : Colors.purple[100],
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              (user['role'] ?? 'staff').toUpperCase(),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isOfficer ? Colors.blue[800] : Colors.purple[800],
                              ),
                            ),
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

  void _showAddStaffDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    String role = 'officer';
    String? selectedLocationId;
    final formKey = GlobalKey<FormState>();
    bool isProcessing = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
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
                    decoration: const InputDecoration(labelText: 'Full Name'),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: emailCtrl,
                    decoration: const InputDecoration(labelText: 'Email Address'),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: role,
                    decoration: const InputDecoration(labelText: 'Role'),
                    items: const [
                      DropdownMenuItem(value: 'admin', child: Text('Admin (Full Access)')),
                      DropdownMenuItem(value: 'officer', child: Text('Officer (Enforcement Only)')),
                    ],
                    onChanged: (v) => setDialogState(() => role = v!),
                  ),
                  const SizedBox(height: 12),
                  FutureBuilder<List<Map<String, dynamic>>>(
                    future: Supabase.instance.client.from('locations').select(),
                    builder: (context, snapshot) {
                      if (!snapshot.hasData) return const LinearProgressIndicator();
                      final locations = snapshot.data!;
                      return DropdownButtonFormField<String>(
                        initialValue: selectedLocationId,
                        decoration: const InputDecoration(labelText: 'Assigned Location'),
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
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: isProcessing ? null : () async {
                if (formKey.currentState!.validate()) {
                  setDialogState(() => isProcessing = true);
                  try {
                    await Supabase.instance.client.from('app_users').insert({
                      'name': nameCtrl.text,
                      'email': emailCtrl.text,
                      'role': role,
                      'assigned_location_id': selectedLocationId,
                      'status': 'active',
                    });
                    if (context.mounted) {
                      Navigator.pop(context);
                      // Force refresh the list after adding
                      setState(() {});
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                      );
                    }
                  } finally {
                    setDialogState(() => isProcessing = false);
                  }
                }
              },
              child: isProcessing 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }
}
