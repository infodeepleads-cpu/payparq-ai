import 'dart:async';

// For kIsWeb
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../../../../theme.dart';
import '../../management/repositories/parking_repository.dart';
import '../../../logic/providers/auth_providers.dart';
import '../../../logic/providers/dashboard_providers.dart';

class UploadCaseForm extends ConsumerStatefulWidget {
  const UploadCaseForm({super.key});

  @override
  ConsumerState<UploadCaseForm> createState() => _UploadCaseFormState();
}

class _UploadCaseFormState extends ConsumerState<UploadCaseForm> {
  final _formKey = GlobalKey<FormState>();
  final _plateController = TextEditingController();
  final _locationController = TextEditingController();
  final _notesController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  XFile? _image;
  String _violationType = 'Illegal Parking';
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    // Pre-fill location from global selection
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final selectedLocId = ref.read(selectedLocationIdProvider);
      if (selectedLocId != null) {
        _locationController.text = selectedLocId;
      }
    });
  }

  @override
  void dispose() {
    _plateController.dispose();
    _locationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final bool isWeb = kIsWeb;
    final XFile? image = await _picker.pickImage(
      source: source,
      imageQuality: isWeb ? 15 : 25,
      maxWidth: isWeb ? 800 : 1024,
      maxHeight: isWeb ? 800 : 1024,
    );
    if (image != null) {
      setState(() {
        _image = image;
      });
    }
  }

  Future<void> _submitCase() async {
    if (!_formKey.currentState!.validate()) return;
    if (_image == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide photographic evidence.')),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      final supabase = Supabase.instance.client;
      final selectedLocId = ref.read(selectedLocationIdProvider);
      final profile = ref.read(userProfileProvider).value;
      final issuerRole =
          profile?['role'] == 'super_admin' ? 'payparq' : 'admin';

      if (selectedLocId == null) {
        throw Exception(
            'No location selected. Please select a lot in the top bar.');
      }

      // Use the centralized UUID resolver
      final locUuid = await ref.read(selectedLocationUuidProvider.future);
      if (locUuid == null) {
        throw Exception('Invalid Location ID. Please reselect the lot.');
      }

      final fileName =
          '${DateTime.now().millisecondsSinceEpoch}_${_plateController.text}.jpg';

      // 0. Add Optimistic Item
      final optimisticViolation = {
        'plate': _plateController.text.toUpperCase(),
        'violation_type': _violationType,
        'fine_amount': 50.00,
        'status': 'issued',
        'location_id': locUuid,
        'evidence_r2_url': null,
        'issued_at': DateTime.now().toIso8601String(),
      };
      ref.read(optimisticViolationsProvider.notifier).update((state) => [
            optimisticViolation,
            ...state,
          ]);

      // 1 & 2. Parallel Upload and DB Insert
      final bytes = await _image!.readAsBytes();
      final issuedAt = DateTime.now().toIso8601String();

      await Future.wait<dynamic>([
        supabase.storage.from('evidence').uploadBinary(
              fileName,
              bytes,
              fileOptions: const FileOptions(contentType: 'image/jpeg'),
            ),
        supabase.from('violations').insert({
          'plate': _plateController.text.toUpperCase(),
          'violation_type': _violationType,
          'fine_amount': 50.00,
          'status': 'issued',
          'location_id': locUuid,
          'evidence_r2_url': fileName,
          'issued_at': issuedAt,
          'issuer_role': issuerRole,
        }),
      ]).timeout(const Duration(seconds: 25));

      ref.invalidate(violationsStreamProvider);

      // 3. Cleanup Optimistic Item
      ref.read(optimisticViolationsProvider.notifier).update((state) => state
          .where((v) => v['plate'] != _plateController.text.toUpperCase())
          .toList());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Case created successfully!')),
        );
        _resetForm();
        // Optional: Navigate back to cases list if desired
        // Navigator.pop(context);
      }
    } catch (e) {
      // Cleanup Optimistic Item on failure
      ref.read(optimisticViolationsProvider.notifier).update((state) => state
          .where((v) => v['plate'] != _plateController.text.toUpperCase())
          .toList());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _resetForm() {
    _plateController.clear();
    _notesController.clear();
    final selectedLocId = ref.read(selectedLocationIdProvider);
    if (selectedLocId != null) {
      _locationController.text = selectedLocId;
    } else {
      _locationController.clear();
    }
    setState(() {
      _image = null;
      _violationType = 'Illegal Parking';
    });
  }

  @override
  Widget build(BuildContext context) {
    // Listen to location changes and update controller
    ref.listen<String?>(selectedLocationIdProvider, (previous, next) {
      if (next != null) {
        _locationController.text = next;
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(48.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Upload Case',
                style: GoogleFonts.inter(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Manually log a violation. Photographic evidence is required.',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 48),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left Column: Form
                  Expanded(
                    flex: 2,
                    child: Column(
                      children: [
                        _buildTextField(
                          label: 'License Plate',
                          controller: _plateController,
                          hint: 'ZG-1234-AB',
                          validator: (v) => v!.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 24),
                        _buildDropdown(),
                        const SizedBox(height: 24),
                        _buildTextField(
                          label: 'Location / Zone',
                          controller: _locationController,
                          hint: 'Zone A, Spot 42',
                          enabled: false, // Fixed to current lot
                        ),
                        const SizedBox(height: 24),
                        _buildTextField(
                          label: 'Officer Notes',
                          controller: _notesController,
                          hint: 'Additional context...',
                          maxLines: 3,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 48),
                  // Right Column: Evidence
                  Expanded(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Evidence',
                          style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const SizedBox(height: 16),
                        GestureDetector(
                          onTap: () => _pickImage(ImageSource.camera),
                          child: Container(
                            height: 300,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: AppTheme.surface,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.border),
                              image: _image != null
                                  ? DecorationImage(
                                      image: NetworkImage(_image!.path),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: _image == null
                                ? Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.camera_alt_outlined,
                                          size: 40, color: Colors.grey[400]),
                                      const SizedBox(height: 12),
                                      Text(
                                        'Capture Photo',
                                        style: TextStyle(
                                            color: Colors.grey[500],
                                            fontWeight: FontWeight.w500),
                                      )
                                    ],
                                  )
                                : null,
                          ),
                        ),
                        if (_image != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: TextButton.icon(
                              onPressed: () => setState(() => _image = null),
                              icon: const Icon(Icons.delete_outline,
                                  size: 18, color: Colors.red),
                              label: const Text('Remove Photo',
                                  style: TextStyle(
                                      color: Colors.red,
                                      fontWeight: FontWeight.bold)),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: 300,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isUploading ? null : _submitCase,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4)),
                  ),
                  child: _isUploading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('Issue Citation',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    String? hint,
    int maxLines = 1,
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
          maxLines: maxLines,
          validator: validator,
          enabled: enabled,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400]),
            filled: true,
            fillColor: enabled ? AppTheme.surface : Colors.grey[100],
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

  Widget _buildDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Violation Type',
            style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.black)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(8),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _violationType,
              isExpanded: true,
              style: GoogleFonts.inter(
                  color: Colors.black,
                  fontSize: 14,
                  fontWeight: FontWeight.w500),
              items: [
                'Illegal Parking',
                'Time Expired',
                'Blocking Driveway',
                'Handicap Zone',
                'Fire Hydrant'
              ].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: (v) => setState(() => _violationType = v!),
            ),
          ),
        ),
      ],
    );
  }
}
