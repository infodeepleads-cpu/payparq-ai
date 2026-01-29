import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../../../widgets/pulsating_loading_screen.dart';
import '../repositories/parking_repository.dart';
import '../../../widgets/lot_location_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../logic/providers/auth_providers.dart';
import 'verification_upload_screen.dart';

class LocationsScreen extends ConsumerStatefulWidget {
  const LocationsScreen({super.key});

  @override
  ConsumerState<LocationsScreen> createState() => _LocationsScreenState();
}

class _LocationsScreenState extends ConsumerState<LocationsScreen> {
  static const String _supportWhatsappDisplay = '+385 91 5963139';
  static const String _supportWhatsappNumber = '385915963139';
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
                          const Text('Database access restricted or error occurred.'),
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
                                _buildVerificationBadge(loc, isAdmin),
                                const SizedBox(width: 12),
                                _buildStatusBadge('ACTIVE'),
                                const SizedBox(width: 24),
                                SizedBox(
                                  width: 120,
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      FutureBuilder<int>(
                                        future: Future.wait([
                                          Supabase.instance.client
                                              .from('parking_sessions')
                                              .select('id')
                                              .eq('location_id', id)
                                              .eq('payment_status', 'paid')
                                              .then((res) =>
                                                  (res as List).length),
                                          Supabase.instance.client
                                              .from('parking_permits')
                                              .select('id')
                                              .eq('location_id', id)
                                              .eq('status', 'active')
                                              .then((res) =>
                                                  (res as List).length),
                                        ]).then((results) =>
                                            results[0] + results[1]),
                                        builder: (context, snapshot) {
                                          final activeCount =
                                              snapshot.data ?? 0;
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

  Widget _buildVerificationBadge(Map<String, dynamic> loc, bool isAdmin) {
    final rawStatus = loc['verification_status'] ?? 'unverified';
    final status =
        rawStatus == 'video_required' ? 'contact_required' : rawStatus;

    Color badgeColor;
    String label;
    bool showAction = false;

    switch (status) {
      case 'verified':
        badgeColor = Colors.green;
        label = 'VERIFIED';
        break;
      case 'pending':
        badgeColor = Colors.orange;
        label = 'PENDING';
        break;
      case 'call_scheduled':
        badgeColor = Colors.blue;
        label = 'CONTACT REQUIRED';
        showAction = true;
        break;
      case 'contact_required':
        badgeColor = Colors.blue;
        label = 'CONTACT REQUIRED';
        showAction = true;
        break;
      case 'rejected':
        badgeColor = Colors.red;
        label = 'REJECTED';
        showAction = isAdmin;
        break;
      case 'unverified':
      default:
        badgeColor = Colors.deepOrange;
        label = 'UNVERIFIED';
        showAction = isAdmin;
    }

    return InkWell(
      onTap: showAction
          ? () {
              if (status == 'contact_required') {
                _showCallDialog(loc);
              } else if (status == 'unverified' ||
                  status == 'pending' ||
                  status == 'rejected') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        VerificationUploadScreen(location: loc),
                  ),
                );
              }
            }
          : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: badgeColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: badgeColor.withValues(alpha: 0.5)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              status == 'verified' ? Icons.verified : Icons.info_outline,
              size: 14,
              color: badgeColor,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: badgeColor,
              ),
            ),
            if (showAction) ...[
              const SizedBox(width: 8),
              const Icon(Icons.arrow_forward_ios, size: 10, color: Colors.grey),
            ],
          ],
        ),
      ),
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

  void _showCallDialog(Map<String, dynamic> loc) async {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Contact for verification'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.green[500],
                            borderRadius: BorderRadius.circular(16),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.chat,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'WhatsApp Support',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _supportWhatsappDisplay,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: Colors.grey[700],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Send message to support for verification.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green[500],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onPressed: () async {
                          final uri = Uri.parse(
                              'https://wa.me/$_supportWhatsappNumber?text=${Uri.encodeComponent('Hi, I need help with lot verification.')}');
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri,
                                mode: LaunchMode.externalApplication);
                          }
                        },
                        child: Text(
                          'Send message',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Close'),
            ),
          ],
        );
      },
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
                  crossAxisAlignment: CrossAxisAlignment.start,
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
                    Text(
                      'Lot Capacity (Spaces)',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
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
                    const SizedBox(height: 24),
                    Text(
                      'Location on Map',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    LotLocationPicker(
                      onLocationSelected: (latLng, address) {
                        selectedLatLng = latLng;
                        selectedAddress = address;
                      },
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
                                'total_spots':
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
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text('Location created!')),
                            );
                          }
                          ref.invalidate(locationsStreamProvider);
                          ref.invalidate(availableLocationsProvider);
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
