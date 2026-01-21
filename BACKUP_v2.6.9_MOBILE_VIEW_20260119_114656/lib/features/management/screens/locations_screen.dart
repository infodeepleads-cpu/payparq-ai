import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../../../widgets/pulsating_loading_screen.dart';
import '../repositories/parking_repository.dart';
import '../../../widgets/lot_location_picker.dart';
import 'package:latlong2/latlong.dart';

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
      loading: () => const PulsatingLoadingScreen(),
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
                                SizedBox(
                                  width: 160,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: Colors.black,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    alignment: Alignment.center,
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
                                const SizedBox(width: 48),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    FutureBuilder<int>(
                                      future: Future.wait([
                                        Supabase.instance.client
                                            .from('parking_sessions')
                                            .select('id')
                                            .eq('location_id', displayId)
                                            .eq('payment_status', 'paid')
                                            .then(
                                                (res) => (res as List).length),
                                        Supabase.instance.client
                                            .from('parking_permits')
                                            .select('id')
                                            .eq('location_id', displayId)
                                            .eq('status', 'active')
                                            .then(
                                                (res) => (res as List).length),
                                      ]).then(
                                          (results) => results[0] + results[1]),
                                      builder: (context, snapshot) {
                                        final activeCount = snapshot.data ?? 0;
                                        final total = loc['capacity'] ?? 0;
                                        final available = total - activeCount;

                                        return Text(
                                          '$available/$total',
                                          style: GoogleFonts.inter(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.black,
                                          ),
                                        );
                                      },
                                    ),
                                    Text(
                                      'CAPACITY',
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textSecondary,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 24),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline,
                                      color: Colors.black),
                                  onPressed: () =>
                                      _confirmDelete(id, displayId),
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
            decoration: BoxDecoration(
              color: Colors.green[400],
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

  void _confirmDelete(String id, String displayId) {
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
              // 1. If this is the currently selected lot, clear selection first
              if (ref.read(selectedLocationIdProvider) == displayId) {
                ref.read(selectedLocationIdProvider.notifier).state = null;
              }

              // 2. Perform deletion
              await ref.read(parkingRepositoryProvider).deleteLocation(id);

              // 3. Refresh lists
              ref.invalidate(availableLocationsProvider);

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
    final capacityCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool isProcessing = false;
    LatLng? selectedLatLng;
    String selectedAddress = '';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(
            'Register Professional Lot',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold),
          ),
          content: SizedBox(
            width: 500,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(
                          labelText: 'Location Name',
                          hintText: 'e.g. Downtown Garage',
                          border: OutlineInputBorder()),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 24),
                    LotLocationPicker(
                      onLocationSelected: (latLng, address) {
                        selectedLatLng = latLng;
                        selectedAddress = address;
                      },
                    ),
                    const SizedBox(height: 24),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Lot Capacity',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: capacityCtrl,
                          decoration: InputDecoration(
                            hintText: 'e.g. 150',
                            filled: true,
                            fillColor: AppTheme.surface,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide.none,
                            ),
                          ),
                          keyboardType: TextInputType.number,
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                      ],
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
                        if (selectedLatLng == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text(
                                    'Please select a location on the map')),
                          );
                          return;
                        }

                        setDialogState(() => isProcessing = true);
                        try {
                          final user =
                              Supabase.instance.client.auth.currentUser;

                          final response = await Supabase.instance.client
                              .from('locations')
                              .insert({
                                'name': nameCtrl.text,
                                'address': selectedAddress,
                                'latitude': selectedLatLng!.latitude,
                                'longitude': selectedLatLng!.longitude,
                                'capacity':
                                    int.tryParse(capacityCtrl.text) ?? 0,
                                'owner_id': user?.id,
                              })
                              .select()
                              .maybeSingle();

                          if (response == null) {
                            throw Exception(
                                'Failed to create location record.');
                          }

                          final newDisplayId = response['display_id'];
                          ref.read(selectedLocationIdProvider.notifier).state =
                              newDisplayId;
                          ref.invalidate(locationsStreamProvider);
                          ref.invalidate(availableLocationsProvider);

                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text('Location created!')),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error: ${e.toString()}')),
                            );
                          }
                        } finally {
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
                  : const Text('Register Lot'),
            ),
          ],
        ),
      ),
    );
  }
}
