import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme.dart';
import '../../../logic/providers/locale_provider.dart';

class LocationsHeader extends ConsumerWidget {
  final bool isSuperAdmin;
  final bool isAdmin;
  final String? locationId;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onAddLocation;

  const LocationsHeader({
    super.key,
    required this.isSuperAdmin,
    required this.isAdmin,
    required this.locationId,
    required this.onSearchChanged,
    required this.onAddLocation,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  Lang.sel(isCroatian, 'Locations & Hubs', 'Lokacije i Hubovi'),
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
                      ? Lang.sel(
                          isCroatian,
                          'Super Admin Mode: Viewing all locations',
                          'Super Admin način: Prikaz svih lokacija')
                      : Lang.sel(
                          isCroatian,
                          'Managing access for Location ID: $locationId',
                          'Upravljanje pristupom za ID lokacije: $locationId'),
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
            if (isAdmin || isSuperAdmin)
              ElevatedButton.icon(
                onPressed: onAddLocation,
                icon: const Icon(Icons.add, size: 18),
                label:
                    Text(Lang.sel(isCroatian, 'Add Lot', 'Dodaj parkiralište')),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
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
            onChanged: onSearchChanged,
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
      ],
    );
  }
}
