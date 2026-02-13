import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme.dart';
import '../../../logic/providers/locale_provider.dart';

class CasesHeader extends ConsumerWidget {
  final bool isDesktop;
  final String? selectedLocId;
  final TextEditingController searchController;
  final String selectedFilterKey;
  final ValueChanged<String> onSearchSubmitted;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String> onFilterSelected;
  final VoidCallback onQuickWarning;
  final VoidCallback onQuickTicket;

  const CasesHeader({
    super.key,
    required this.isDesktop,
    required this.selectedLocId,
    required this.searchController,
    required this.selectedFilterKey,
    required this.onSearchSubmitted,
    required this.onSearchChanged,
    required this.onFilterSelected,
    required this.onQuickWarning,
    required this.onQuickTicket,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isDesktop ? 48 : 24,
        vertical: isDesktop ? 48 : 32,
      ),
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      Lang.sel(isCroatian, 'Cases', 'Predmeti'),
                      style: GoogleFonts.inter(
                        fontSize: isDesktop ? 40 : 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      selectedLocId != null
                          ? Lang.sel(
                              isCroatian,
                              'Monitoring all enforcement activity.',
                              'Praćenje svih aktivnosti nadzora.')
                          : Lang.sel(
                              isCroatian,
                              'Please select a lot in the top bar.',
                              'Molimo odaberite parkiralište u gornjoj traci.'),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (selectedLocId != null)
                Row(
                  children: [
                    _HeaderActionButton(
                      icon: Icons.warning_amber_rounded,
                      label: Lang.sel(
                          isCroatian, 'Quick Warning', 'Brzo upozorenje'),
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      onTap: onQuickWarning,
                      isDesktop: true,
                    ),
                    const SizedBox(width: 12),
                    _HeaderActionButton(
                      icon: Icons.receipt_long,
                      label: Lang.sel(isCroatian, 'Quick Ticket', 'Brza kazna'),
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      onTap: onQuickTicket,
                      isDesktop: true,
                    ),
                  ],
                ),
            ],
          ),
          SizedBox(height: isDesktop ? 48 : 32),
          _SearchAndFilter(
            isDesktop: isDesktop,
            searchController: searchController,
            selectedFilterKey: selectedFilterKey,
            onSearchSubmitted: onSearchSubmitted,
            onSearchChanged: onSearchChanged,
            onFilterSelected: onFilterSelected,
          ),
        ],
      ),
    );
  }
}

class _HeaderActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color backgroundColor;
  final Color foregroundColor;
  final VoidCallback onTap;
  final bool isDesktop;

  const _HeaderActionButton({
    required this.icon,
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
    required this.onTap,
    required this.isDesktop,
  });

  @override
  Widget build(BuildContext context) {
    final hasBorder = backgroundColor == Colors.white;
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: isDesktop ? 18 : 16),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
        foregroundColor: foregroundColor,
        side: hasBorder ? const BorderSide(color: AppTheme.border) : null,
        padding: EdgeInsets.symmetric(
          horizontal: isDesktop ? 20 : 12,
          vertical: isDesktop ? 12 : 8,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
        elevation: 0,
        textStyle: GoogleFonts.inter(
          fontSize: isDesktop ? 14 : 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _SearchAndFilter extends ConsumerWidget {
  final bool isDesktop;
  final TextEditingController searchController;
  final String selectedFilterKey;
  final ValueChanged<String> onSearchSubmitted;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String> onFilterSelected;

  const _SearchAndFilter({
    required this.isDesktop,
    required this.searchController,
    required this.selectedFilterKey,
    required this.onSearchSubmitted,
    required this.onSearchChanged,
    required this.onFilterSelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: isDesktop ? 400 : double.infinity,
          child: TextField(
            controller: searchController,
            textInputAction: TextInputAction.search,
            onSubmitted: onSearchSubmitted,
            onChanged: onSearchChanged,
            decoration: InputDecoration(
              hintText: Lang.sel(isHr, 'Search...', 'Pretraži...'),
              prefixIcon: const Icon(Icons.search, size: 20),
              filled: true,
              fillColor: AppTheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(4),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(4),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _FilterButton(
                label: Lang.sel(isHr, 'All', 'Sve'),
                selected: selectedFilterKey == 'all',
                onTap: () => onFilterSelected('all'),
                isDesktop: isDesktop,
              ),
              const SizedBox(width: 12),
              _FilterButton(
                label: Lang.sel(isHr, 'Tickets', 'Kazne'),
                selected: selectedFilterKey == 'tickets',
                onTap: () => onFilterSelected('tickets'),
                isDesktop: isDesktop,
              ),
              const SizedBox(width: 12),
              _FilterButton(
                label: Lang.sel(isHr, 'Warnings', 'Upozorenja'),
                selected: selectedFilterKey == 'warnings',
                onTap: () => onFilterSelected('warnings'),
                isDesktop: isDesktop,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FilterButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool isDesktop;

  const _FilterButton({
    required this.label,
    required this.selected,
    required this.onTap,
    required this.isDesktop,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: isDesktop ? 24 : 16,
          vertical: isDesktop ? 10 : 8,
        ),
        decoration: BoxDecoration(
          color: selected ? Colors.black : AppTheme.surface,
          borderRadius: BorderRadius.circular(4),
          border: selected ? null : Border.all(color: AppTheme.border),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: isDesktop ? 13 : 12,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : Colors.black,
          ),
        ),
      ),
    );
  }
}
