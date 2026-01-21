import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../theme.dart';

class AddPassScreen extends StatefulWidget {
  const AddPassScreen({super.key});

  @override
  State<AddPassScreen> createState() => _AddPassScreenState();
}

class _AddPassScreenState extends State<AddPassScreen> {
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isProcessing = true);
    
    try {
      final supabase = Supabase.instance.client;
      
      final Map<String, dynamic> data = {
        'plate': _plateController.text.toUpperCase(),
        'type': _type,
        'contact_name': _nameController.text,
        'contact_phone': _phoneController.text,
        'contact_email': _emailController.text,
        'location_id': _locationController.text,
        'start_time': _startDate.toIso8601String(),
        'end_time': _endDate.toIso8601String(),
        'status': 'active',
        'daily_duration_hours': _type == 'subscription' ? _dailyDurationHours.toInt() : null,
      };
      
      if (_type == 'subscription' && !_is24_7) {
        data['daily_start_time'] = '${_dailyStart.hour}:${_dailyStart.minute}:00';
        data['daily_end_time'] = '${_dailyEnd.hour}:${_dailyEnd.minute}:00';
      }
      
      await supabase.from('parking_permits').insert(data);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${_type == 'pass' ? 'Guest Pass' : 'Subscription'} Added!'),
            backgroundColor: Colors.green,
          ),
        );
        _resetForm();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _resetForm() {
    _plateController.clear();
    _nameController.clear();
    _phoneController.clear();
    _emailController.clear();
    _locationController.clear();
    setState(() {
      _startDate = DateTime.now();
      _endDate = DateTime.now().add(const Duration(hours: 24));
    });
  }
  
  void _updateSubscriptionDates() {
    if (_type == 'subscription') {
      setState(() {
        _endDate = _startDate.add(Duration(days: 30 * _subscriptionDurationMonths));
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Add User Access',
                style: GoogleFonts.inter(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Issue temporary passes or ongoing subscriptions.',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 32),
              
              // Type Toggle
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    _buildTypeButton('Parking Pass', 'pass'),
                    _buildTypeButton('Subscription', 'subscription'),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left: Basic Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('User Details', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'License Plate',
                          controller: _plateController,
                          hint: 'ZG-1234-AB',
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Location ID',
                          controller: _locationController,
                          hint: 'LOC-001',
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Name',
                          controller: _nameController,
                          hint: 'John Doe',
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Phone',
                          controller: _phoneController,
                          hint: '+1 555 010 9999',
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Email (Optional)',
                          controller: _emailController,
                          hint: 'john@example.com',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 32),
                  // Right: Duration & Access
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                         Text('Access Control', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                         const SizedBox(height: 16),
                         
                         if (_type == 'pass') ...[
                           _buildDateTimePicker('Start Time', _startDate, (d) => setState(() => _startDate = d)),
                           const SizedBox(height: 16),
                           _buildDateTimePicker('End Time', _endDate, (d) => setState(() => _endDate = d)),
                           const SizedBox(height: 16),
                           // Duration Helper
                           Text('Duration: ${_endDate.difference(_startDate).inHours} hours', style: TextStyle(color: Colors.grey[600])),
                         ] else ...[
                           _buildDatePicker('Start Date', _startDate, (d) {
                             setState(() {
                               _startDate = d;
                               _updateSubscriptionDates();
                             });
                           }),
                           const SizedBox(height: 16),
                           
                           // Daily Duration Slider (1-24h)
                           Text('Daily Limit: ${_dailyDurationHours.toInt()} Hours', style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
                           Slider(
                             value: _dailyDurationHours,
                             min: 1,
                             max: 24,
                             divisions: 23,
                             label: '${_dailyDurationHours.toInt()} h',
                             activeColor: AppTheme.primary,
                             onChanged: (v) => setState(() => _dailyDurationHours = v),
                           ),
                           const SizedBox(height: 16),

                           DropdownButtonFormField<int>(
                             value: _subscriptionDurationMonths,
                             decoration: InputDecoration(
                               labelText: 'Duration',
                               border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                             ),
                             items: [1, 3, 6, 12].map((m) => DropdownMenuItem(value: m, child: Text('$m Month${m > 1 ? 's' : ''}'))).toList(),
                             onChanged: (v) {
                               setState(() {
                                 _subscriptionDurationMonths = v!;
                                 _updateSubscriptionDates();
                               });
                             },
                           ),
                           const SizedBox(height: 8),
                           Text('Valid until: ${_endDate.toString().split(' ')[0]}', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                           const SizedBox(height: 24),
                           
                           CheckboxListTile(
                             title: const Text('24/7 Access'),
                             value: _is24_7,
                             onChanged: (v) => setState(() => _is24_7 = v!),
                             controlAffinity: ListTileControlAffinity.leading,
                             contentPadding: EdgeInsets.zero,
                           ),
                           
                           if (!_is24_7) ...[
                             Row(
                               children: [
                                 Expanded(child: _buildTimePicker('From', _dailyStart, (t) => setState(() => _dailyStart = t))),
                                 const SizedBox(width: 16),
                                 Expanded(child: _buildTimePicker('To', _dailyEnd, (t) => setState(() => _dailyEnd = t))),
                               ],
                             ),
                           ],
                         ],
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isProcessing
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('Add ${_type == 'pass' ? 'Guest Pass' : 'Subscription'}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected ? [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)] : null,
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              color: isSelected ? Colors.black : Colors.grey[600],
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
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400]),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey[300]!)),
          ),
        ),
      ],
    );
  }
  
  Widget _buildDateTimePicker(String label, DateTime current, Function(DateTime) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
        const SizedBox(height: 8),
        InkWell(
          onTap: () async {
            final date = await showDatePicker(context: context, initialDate: current, firstDate: DateTime.now().subtract(const Duration(days: 1)), lastDate: DateTime.now().add(const Duration(days: 365)));
            if (date != null) {
              final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(current));
              if (time != null) {
                onChanged(DateTime(date.year, date.month, date.day, time.hour, time.minute));
              }
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${current.year}-${current.month}-${current.day} ${current.hour}:${current.minute.toString().padLeft(2, '0')}'),
                const Icon(Icons.calendar_today, size: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDatePicker(String label, DateTime current, Function(DateTime) onChanged) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
          const SizedBox(height: 8),
          InkWell(
            onTap: () async {
              final date = await showDatePicker(context: context, initialDate: current, firstDate: DateTime.now().subtract(const Duration(days: 1)), lastDate: DateTime.now().add(const Duration(days: 365)));
              if (date != null) {
                onChanged(date);
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${current.year}-${current.month}-${current.day}'),
                  const Icon(Icons.calendar_today, size: 16),
                ],
              ),
            ),
          ),
        ],
      );
    }
    
    Widget _buildTimePicker(String label, TimeOfDay current, Function(TimeOfDay) onChanged) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
          const SizedBox(height: 8),
          InkWell(
            onTap: () async {
              final time = await showTimePicker(context: context, initialTime: current);
              if (time != null) {
                onChanged(time);
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${current.hour}:${current.minute.toString().padLeft(2, '0')}'),
                  const Icon(Icons.access_time, size: 16),
                ],
              ),
            ),
          ),
        ],
      );
    }
}
