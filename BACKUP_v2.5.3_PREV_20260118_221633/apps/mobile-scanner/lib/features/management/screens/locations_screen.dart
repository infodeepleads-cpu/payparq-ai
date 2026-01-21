import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../repositories/parking_repository.dart';

import '../../../logic/providers/auth_providers.dart';

class LocationsScreen extends ConsumerStatefulWidget {
  const LocationsScreen({super.key});

  @override
  ConsumerState<LocationsScreen> createState() => _LocationsScreenState();
}

class _LocationsScreenState extends ConsumerState<LocationsScreen> {
  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final locationsAsync = ref.watch(locationsStreamProvider);

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
              Text('Failed to load profile: $err'),
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
        final locationId = profile?['location_id'];
        final role = profile?['role'];
        final isSuperAdmin = role == 'super_admin';
        final isAdmin = role == 'admin';

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
                          'Locations & Lots',
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
                              ? 'Super Admin Mode: Viewing all locations'
                              : 'Managing access for Location ID: $locationId',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    if (isAdmin || isSuperAdmin)
                      ElevatedButton.icon(
                        onPressed: () =>
                            _showAddLocationDialog(context, locationId),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Add Lot'),
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

                // List
                Expanded(
                  child: locationsAsync.when(
                    loading: () => const Center(
                        child: CircularProgressIndicator(color: Colors.black)),
                    error: (err, stack) => Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.warning_amber_rounded,
                              color: Colors.orange, size: 48),
                          const SizedBox(height: 16),
                          Text('Database access restricted or error occurred.'),
                          const SizedBox(height: 8),
                          Text(err.toString(),
                              style: const TextStyle(
                                  fontSize: 10, color: Colors.grey),
                              textAlign: TextAlign.center),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () =>
                                ref.refresh(locationsStreamProvider),
                            child: const Text('Refresh Data'),
                          ),
                        ],
                      ),
                    ),
                    data: (locations) {
                      if (locations.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.location_on_outlined,
                                  size: 64, color: Colors.grey[200]),
                              const SizedBox(height: 16),
                              Text('No locations found.',
                                  style: TextStyle(color: Colors.grey[400])),
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
                          final id = loc['id'].toString();

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
                                    displayId.toUpperCase(),
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
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        name,
                                        style: GoogleFonts.inter(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                            color: Colors.black),
                                      ),
                                      Text(
                                        'Active Parking Hub',
                                        style: GoogleFonts.inter(
                                            color: AppTheme.textSecondary,
                                            fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                                _buildStatusBadge('ACTIVE'),
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
                                  child: const Text('Manage'),
                                ),
                                const SizedBox(width: 12),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline,
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
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
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
            decoration: const BoxDecoration(
              color: Colors.green,
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

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Location'),
        content: const Text('Are you sure you want to delete this location?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              await ref.read(parkingRepositoryProvider).deleteLocation(id);
              if (mounted) Navigator.pop(context);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showAddLocationDialog(BuildContext context, String? locationId) {
    final nameCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    final capacityCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool isProcessing = false;
    List<String> addressSuggestions = [];

    showDialog(
      context: context,
      barrierDismissible: false, // Prevent closing during processing
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Add New Location'),
          content: SizedBox(
            width: 400,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue[100]!),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline,
                              color: Colors.blue, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'A unique 5-digit ID will be automatically generated for this location.',
                              style: GoogleFonts.inter(
                                  fontSize: 12, color: Colors.blue[800]),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(
                          labelText: 'Location Name',
                          hintText: 'e.g. Downtown Garage',
                          border: OutlineInputBorder()),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: addressCtrl,
                      decoration: const InputDecoration(
                          labelText: 'Street Address',
                          hintText: 'Start typing an address...',
                          prefixIcon: Icon(Icons.map_outlined),
                          border: OutlineInputBorder()),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                      onChanged: (val) {
                        // EU/Croatia Focused Address Suggestions
                        if (val.length > 2) {
                          setDialogState(() {
                            addressSuggestions = [
                              '$val, Zagreb, Croatia',
                              '$val, Split, Croatia',
                              '$val, Rijeka, Croatia',
                              '$val, Osijek, Croatia',
                              '$val, Berlin, Germany',
                              '$val, Vienna, Austria',
                            ];
                          });
                        } else {
                          setDialogState(() => addressSuggestions = []);
                        }
                      },
                    ),
                    if (addressSuggestions.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          children: addressSuggestions
                              .map((addr) => ListTile(
                                    title: Text(addr,
                                        style: const TextStyle(fontSize: 13)),
                                    onTap: () {
                                      addressCtrl.text = addr;
                                      setDialogState(
                                          () => addressSuggestions = []);
                                    },
                                    dense: true,
                                  ))
                              .toList(),
                        ),
                      ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: capacityCtrl,
                      decoration: const InputDecoration(
                          labelText: 'Capacity (Spaces)',
                          border: OutlineInputBorder()),
                      keyboardType: TextInputType.number,
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
                onPressed: isProcessing ? null : () => Navigator.pop(context),
                child: const Text('Cancel')),
            ElevatedButton(
              onPressed: isProcessing
                  ? null
                  : () async {
                      if (formKey.currentState!.validate()) {
                        setDialogState(() => isProcessing = true);
                        try {
                          final user =
                              Supabase.instance.client.auth.currentUser;

                          // 1. Simulate Geocoding
                          final mockLat =
                              34.0522 + (DateTime.now().millisecond / 10000.0);
                          final mockLng = -118.2437 +
                              (DateTime.now().microsecond / 100000.0);

                          // 2. Insert Location (display_id auto-generated by trigger)
                          final response = await Supabase.instance.client
                              .from('locations')
                              .insert({
                                'name': nameCtrl.text,
                                'address': addressCtrl.text,
                                'latitude': mockLat,
                                'longitude': mockLng,
                                'capacity':
                                    int.tryParse(capacityCtrl.text) ?? 0,
                                'owner_id': user?.id,
                              })
                              .select()
                              .maybeSingle();

                          if (response == null) {
                            throw Exception(
                                'Failed to create location record. Please check your permissions and try again.');
                          }

                          final newDisplayId = response['display_id'];

                          // 3. Automatically select the new location for the Admin
                          // This ensures the top bar and other screens update instantly
                          ref.read(selectedLocationIdProvider.notifier).state =
                              newDisplayId;

                          // 4. Invalidate the locations stream to force a fresh fetch
                          ref.invalidate(locationsStreamProvider);
                          ref.invalidate(availableLocationsProvider);

                          // 5. Optional Email
                          try {
                            await Supabase.instance.client.functions.invoke(
                              'welcome-email',
                              body: {
                                'type': 'new_location',
                                'email': user?.email,
                                'data': {
                                  'location_name': nameCtrl.text,
                                  'location_id': newDisplayId,
                                }
                              },
                            );
                          } catch (emailErr) {
                            debugPrint(
                                'Email failed (non-critical): $emailErr');
                          }

                          if (context.mounted) {
                            Navigator.pop(context); // Close dialog
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content:
                                    Text('Location Created! ID: $newDisplayId'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          }
                        } catch (e) {
                          debugPrint('Error inserting location: $e');
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Error: ${e.toString()}'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        } finally {
                          // No need to set isProcessing = false if we pop,
                          // but good for safety if we don't pop.
                          if (context.mounted && !isProcessing) {
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
                  : const Text('Register Lot'),
            ),
          ],
        ),
      ),
    );
  }
}
