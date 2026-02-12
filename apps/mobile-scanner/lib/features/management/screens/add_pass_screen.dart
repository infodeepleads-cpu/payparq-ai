import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../../../logic/providers/auth_providers.dart';
import '../providers/passes_controller.dart';
import '../../../utils/async_action_handler.dart';
import '../../../services/error_mapper.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AddPassScreen extends ConsumerStatefulWidget {
  const AddPassScreen({super.key});

  @override
  ConsumerState<AddPassScreen> createState() => _AddPassScreenState();
}

class _AddPassScreenState extends ConsumerState<AddPassScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _plateController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _locationController = TextEditingController();

  // State
  String _type = 'pass'; // 'pass' or 'subscription'
  bool _isProcessing = false;

  // Pass Specific
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(hours: 24));

  // Subscription Specific
  bool _is24_7 = true;
  double _dailyDurationHours = 24; // Default 24 hours
  TimeOfDay _dailyStart = const TimeOfDay(hour: 8, minute: 0);
  TimeOfDay _dailyEnd = const TimeOfDay(hour: 18, minute: 0);
  int _subscriptionDurationMonths = 1;

  @override
  void initState() {
    super.initState();
    // Use post-frame callback to access ref and set initial location ID
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Priority: 1. Global selection, 2. Profile location
      final selectedId = ref.read(selectedLocationIdProvider);
      final profile = ref.read(userProfileProvider).value;

      if (selectedId != null) {
        _locationController.text = selectedId;
      } else if (profile != null && profile['location_id'] != null) {
        _locationController.text = profile['location_id'];
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isProcessing = true);

    // Always resolve to UUID from selected location, not display_id
    String? locationUuid = await ref.read(selectedLocationUuidProvider.future);
    if (locationUuid == null || locationUuid.isEmpty) {
      // Fallback: if user manually typed a display_id, map it to UUID
      final locText = _locationController.text.trim();
      final uuidRegex = RegExp(
          r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
          caseSensitive: false);
      if (uuidRegex.hasMatch(locText.toLowerCase())) {
        locationUuid = locText;
      } else {
        final res = await Supabase.instance.client
            .from('locations')
            .select('id')
            .eq('display_id', locText)
            .maybeSingle();
        locationUuid = res?['id']?.toString();
      }
    }
    if (locationUuid == null || locationUuid.isEmpty) {
      setState(() => _isProcessing = false);
      return;
    }

    debugPrint(
        'AddPass submit resolved locationUuid=$locationUuid typed=${_locationController.text}');

    final Map<String, dynamic> data = {
      'plate': _plateController.text.toUpperCase(),
      'type': _type,
      'contact_name': _nameController.text,
      'contact_phone': _phoneController.text,
      'contact_email': _emailController.text,
      'location_id': locationUuid,
      'start_time': _startDate.toIso8601String(),
      'end_time': _endDate.toIso8601String(),
      'status': 'active',
      'daily_duration_hours':
          _type == 'subscription' ? _dailyDurationHours.toInt() : null,
    };

    if (_type == 'subscription' && !_is24_7) {
      data['daily_start_time'] = '${_dailyStart.hour}:${_dailyStart.minute}:00';
      data['daily_end_time'] = '${_dailyEnd.hour}:${_dailyEnd.minute}:00';
    }

    if (!mounted) {
      return;
    }

    final success = await AsyncActionHandler.run<bool>(
      context: context,
      action: () async {
        await ref.read(passesControllerProvider).createPermit(data);
        return true;
      },
      successMessage:
          '${_type == 'pass' ? 'Guest Pass' : 'Subscription'} Added!',
      successColor: Colors.green,
      errorBuilder: ErrorMapper.message,
    );
    if (mounted) {
      if (success == true) {
        Navigator.pop(context);
      }
      setState(() => _isProcessing = false);
    }
  }

  // Removed unused _resetForm method to eliminate analyzer warning.

  void _updateSubscriptionDates() {
    if (_type == 'subscription') {
      setState(() {
        _endDate =
            _startDate.add(Duration(days: 30 * _subscriptionDurationMonths));
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Removed unused topPadding variable to eliminate analyzer warning.

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 70,
        leading: Padding(
          padding: const EdgeInsets.only(left: 24.0, top: 8, bottom: 8),
          child: IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new,
                size: 18, color: Colors.black),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(4),
                side: const BorderSide(color: AppTheme.border),
              ),
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(48.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'New Access',
                style: GoogleFonts.inter(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Issue temporary passes or ongoing subscriptions.',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 48),

              // Type Toggle
              Container(
                width: 400,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    _buildTypeButton('Parking Pass', 'pass'),
                    _buildTypeButton('Subscription', 'subscription'),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left: Basic Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('User Details',
                            style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 24),
                        _buildTextField(
                          label: 'License Plate',
                          controller: _plateController,
                          hint: 'ZG1234AB',
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 24),
                        _buildTextField(
                          label: 'Location ID',
                          controller: _locationController,
                          hint: 'LOC-001',
                          enabled:
                              ref.read(userProfileProvider).value?['role'] ==
                                  'super_admin',
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 24),
                        _buildTextField(
                          label: 'Name',
                          controller: _nameController,
                          hint: 'John Doe',
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 24),
                        _buildTextField(
                          label: 'Phone',
                          controller: _phoneController,
                          hint: '+1 555 010 9999',
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 24),
                        _buildTextField(
                          label: 'Email (Optional)',
                          controller: _emailController,
                          hint: 'john@example.com',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 64),
                  // Right: Duration & Access
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Access Control',
                            style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 24),
                        if (_type == 'pass') ...[
                          _buildDateTimePicker('Start Time', _startDate,
                              (d) => setState(() => _startDate = d)),
                          const SizedBox(height: 24),
                          _buildDateTimePicker('End Time', _endDate,
                              (d) => setState(() => _endDate = d)),
                          const SizedBox(height: 16),
                          Text(
                              'Total Duration: ${_endDate.difference(_startDate).inHours} hours',
                              style: const TextStyle(
                                  color: AppTheme.textSecondary, fontSize: 13)),
                        ] else ...[
                          _buildDatePicker('Start Date', _startDate, (d) {
                            setState(() {
                              _startDate = d;
                              _updateSubscriptionDates();
                            });
                          }),
                          const SizedBox(height: 24),
                          Text(
                              'Daily Limit: ${_dailyDurationHours.toInt()} Hours',
                              style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(height: 8),
                          Slider(
                            value: _dailyDurationHours,
                            min: 1,
                            max: 24,
                            divisions: 23,
                            label: '${_dailyDurationHours.toInt()} h',
                            activeColor: Colors.black,
                            inactiveColor: AppTheme.surface,
                            onChanged: (v) =>
                                setState(() => _dailyDurationHours = v),
                          ),
                          const SizedBox(height: 24),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Duration',
                                  style: GoogleFonts.inter(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14)),
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppTheme.surface,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButtonFormField<int>(
                                    initialValue: _subscriptionDurationMonths,
                                    decoration: const InputDecoration(
                                        border: InputBorder.none),
                                    style: GoogleFonts.inter(
                                        color: Colors.black,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500),
                                    items: [1, 3, 6, 12]
                                        .map((m) => DropdownMenuItem(
                                            value: m,
                                            child: Text(
                                                '$m Month${m > 1 ? 's' : ''}')))
                                        .toList(),
                                    onChanged: (v) {
                                      setState(() {
                                        _subscriptionDurationMonths = v!;
                                        _updateSubscriptionDates();
                                      });
                                    },
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                              'Valid until: ${_endDate.toString().split(' ')[0]}',
                              style: const TextStyle(
                                  color: AppTheme.textSecondary, fontSize: 12)),
                          const SizedBox(height: 32),
                          CheckboxListTile(
                            title: Text('24/7 Access',
                                style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold, fontSize: 14)),
                            value: _is24_7,
                            onChanged: (v) => setState(() => _is24_7 = v!),
                            controlAffinity: ListTileControlAffinity.leading,
                            contentPadding: EdgeInsets.zero,
                            activeColor: Colors.black,
                          ),
                          if (!_is24_7) ...[
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                    child: _buildTimePicker(
                                        'From',
                                        _dailyStart,
                                        (t) =>
                                            setState(() => _dailyStart = t))),
                                const SizedBox(width: 24),
                                Expanded(
                                    child: _buildTimePicker('To', _dailyEnd,
                                        (t) => setState(() => _dailyEnd = t))),
                              ],
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 64),
              SizedBox(
                width: 300,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4)),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : Text(
                          'Issue ${_type == 'pass' ? 'Guest Pass' : 'Subscription'}',
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeButton(String title, String value) {
    final isSelected = _type == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _type = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? Colors.black : Colors.transparent,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? Colors.white : AppTheme.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    String? hint,
    bool enabled = true,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.black)),
        const SizedBox(height: 12),
        TextFormField(
          controller: controller,
          validator: validator,
          enabled: enabled,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400]),
            filled: true,
            fillColor: enabled ? AppTheme.surface : Colors.grey[50],
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none),
            disabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  Widget _buildDateTimePicker(
      String label, DateTime current, Function(DateTime) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.black)),
        const SizedBox(height: 12),
        InkWell(
          onTap: () async {
            final date = await showDatePicker(
                context: context,
                initialDate: current,
                firstDate: DateTime.now().subtract(const Duration(days: 1)),
                lastDate: DateTime.now().add(const Duration(days: 365)));
            if (!mounted) return;
            if (date != null) {
              final time = await showTimePicker(
                  context: context,
                  initialTime: TimeOfDay.fromDateTime(current));
              if (!mounted) return;
              if (time != null) {
                onChanged(DateTime(
                    date.year, date.month, date.day, time.hour, time.minute));
              }
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${current.year}-${current.month}-${current.day} ${current.hour}:${current.minute.toString().padLeft(2, '0')}',
                  style: GoogleFonts.inter(
                      fontSize: 14, fontWeight: FontWeight.w500),
                ),
                const Icon(Icons.calendar_today_outlined,
                    size: 18, color: Colors.black54),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDatePicker(
      String label, DateTime current, Function(DateTime) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.black)),
        const SizedBox(height: 12),
        InkWell(
          onTap: () async {
            final date = await showDatePicker(
                context: context,
                initialDate: current,
                firstDate: DateTime.now().subtract(const Duration(days: 1)),
                lastDate: DateTime.now().add(const Duration(days: 365)));
            if (date != null) {
              onChanged(date);
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${current.year}-${current.month}-${current.day}',
                  style: GoogleFonts.inter(
                      fontSize: 14, fontWeight: FontWeight.w500),
                ),
                const Icon(Icons.calendar_today_outlined,
                    size: 18, color: Colors.black54),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimePicker(
      String label, TimeOfDay current, Function(TimeOfDay) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.black)),
        const SizedBox(height: 12),
        InkWell(
          onTap: () async {
            final time =
                await showTimePicker(context: context, initialTime: current);
            if (time != null) {
              onChanged(time);
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${current.hour}:${current.minute.toString().padLeft(2, '0')}',
                  style: GoogleFonts.inter(
                      fontSize: 14, fontWeight: FontWeight.w500),
                ),
                const Icon(Icons.access_time_outlined,
                    size: 18, color: Colors.black54),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
