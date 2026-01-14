import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../repositories/parking_repository.dart';

class LocationsScreen extends ConsumerStatefulWidget {
  const LocationsScreen({super.key});

  @override
  ConsumerState<LocationsScreen> createState() => _LocationsScreenState();
}

class _LocationsScreenState extends ConsumerState<LocationsScreen> {
  @override
  Widget build(BuildContext context) {
    final locationsAsync = ref.watch(locationsStreamProvider);

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
                      'Locations & Lots',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Manage multiple parking zones and lots.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () => _showAddLocationDialog(context),
                  icon: const Icon(Icons.add_location_alt, size: 18),
                  label: const Text('Add Location'),
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
                child: locationsAsync.when(
                  data: (locations) {
                    if (locations.isEmpty) {
                      return const Center(child: Text('No locations found. Add one to get started.'));
                    }

                    return ListView.separated(
                      itemCount: locations.length,
                      separatorBuilder: (context, index) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final loc = locations[index];
                        final id = loc['id'].toString();
                        
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          leading: CircleAvatar(
                            backgroundColor: Colors.blue[50],
                            child: const Icon(Icons.local_parking, color: Colors.blue),
                          ),
                          title: Row(
                            children: [
                              Text(
                                loc['name'] ?? 'Unnamed Location',
                                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.grey[200],
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  loc['display_id'] ?? 'ID',
                                  style: GoogleFonts.robotoMono(fontSize: 10, color: Colors.black),
                                ),
                              ),
                            ],
                          ),
                          subtitle: Text(
                            (loc['latitude'] != null && loc['longitude'] != null)
                                ? '${loc['latitude']}, ${loc['longitude']}'
                                : 'No coordinates',
                            style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 13),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${loc['capacity'] ?? 0} Spots',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              const SizedBox(width: 16),
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
        title: const Text('Delete Location'),
        content: const Text('Are you sure you want to delete this location?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
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

  void _showAddLocationDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final latCtrl = TextEditingController();
    final lngCtrl = TextEditingController();
    final capacityCtrl = TextEditingController();
    // Auto-generate a random ID (LOC-XXXX)
    final idCtrl = TextEditingController(text: 'LOC-${(1000 + DateTime.now().millisecondsSinceEpoch % 9000)}'); 
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add New Location'),
        content: SizedBox(
          width: 400,
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: idCtrl,
                  decoration: const InputDecoration(labelText: 'Unique Location ID', hintText: 'LOC-1234'),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Location Name', hintText: 'e.g. Downtown Garage'),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: latCtrl,
                        decoration: const InputDecoration(labelText: 'Latitude'),
                        keyboardType: TextInputType.numberWithOptions(decimal: true),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: lngCtrl,
                        decoration: const InputDecoration(labelText: 'Longitude'),
                        keyboardType: TextInputType.numberWithOptions(decimal: true),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: capacityCtrl,
                  decoration: const InputDecoration(labelText: 'Capacity (Spaces)'),
                  keyboardType: TextInputType.number,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (formKey.currentState!.validate()) {
                try {
                      // Fallback Logic: Try full insert first
                      try {
                        await Supabase.instance.client.from('locations').insert({
                          'display_id': idCtrl.text,
                          'name': nameCtrl.text,
                          'latitude': double.tryParse(latCtrl.text),
                          'longitude': double.tryParse(lngCtrl.text),
                          'capacity': int.tryParse(capacityCtrl.text) ?? 0,
                        });
                      } catch (e) {
                        // If full insert fails, try fallback without new columns
                        if (e.toString().contains('capacity') || e.toString().contains('latitude') || e.toString().contains('PGRST204')) {
                          await Supabase.instance.client.from('locations').insert({
                            'display_id': idCtrl.text,
                            'name': nameCtrl.text,
                            // omit missing columns
                          });
                        } else {
                          rethrow;
                        }
                      }
                  
                  if (context.mounted) Navigator.pop(context);
                } catch (e) {
                  // ignore: avoid_print
                  print('Error inserting location: $e');
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error: ${e.toString()}'),
                        backgroundColor: Colors.red,
                        duration: const Duration(seconds: 5),
                      ),
                    );
                  }
                }
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}
