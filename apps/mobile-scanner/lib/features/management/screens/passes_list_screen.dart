import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../theme.dart';
import '../../../logic/providers/locale_provider.dart';
import '../../../logic/providers/auth_providers.dart';
import '../repositories/parking_repository.dart';
import 'add_pass_screen.dart';
import 'pass_detail_screen.dart' as pass_detail;
import '../../../widgets/admin_data_card.dart';

class PassesListScreen extends ConsumerStatefulWidget {
  const PassesListScreen({super.key});

  @override
  ConsumerState<PassesListScreen> createState() => _PassesListScreenState();
}

class _PassesListScreenState extends ConsumerState<PassesListScreen> {
  String _searchQuery = '';
  @override
  Widget build(BuildContext context) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    final permitsAsync = ref.watch(permitsStreamProvider);
    final selectedLocId = ref.watch(selectedLocationIdProvider);

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
                      Lang.sel(isCroatian, 'Permits', 'Dozvole'),
                      style: GoogleFonts.inter(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      selectedLocId != null
                          ? Lang.sel(isCroatian, 'Managing access for Lot: $selectedLocId',
                              'Upravljanje pristupom za parkiralište: $selectedLocId')
                          : Lang.sel(isCroatian, 'Please select a lot in the top bar.',
                              'Odaberite parkiralište u gornjoj traci.'),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
                if (selectedLocId != null)
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => const AddPassScreen()),
                      );
                    },
                    icon: const Icon(Icons.add, size: 18),
                    label: Text(Lang.sel(isCroatian, 'Add New', 'Dodaj novu')),
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
            SizedBox(
              width: 400,
              child: TextField(
                onChanged: (val) {
                  setState(() {
                    _searchQuery = val.trim().toLowerCase();
                  });
                },
                decoration: InputDecoration(
                  hintText: Lang.sel(isCroatian, 'Search', 'Pretraži'),
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
            const SizedBox(height: 24),

            // List
            Expanded(
              child: permitsAsync.when(
                data: (permits) {
                  if (permits.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.card_membership_outlined,
                              size: 64, color: Colors.grey[200]),
                          const SizedBox(height: 16),
                          Text(
                              Lang.sel(isCroatian, 'No permits found.',
                                  'Nije pronađena nijedna dozvola.'),
                              style: TextStyle(color: Colors.grey[400])),
                        ],
                      ),
                    );
                  }

                  final filtered = permits.where((p) {
                    final plate = (p['plate'] ?? '').toString().toLowerCase();
                    final type = (p['type'] ?? '').toString().toLowerCase();
                    if (_searchQuery.isEmpty) return true;
                    return plate.contains(_searchQuery) ||
                        type.contains(_searchQuery);
                  }).toList();

                  return ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final permit = filtered[index];
                      final type = permit['type'] ?? 'pass';
                      final plate = permit['plate'] ?? 'UNKNOWN';
                      final status = permit['status'] ?? 'active';
                      final id = permit['id'].toString();

                      return AdminDataCard(
                        leading: Container(
                          width: 160,
                          height: 48,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: Colors.black,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            plate.toUpperCase(),
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                        mainContent: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              type == 'subscription'
                                  ? Lang.sel(isCroatian, 'Monthly Subscription',
                                      'Mjesečna pretplata')
                                  : Lang.sel(isCroatian, 'Guest Pass',
                                      'Gostujuća dozvola'),
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: Colors.black,
                              ),
                            ),
                            Text(
                              Lang.sel(isCroatian, 'Valid until: Dec 2026',
                                  'Vrijedi do: Dec 2026'),
                              style: GoogleFonts.inter(
                                color: AppTheme.textSecondary,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildStatusBadge(status, isCroatian),
                            const SizedBox(width: 24),
                            ElevatedButton(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        pass_detail.PassDetailScreen(permit: permit),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 12,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                              child: Text(Lang.sel(isCroatian, 'View', 'Pogledaj')),
                            ),
                            const SizedBox(width: 12),
                            IconButton(
                              icon: const Icon(
                                Icons.delete_outline,
                                color: Colors.black,
                              ),
                              onPressed: () => _confirmDelete(id),
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(
                    child: CircularProgressIndicator(color: Colors.black)),
                error: (err, _) => Center(
                    child: Text(Lang.sel(
                        isCroatian, 'Error: $err', 'Greška: $err'))),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status, bool isHr) {
    bool isActive = status.toLowerCase() == 'active';
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
              color: isActive ? Colors.green[400] : Colors.red[400],
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            (() {
              final s = status.toLowerCase();
              if (s == 'active') return Lang.sel(isHr, 'ACTIVE', 'AKTIVNO');
              if (s == 'expired') return Lang.sel(isHr, 'EXPIRED', 'ISTEKLO');
              if (s == 'revoked') return Lang.sel(isHr, 'REVOKED', 'OPOZVANO');
              if (s == 'pending') return Lang.sel(isHr, 'PENDING', 'NA ČEKANJU');
              return status.toUpperCase();
            })(),
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
    final isCroatian = ref.read(localeIsCroatianProvider);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(Lang.sel(isCroatian, 'Delete Permit', 'Obriši dozvolu')),
        content: Text(Lang.sel(isCroatian,
            'Are you sure you want to delete this permit? This action cannot be undone.',
            'Jeste li sigurni da želite obrisati ovu dozvolu? Ova radnja je nepovratna.')),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(Lang.sel(isCroatian, 'Cancel', 'Odustani'))),
          TextButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              await ref.read(parkingRepositoryProvider).deletePermit(id);
              navigator.pop();
            },
            child: Text(Lang.sel(isCroatian, 'Delete', 'Obriši'),
                style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
