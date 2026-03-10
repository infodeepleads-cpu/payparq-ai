import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:google_fonts/google_fonts.dart';
import 'package:printing/printing.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../utils/permit_pdf.dart';
import '../../../logic/providers/locale_provider.dart';
import '../../../logic/providers/auth_providers.dart';

class PassDetailScreen extends ConsumerWidget {
  final Map<String, dynamic> permit;

  const PassDetailScreen({super.key, required this.permit});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    // Calculate fields
    final String type = permit['type'] ?? 'pass';
    final String plate = permit['plate'] ?? 'UNKNOWN';
    final String selectedDid = ref.watch(selectedLocationIdProvider) ?? 'N/A';
    final String rawLocId = (permit['location_id'] ?? '').toString();
    final String enrichedDid = (permit['location_display_id'] ?? '').toString();
    String locationId = enrichedDid.isNotEmpty ? enrichedDid : rawLocId;
    final uuidRegExp = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false);
    if (uuidRegExp.hasMatch(locationId.toLowerCase())) {
      final locsAsync = ref.watch(availableLocationsProvider);
      if (locsAsync.hasValue) {
        final idToDisplay = <String, String>{};
        for (final l in (locsAsync.value ?? [])) {
          final id = (l['id'] ?? '').toString();
          final did = (l['display_id'] ?? '').toString();
          if (id.isNotEmpty && did.isNotEmpty) idToDisplay[id] = did;
        }
        locationId = idToDisplay[rawLocId] ?? selectedDid;
      } else {
        locationId = selectedDid;
      }
    }
    final double price = (permit['price'] as num?)?.toDouble() ?? 0.00;
    final String contactName = (permit['contact_name'] ?? '').toString();
    final String contactPhone = (permit['contact_phone'] ?? '').toString();
    final String contactEmail = (permit['contact_email'] ?? '').toString();

    Map<String, dynamic> parseStripeMetadata(dynamic raw) {
      try {
        if (raw is Map<String, dynamic>) return raw;
        if (raw is Map) return Map<String, dynamic>.from(raw);
        if (raw is String) {
          final first = jsonDecode(raw);
          if (first is Map<String, dynamic>) return first;
          if (first is Map) return Map<String, dynamic>.from(first);
          if (first is String) {
            final second = jsonDecode(first);
            if (second is Map<String, dynamic>) return second;
            if (second is Map) return Map<String, dynamic>.from(second);
          }
        }
      } catch (_) {}
      return {};
    }

    int parseQuantity(dynamic raw) {
      if (raw == null) return 1;
      final intValue = int.tryParse(raw.toString());
      if (intValue != null && intValue > 0) return intValue;
      final doubleValue = double.tryParse(raw.toString());
      if (doubleValue != null && doubleValue > 0) return doubleValue.round();
      return 1;
    }

    int resolveQuantity(Map<String, dynamic> item, Map<String, dynamic> meta) {
      // 1. Primary check: check session fields and metadata for explicit quantity
      final parsed = parseQuantity(
        meta['quantity'] ??
            meta['qty'] ??
            meta['duration_quantity'] ??
            item['quantity'],
      );

      // V17: Ensure we use the parsed quantity if it's > 1, as it represents the number of units (hours/days/months)
      if (parsed > 1) return parsed;

      // 2. Secondary check: check session fields and metadata for duration minutes
      final durationMinutes = parseQuantity(
        meta['duration_minutes'] ??
            meta['duration'] ??
            item['duration_minutes'],
      );

      final currentType =
          (item['type'] ?? meta['type'] ?? 'hourly').toString().toLowerCase();
      final unit = (meta['duration_unit'] ?? item['duration_unit'] ?? '')
          .toString()
          .toLowerCase();

      if (durationMinutes > 1) {
        if (currentType == 'monthly' ||
            currentType == 'subscription' ||
            unit == 'month') {
          return (durationMinutes / (30 * 24 * 60)).round().clamp(1, 9999);
        }
        if (currentType == 'daily' || unit == 'day') {
          return (durationMinutes / (24 * 60)).round().clamp(1, 9999);
        }
        return (durationMinutes / 60).round().clamp(1, 9999);
      }

      // 3. Tertiary check: calculate from time difference
      final start = _parseToCetDateTime(
          (item['entry_time'] ?? item['start_time'] ?? item['created_at'] ?? '')
              .toString());
      final end = _parseToCetDateTime(
          (item['exit_time'] ?? item['end_time'] ?? '').toString());

      if (start != null && end != null && end.isAfter(start)) {
        final diffMinutes = end.difference(start).inMinutes;
        if (diffMinutes >= 1) {
          if (currentType == 'monthly' ||
              currentType == 'subscription' ||
              unit == 'month') {
            return (diffMinutes / (30 * 24 * 60)).round().clamp(1, 9999);
          }
          if (currentType == 'daily' || unit == 'day') {
            return (diffMinutes / (24 * 60)).round().clamp(1, 9999);
          }
          return (diffMinutes / 60).round().clamp(1, 9999);
        }
      }

      return parsed;
    }

    Map<String, dynamic> parseAccessMetadata(Map<String, dynamic> item) {
      final stripe = parseStripeMetadata(item['stripe_metadata']);
      final notes = parseStripeMetadata(item['notes']);
      final access = notes['access_control'];
      if (access is Map<String, dynamic>) {
        return {...stripe, ...access};
      }
      if (access is Map) {
        return {...stripe, ...Map<String, dynamic>.from(access)};
      }
      return stripe;
    }

    final stripeMetadata = parseAccessMetadata(permit);
    final quantity = resolveQuantity(permit, stripeMetadata);
    final normalizedType = type.toLowerCase();
    final allowedWeekdays = _resolveAllowedWeekdays(permit, stripeMetadata);
    final bool isSubscription = normalizedType == 'subscription';
    final rawIs24_7 = stripeMetadata['is_24_7'];
    final bool is24_7 = rawIs24_7 is bool
        ? rawIs24_7
        : (permit['daily_start_time'] == null &&
            permit['daily_end_time'] == null);
    final startRaw = (permit['start_time'] ?? '').toString();
    final endRaw = (permit['end_time'] ?? '').toString();
    final DateTime? startTime = _parseToCetDateTime(startRaw);
    DateTime? endTime = _parseToCetDateTime(endRaw);

    // If endTime is null, calculate it based on duration logic for paid permits
    if (endTime == null && startTime != null) {
      final billingType =
          (permit['billing_type'] ?? stripeMetadata['billing_type'])
              ?.toString()
              .toLowerCase();
      final metadataType =
          (stripeMetadata['type'] ?? '').toString().toLowerCase();
      final metadataUnit =
          (stripeMetadata['duration_unit'] ?? '').toString().toLowerCase();

      if (normalizedType == 'monthly' ||
          normalizedType == 'subscription' ||
          billingType == 'monthly' ||
          metadataType == 'monthly' ||
          metadataUnit == 'month') {
        endTime = startTime.add(Duration(days: 30 * quantity));
      } else if (normalizedType == 'daily' ||
          billingType == 'daily' ||
          metadataType == 'daily' ||
          metadataUnit == 'day') {
        endTime = startTime.add(Duration(days: 1 * quantity));
      } else {
        // V15: Default to +1 hour * quantity for hourly or any unknown guest session
        endTime = startTime.add(Duration(hours: 1 * quantity));
      }
    }

    String durationString = '—';
    final billingType =
        (permit['billing_type'] ?? stripeMetadata['billing_type'])
            ?.toString()
            .toLowerCase();
    final metadataType =
        (stripeMetadata['type'] ?? '').toString().toLowerCase();
    final metadataUnit =
        (stripeMetadata['duration_unit'] ?? '').toString().toLowerCase();
    final isGuestPass = normalizedType == 'pass';
    final nowCet = _utcToCet(DateTime.now().toUtc());
    final accessAllowedNow = _isPermitAllowedNow(
      nowCet: nowCet,
      startTime: startTime,
      endTime: endTime,
      permit: permit,
      isSubscription: isSubscription,
      is24_7: is24_7,
      allowedWeekdays: allowedWeekdays,
    );

    if (isGuestPass) {
      final Duration? duration = (startTime != null && endTime != null)
          ? endTime.difference(startTime)
          : null;
      final hours = duration != null
          ? ((duration.inMinutes <= 0 ? 0 : duration.inMinutes) / 60).round()
          : quantity;
      durationString = '$hours ${hours == 1 ? 'Hour' : 'Hours'}';
    } else if (normalizedType == 'monthly' ||
        normalizedType == 'subscription' ||
        billingType == 'monthly' ||
        metadataType == 'monthly' ||
        metadataUnit == 'month') {
      durationString = '$quantity ${quantity == 1 ? 'Month' : 'Months'}';
    } else if (normalizedType == 'daily' ||
        billingType == 'daily' ||
        metadataType == 'daily' ||
        metadataUnit == 'day') {
      durationString = '$quantity ${quantity == 1 ? 'Day' : 'Days'}';
    } else if (normalizedType == 'hourly' ||
        billingType == 'hourly' ||
        metadataType == 'hourly' ||
        metadataUnit == 'hour') {
      final Duration? duration = (startTime != null && endTime != null)
          ? endTime.difference(startTime)
          : null;
      final hourlyQuantity = duration != null
          ? ((duration.inMinutes <= 0 ? 0 : duration.inMinutes) / 60).round()
          : quantity;
      durationString =
          '$hourlyQuantity ${hourlyQuantity == 1 ? 'Hour' : 'Hours'}';
    } else {
      final Duration? duration = (startTime != null && endTime != null)
          ? endTime.difference(startTime)
          : null;
      if (duration != null) {
        final hours =
            ((duration.inMinutes <= 0 ? 0 : duration.inMinutes) / 60).round();
        if (hours >= 24) {
          final days = (hours / 24).floor();
          durationString = '$days ${days == 1 ? 'Day' : 'Days'}';
        } else {
          durationString = '$hours ${hours == 1 ? 'Hour' : 'Hours'}';
        }
      }
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(Lang.sel(isCroatian, 'Permit Details', 'Detalji dozvole'),
            style: GoogleFonts.inter(
                color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isDesktop = constraints.maxWidth >= 1100;
          return SingleChildScrollView(
            padding: EdgeInsets.all(isDesktop ? 48.0 : 16.0),
            child: Column(
              children: [
                // Card Container
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 24,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header: Plate & Type
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                plate.toUpperCase(),
                                style: GoogleFonts.inter(
                                  fontSize: 40,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                  letterSpacing: -1,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                type.toUpperCase(),
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: AppTheme.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Colors.black,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              type == 'subscription'
                                  ? Icons.loop
                                  : Icons.confirmation_number,
                              color: Colors.white,
                              size: 32,
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 64, color: AppTheme.border),

                      if (isDesktop && isSubscription) ...[
                        Wrap(
                          spacing: 64,
                          runSpacing: 32,
                          children: [
                            _buildDetailItem(
                                Lang.sel(
                                    isCroatian, 'Location ID', 'ID lokacije'),
                                locationId,
                                Icons.map),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Name', 'Ime'),
                                contactName.isNotEmpty ? contactName : '—',
                                Icons.person),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Phone', 'Telefon'),
                                contactPhone.isNotEmpty ? contactPhone : '—',
                                Icons.phone),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Email', 'Email'),
                                contactEmail.isNotEmpty ? contactEmail : '—',
                                Icons.email_outlined),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 64,
                          runSpacing: 32,
                          children: [
                            _buildDetailItem(
                                Lang.sel(
                                    isCroatian, 'Entry Time', 'Vrijeme ulaza'),
                                startTime != null ? _formatDate(startTime) : '—',
                                Icons.login),
                            _buildDetailItem(
                                Lang.sel(
                                    isCroatian, 'Exit Time', 'Vrijeme izlaza'),
                                endTime != null ? _formatDate(endTime) : '—',
                                Icons.logout),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Duration', 'Trajanje'),
                                durationString,
                                Icons.timer),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Price', 'Cijena'),
                                '€${price.toStringAsFixed(2)}',
                                Icons.attach_money),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 64,
                          runSpacing: 32,
                          children: [
                            _buildDetailItem(
                                Lang.sel(
                                    isCroatian, 'Daily Limit', 'Dnevni limit'),
                                '${(permit['daily_duration_hours'] ?? 24)} ${Lang.sel(isCroatian, 'Hours', 'Sati')}',
                                Icons.timer_outlined),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Allowed Days',
                                    'Dozvoljeni dani'),
                                is24_7
                                    ? Lang.sel(isCroatian, 'Every day', 'Svaki dan')
                                    : _formatWeekdays(
                                        allowedWeekdays, isCroatian),
                                Icons.calendar_today),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Access Time',
                                    'Vrijeme pristupa'),
                                is24_7 ? '24/7' : _formatAccessWindow(permit),
                                Icons.schedule),
                            _buildDetailItem(
                                Lang.sel(
                                    isCroatian, 'Active Now', 'Aktivno sada'),
                                accessAllowedNow
                                    ? Lang.sel(
                                        isCroatian, 'Allowed', 'Dozvoljeno')
                                    : Lang.sel(isCroatian, 'Not Allowed',
                                        'Nije dozvoljeno'),
                                accessAllowedNow
                                    ? Icons.verified
                                    : Icons.block_outlined),
                          ],
                        ),
                      ] else ...[
                        Wrap(
                          spacing: 64,
                          runSpacing: 32,
                          children: [
                            _buildDetailItem(
                                Lang.sel(
                                    isCroatian, 'Location ID', 'ID lokacije'),
                                locationId,
                                Icons.map),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Name', 'Ime'),
                                contactName.isNotEmpty ? contactName : '—',
                                Icons.person),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Phone', 'Telefon'),
                                contactPhone.isNotEmpty ? contactPhone : '—',
                                Icons.phone),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Email', 'Email'),
                                contactEmail.isNotEmpty ? contactEmail : '—',
                                Icons.email_outlined),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 64,
                          runSpacing: 32,
                          children: [
                            _buildDetailItem(
                                Lang.sel(
                                    isCroatian, 'Entry Time', 'Vrijeme ulaza'),
                                startTime != null ? _formatDate(startTime) : '—',
                                Icons.login),
                            _buildDetailItem(
                                Lang.sel(
                                    isCroatian, 'Exit Time', 'Vrijeme izlaza'),
                                endTime != null ? _formatDate(endTime) : '—',
                                Icons.logout),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Duration', 'Trajanje'),
                                durationString,
                                Icons.timer),
                            _buildDetailItem(
                                Lang.sel(isCroatian, 'Price', 'Cijena'),
                                '€${price.toStringAsFixed(2)}',
                                Icons.attach_money),
                            if (isSubscription)
                              _buildDetailItem(
                                  Lang.sel(isCroatian, 'Daily Limit',
                                      'Dnevni limit'),
                                  '${(permit['daily_duration_hours'] ?? 24)} ${Lang.sel(isCroatian, 'Hours', 'Sati')}',
                                  Icons.timer_outlined),
                            if (isSubscription && !is24_7)
                              _buildDetailItem(
                                  Lang.sel(isCroatian, 'Allowed Days',
                                      'Dozvoljeni dani'),
                                  _formatWeekdays(allowedWeekdays, isCroatian),
                                  Icons.calendar_today),
                            if (isSubscription && !is24_7)
                              _buildDetailItem(
                                  Lang.sel(isCroatian, 'Access Time',
                                      'Vrijeme pristupa'),
                                  _formatAccessWindow(permit),
                                  Icons.schedule),
                            if (isSubscription)
                              _buildDetailItem(
                                  Lang.sel(
                                      isCroatian, 'Active Now', 'Aktivno sada'),
                                  accessAllowedNow
                                      ? Lang.sel(
                                          isCroatian, 'Allowed', 'Dozvoljeno')
                                      : Lang.sel(isCroatian, 'Not Allowed',
                                          'Nije dozvoljeno'),
                                  accessAllowedNow
                                      ? Icons.verified
                                      : Icons.block_outlined),
                          ],
                        ),
                      ],

                      if (isDesktop) ...[
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            ElevatedButton.icon(
                              onPressed: () async {
                                try {
                                  final bytes = await buildPermitPdf(permit);
                                  if (!context.mounted) return;
                                  await Printing.sharePdf(
                                    bytes: bytes,
                                    filename: 'permit_${permit['id']}.pdf',
                                  );
                                  if (!context.mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content: Text(Lang.sel(
                                            isCroatian,
                                            'PDF shared successfully',
                                            'PDF je uspješno podijeljen'))),
                                  );
                                } catch (e) {
                                  if (!context.mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content: Text(Lang.sel(
                                            isCroatian,
                                            'PDF share failed',
                                            'Dijeljenje PDF-a nije uspjelo'))),
                                  );
                                }
                              },
                              icon: const Icon(Icons.picture_as_pdf),
                              label: Text(Lang.sel(
                                  isCroatian, 'Generate PDF', 'Generiraj PDF')),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 12),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton.icon(
                              onPressed: () async {
                                try {
                                  final bytes = await buildPermitPdf(permit);
                                  final contactEmail =
                                      (permit['contact_email'] ?? '')
                                          .toString()
                                          .trim();
                                  if (kIsWeb) {
                                    final subject = Uri.encodeComponent(
                                        Lang.sel(
                                            isCroatian,
                                            'Your Parking Permit',
                                            'Vaša dozvola za parkiranje'));
                                    final plateVal =
                                        (permit['plate'] ?? 'UNKNOWN')
                                            .toString()
                                            .toUpperCase();
                                    final paymentLink =
                                        (permit['payment_link'] ?? '')
                                            .toString();
                                    final paymentText = paymentLink.isNotEmpty
                                        ? Lang.sel(
                                            isCroatian,
                                            '\n\nPayment link (valid for 60 min):\n$paymentLink',
                                            '\n\nLink za plaćanje (vrijedi 60 min):\n$paymentLink')
                                        : '';

                                    final body = Uri.encodeComponent(Lang.sel(
                                        isCroatian,
                                        'Dear Pass Holder,\n\nYour permit for plate $plateVal is ready.$paymentText\n\nPlease attach the generated PDF to this email.\n\nThank you.',
                                        'Poštovani korisniče dozvole,\n\nVaša dozvola za registraciju $plateVal je spremna.$paymentText\n\nMolimo priložite generirani PDF uz ovu e-poštu.\n\nHvala.'));
                                    final mailto =
                                        'mailto:${contactEmail.isNotEmpty ? contactEmail : ''}?subject=$subject&body=$body';
                                    final uri = Uri.parse(mailto);
                                    if (await canLaunchUrl(uri)) {
                                      await launchUrl(uri);
                                    } else {
                                      if (!context.mounted) return;
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                            content: Text(Lang.sel(
                                                isCroatian,
                                                'Unable to open email client',
                                                'Nije moguće otvoriti email klijent'))),
                                      );
                                    }
                                  } else {
                                    await Printing.sharePdf(
                                      bytes: bytes,
                                      filename: 'permit_${permit['id']}.pdf',
                                    );
                                  }
                                } catch (e) {
                                  if (!context.mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content: Text(Lang.sel(isCroatian,
                                            'Error: $e', 'Greška: $e'))),
                                  );
                                }
                              },
                              icon: const Icon(Icons.email_outlined),
                              label: Text(Lang.sel(
                                  isCroatian,
                                  'Email PDF to Holder',
                                  'Pošalji PDF nositelju')),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: Colors.black,
                                side: const BorderSide(color: AppTheme.border),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 12),
                              ),
                            ),
                          ],
                        ),
                      ],

                      const SizedBox(height: 48),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return SizedBox(
      width: 180,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.grey[400]),
              const SizedBox(width: 8),
              Text(
                label.toUpperCase(),
                style: GoogleFonts.inter(
                  color: AppTheme.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.inter(
              color: Colors.black,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  DateTime? _parseToCetDateTime(String raw) {
    if (raw.isEmpty) return null;
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return null;
    final hasOffset =
        RegExp(r'(Z|[+-]\d{2}:\d{2})$', caseSensitive: false).hasMatch(raw);
    if (!hasOffset) {
      return DateTime(parsed.year, parsed.month, parsed.day, parsed.hour,
          parsed.minute, parsed.second, parsed.millisecond, parsed.microsecond);
    }
    final utc = parsed.isUtc ? parsed : parsed.toUtc();
    return _utcToCet(utc);
  }

  DateTime _utcToCet(DateTime utc) {
    final startDst = _lastSundayUtc(utc.year, 3, 1);
    final endDst = _lastSundayUtc(utc.year, 10, 1);
    final isDst = !utc.isBefore(startDst) && utc.isBefore(endDst);
    return utc.add(Duration(hours: isDst ? 2 : 1));
  }

  DateTime _lastSundayUtc(int year, int month, int hourUtc) {
    var day = DateTime.utc(year, month + 1, 0);
    while (day.weekday != DateTime.sunday) {
      day = day.subtract(const Duration(days: 1));
    }
    return DateTime.utc(year, month, day.day, hourUtc);
  }

  String _formatDate(DateTime date) {
    return "${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
  }

  List<int> _resolveAllowedWeekdays(
      Map<String, dynamic> permit, Map<String, dynamic> metadata) {
    final raw = permit['allowed_weekdays'] ?? metadata['allowed_weekdays'];
    if (raw is List) {
      final values = raw
          .map((e) => int.tryParse(e.toString()))
          .whereType<int>()
          .where((e) => e >= 1 && e <= 7)
          .toSet()
          .toList()
        ..sort();
      if (values.isNotEmpty) return values;
    }
    return [1, 2, 3, 4, 5, 6, 7];
  }

  bool _isPermitAllowedNow({
    required DateTime nowCet,
    required DateTime? startTime,
    required DateTime? endTime,
    required Map<String, dynamic> permit,
    required bool isSubscription,
    required bool is24_7,
    required List<int> allowedWeekdays,
  }) {
    if (startTime != null && nowCet.isBefore(startTime)) return false;
    if (endTime != null && nowCet.isAfter(endTime)) return false;
    if (!isSubscription || is24_7) return true;
    if (!allowedWeekdays.contains(nowCet.weekday)) return false;
    final startRaw = (permit['daily_start_time'] ?? '').toString();
    final endRaw = (permit['daily_end_time'] ?? '').toString();
    final startMinute = _parseTimeToMinuteOfDay(startRaw);
    final endMinute = _parseTimeToMinuteOfDay(endRaw);
    if (startMinute == null || endMinute == null) return true;
    final currentMinute = nowCet.hour * 60 + nowCet.minute;
    if (startMinute == endMinute) return true;
    if (startMinute < endMinute) {
      return currentMinute >= startMinute && currentMinute <= endMinute;
    }
    return currentMinute >= startMinute || currentMinute <= endMinute;
  }

  int? _parseTimeToMinuteOfDay(String raw) {
    if (raw.isEmpty) return null;
    final parts = raw.split(':');
    if (parts.length < 2) return null;
    final h = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (h == null || m == null) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  String _formatWeekdays(List<int> weekdays, bool isCroatian) {
    if (weekdays.length == 7) {
      return Lang.sel(isCroatian, 'All Days', 'Svi dani');
    }
    const en = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hr = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
    final labels = weekdays
        .where((d) => d >= 1 && d <= 7)
        .map((d) => isCroatian ? hr[d - 1] : en[d - 1])
        .toList();
    return labels.isEmpty
        ? Lang.sel(isCroatian, 'None', 'Nema')
        : labels.join(', ');
  }

  String _formatAccessWindow(Map<String, dynamic> permit) {
    final startRaw = (permit['daily_start_time'] ?? '').toString();
    final endRaw = (permit['daily_end_time'] ?? '').toString();
    if (startRaw.isEmpty || endRaw.isEmpty) return '—';
    final s = startRaw.split(':');
    final e = endRaw.split(':');
    if (s.length < 2 || e.length < 2) return '—';
    final start = '${s[0].padLeft(2, '0')}:${s[1].padLeft(2, '0')}';
    final end = '${e[0].padLeft(2, '0')}:${e[1].padLeft(2, '0')}';
    return '$start - $end';
  }
}
