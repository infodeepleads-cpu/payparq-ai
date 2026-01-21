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
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final staffAsync = ref.watch(staffStreamProvider);
    final selectedLocId = ref.watch(selectedLocationIdProvider);

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
        final role = profile?['role'];
        final isSuperAdmin = role == 'super_admin';
        final isAdmin = role == 'admin';
        final isManager = role == 'manager';

        return Scaffold(
          backgroundColor: AppTheme.background,
          body: Padding(
            padding: const EdgeInsets.all(48.0),
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
                          'Staff Accounts',
                          style: GoogleFonts.inter(
                            fontSize: 40,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                            letterSpacing: -1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isSuperAdmin
                              ? 'Super Admin Mode: Full access to all team members.'
                              : 'Manage your team, managers, and officers.',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    if (isAdmin || isSuperAdmin || isManager)
                      ElevatedButton.icon(
                        onPressed: () => _showAddStaffDialog(context),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Add Staff'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4)),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 48),

                // --- SEARCH BAR ---
                SizedBox(
                  width: 400,
                  child: TextField(
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val.trim().toLowerCase();
                      });
                    },
                    decoration: InputDecoration(
                      hintText: 'Search',
                      prefixIcon: const Icon(Icons.search, size: 20),
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
                ),
                const SizedBox(height: 48),

                // --- STAFF LIST ---
                Expanded(
                  child: staffAsync.when(
                    loading: () => const Center(
                        child: CircularProgressIndicator(color: Colors.black)),
                    error: (err, stack) => Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.error_outline,
                              color: Colors.red, size: 48),
                          const SizedBox(height: 16),
                          Text('Error loading staff: $err'),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () =>
                                ref.invalidate(staffStreamProvider),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                    data: (allStaff) {
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
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.people_outline,
                                  size: 64, color: Colors.grey[200]),
                              const SizedBox(height: 16),
                              Text('No staff members found.',
                                  style: TextStyle(color: Colors.grey[400])),
                            ],
                          ),
                        );
                      }

                      return ListView.builder(
                        padding: const EdgeInsets.all(0),
                        itemCount: filteredStaff.length,
                        itemBuilder: (context, index) {
                          final user = filteredStaff[index];
                          final isOfficer = (user['role'] == 'officer');
                          final id = user['id'].toString();

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
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: Colors.black,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Icon(
                                    isOfficer
                                        ? Icons.local_police
                                        : Icons.admin_panel_settings,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 24),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        user['name'] ?? 'Unknown Name',
                                        style: GoogleFonts.inter(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                            color: Colors.black),
                                      ),
                                      Text(
                                        user['email'] ?? 'No Email',
                                        style: GoogleFonts.inter(
                                            color: AppTheme.textSecondary,
                                            fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                                _buildStatusBadge(
                                    (user['role'] ?? 'staff').toUpperCase()),
                                const SizedBox(width: 24),
                                ElevatedButton(
                                  onPressed: () => _showCredentialsDialog(
                                      user['email'] ?? '',
                                      user['raw_password'] ??
                                          'Already Changed'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.black,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 24, vertical: 12),
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(4)),
                                  ),
                                  child: const Text('Credentials'),
                                ),
                                const SizedBox(width: 12),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline,
                                      color: Colors.black),
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
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String role) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Text(
        role,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
      ),
    );
  }

  void _showCredentialsDialog(String email, String password) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Staff Credentials'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('These credentials can be used to log in immediately.'),
            const SizedBox(height: 16),
            _buildCredentialBox('Email Address', email),
            const SizedBox(height: 12),
            _buildCredentialBox('Generated Password', password),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  try {
                    final response =
                        await Supabase.instance.client.functions.invoke(
                      'create-officer',
                      body: {
                        'email': email,
                        'action': 'send_email',
                      },
                    );

                    if (response.status == 200) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Notification email sent to user.'),
                        ),
                      );
                    } else {
                      throw Exception(response.data['error'] ?? 'Email failed');
                    }
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error: $e'),
                      ),
                    );
                  }
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.email_outlined),
                label: const Text('Notify User via Email'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[700],
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildCredentialBox(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600])),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Row(
            children: [
              Expanded(
                child: SelectableText(
                  value,
                  style: GoogleFonts.robotoMono(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[900],
                  ),
                ),
              ),
              const Icon(Icons.copy_all, size: 18, color: Colors.grey),
            ],
          ),
        ),
      ],
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
                ref.invalidate(staffStreamProvider);
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  // --- ADD STAFF DIALOG ---
  void _showAddStaffDialog(BuildContext parentContext) async {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();

    final profile = ref.read(userProfileProvider).value;
    final isSuperAdmin = profile?['role'] == 'super_admin';

    final isManagerCreator = profile?['role'] == 'manager';

    // Fetch locations owned or assigned to this user
    final locations = await ref.read(availableLocationsProvider.future);

    // Default values
    String selectedRole = 'officer';
    List<String> selectedLocationIds = [];

    final formKey = GlobalKey<FormState>();
    bool isProcessing = false;

    if (parentContext.mounted) {
      showDialog(
        context: parentContext,
        builder: (dialogContext) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Add Staff Member'),
            content: SizedBox(
              width: 450,
              child: Form(
                key: formKey,
                child: SingleChildScrollView(
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
                        validator: (v) {
                          if (v == null || v.isEmpty)
                            return 'Email is required';
                          final emailRegex =
                              RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
                          if (!emailRegex.hasMatch(v))
                            return 'Enter a valid email address';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: selectedRole,
                        decoration: const InputDecoration(
                          labelText: 'Role',
                          prefixIcon: Icon(Icons.shield_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          if (isSuperAdmin)
                            const DropdownMenuItem(
                                value: 'admin',
                                child: Text('Admin (Full Access)')),
                          if (!isManagerCreator)
                            const DropdownMenuItem(
                                value: 'manager',
                                child: Text('Manager (Full Access)')),
                          const DropdownMenuItem(
                              value: 'officer',
                              child: Text('Officer (Enforcement Only)')),
                        ],
                        onChanged: (v) =>
                            setDialogState(() => selectedRole = v!),
                      ),
                      if (selectedRole == 'officer' ||
                          selectedRole == 'manager') ...[
                        const SizedBox(height: 20),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Assign Locations:',
                            style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          constraints: const BoxConstraints(maxHeight: 200),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey[300]!),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: ListView.builder(
                            shrinkWrap: true,
                            itemCount: locations.length,
                            itemBuilder: (context, index) {
                              final loc = locations[index];
                              final locId = loc['display_id'] as String;
                              final isSelected =
                                  selectedLocationIds.contains(locId);

                              return CheckboxListTile(
                                title: Text(loc['name'] ?? 'Lot $locId'),
                                subtitle: Text('ID: $locId'),
                                value: isSelected,
                                onChanged: (val) {
                                  setDialogState(() {
                                    if (val == true) {
                                      selectedLocationIds.add(locId);
                                    } else {
                                      selectedLocationIds.remove(locId);
                                    }
                                  });
                                },
                              );
                            },
                          ),
                        ),
                      ],
                    ],
                  ),
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
                          if (selectedLocationIds.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                    'Please select at least one location.'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                            return;
                          }

                          setDialogState(() => isProcessing = true);

                          try {
                            // 1. Call the Edge Function to create the user
                            final response =
                                await Supabase.instance.client.functions.invoke(
                              'create-officer',
                              body: {
                                'email': emailCtrl.text.trim(),
                                'name': nameCtrl.text.trim(),
                                'role': selectedRole,
                                'location_id': selectedLocationIds.first,
                              },
                            );

                            if (response.status != 200) {
                              final errorMsg = response.data is Map
                                  ? (response.data['error'] ?? 'Server Error')
                                  : 'Staff creation failed.';
                              throw Exception(errorMsg);
                            }

                            final newStaffId = response.data['user']['id'];

                            // 2. Create ADDITIONAL multi-location assignments if needed
                            // (The Edge Function already handles the first one)
                            if (selectedLocationIds.length > 1) {
                              final extraAssignments = selectedLocationIds
                                  .skip(1)
                                  .map((lid) => {
                                        'officer_id': newStaffId,
                                        'location_id': lid,
                                        'assigned_by': Supabase.instance.client
                                            .auth.currentUser?.id,
                                      })
                                  .toList();

                              await Supabase.instance.client
                                  .from('officer_assignments')
                                  .insert(extraAssignments);
                            }

                            // On success:
                            if (context.mounted) {
                              Navigator.pop(context); // Close dialog

                              // Give the Supabase trigger and RLS a moment to settle
                              Future.delayed(const Duration(milliseconds: 1500),
                                  () {
                                if (mounted) {
                                  ref.invalidate(staffStreamProvider);
                                  // Also force a refresh of the user profile just in case
                                  ref.invalidate(userProfileProvider);
                                }
                              });

                              // Show success message
                              showDialog(
                                context: parentContext,
                                builder: (context) => AlertDialog(
                                  title: const Text('Account Created!'),
                                  content: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                          'The staff account is now active and ready for use.'),
                                      const SizedBox(height: 16),
                                      const Text(
                                          'You can view and manage their credentials directly from the staff list.',
                                          style: TextStyle(
                                              fontSize: 13,
                                              color: Colors.grey)),
                                    ],
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Great'),
                                    ),
                                  ],
                                ),
                              );
                            }
                          } catch (e) {
                            // On error:
                            if (context.mounted) {
                              String displayError = e.toString();
                              // Clean up common Supabase function error formats
                              if (displayError.contains('Invalid format')) {
                                displayError =
                                    'The email address format is invalid.';
                              } else if (displayError
                                  .contains('already in use')) {
                                displayError =
                                    'This email is already registered.';
                              } else if (displayError
                                  .contains('FunctionException')) {
                                // Try to extract the details message if it's a map
                                try {
                                  final details = (e as dynamic).details;
                                  if (details is Map &&
                                      details.containsKey('error')) {
                                    displayError = details['error'];
                                  }
                                } catch (_) {}
                              }

                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Error: $displayError'),
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
}
