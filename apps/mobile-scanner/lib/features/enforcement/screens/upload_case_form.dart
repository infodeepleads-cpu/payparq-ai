import 'dart:async';

// For kIsWeb
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart';
import '../../../../theme.dart';
import '../providers/enforcement_controller.dart';
import '../../../logic/providers/auth_providers.dart';
import '../../../logic/providers/locale_provider.dart';
import '../../../logic/utils/location_resolver.dart';
import '../../../services/error_mapper.dart';
import '../../../utils/async_action_handler.dart';

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
    const bool isWeb = kIsWeb;
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
        SnackBar(
            content: Text(Lang.sel(
                ref.read(localeIsCroatianProvider),
                'Please provide photographic evidence.',
                'Molimo priložite fotografijski dokaz.'))),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      final profile = ref.read(userProfileProvider).value;
      final issuerRole =
          profile?['role'] == 'super_admin' ? 'payparq' : 'admin';
      final resolution = await LocationResolver.resolve(ref);
      final selectedLocId = resolution.effectiveDisplayId;

      if (selectedLocId == null) {
        throw Exception(
            'No location selected. Please select a lot in the top bar.');
      }

      final locationUuid = resolution.uuid ?? resolution.fallbackId;
      if (locationUuid == null) {
        throw Exception('Invalid Location ID. Please reselect the lot.');
      }

      final bytes = await _image!.readAsBytes();
      if (!mounted) return;
      final controller = ref.read(enforcementControllerProvider);
      await AsyncActionHandler.run<void>(
        context: context,
        action: () => controller.createCase(
          plate: _plateController.text.toUpperCase(),
          violationType: _violationType,
          locationUuid: locationUuid,
          bytes: bytes,
          issuerRole: issuerRole,
        ),
        successMessage: Lang.sel(ref.read(localeIsCroatianProvider),
            'Case created successfully!', 'Predmet je uspješno kreiran!'),
        errorBuilder: ErrorMapper.message,
      );
      if (mounted) {
        _resetForm();
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
    final isHr = ref.watch(localeIsCroatianProvider);
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
                Lang.sel(isHr, 'Upload Case', 'Prenesi predmet'),
                style: GoogleFonts.inter(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                Lang.sel(
                    isHr,
                    'Manually log a violation. Photographic evidence is required.',
                    'Ručni unos prekršaja. Potreban je fotografijski dokaz.'),
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
                          label: Lang.sel(
                              isHr, 'License Plate', 'Registarska oznaka'),
                          controller: _plateController,
                          hint: Lang.sel(isHr, 'MA679XX', 'MA679XX'),
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(
                                RegExp(r'[A-Z0-9]'))
                          ],
                          textCapitalization: TextCapitalization.characters,
                          validator: (v) => v!.isEmpty
                              ? Lang.sel(isHr, 'Required', 'Obavezno')
                              : null,
                        ),
                        const SizedBox(height: 24),
                        _buildDropdown(),
                        const SizedBox(height: 24),
                        _buildTextField(
                          label: Lang.sel(
                              isHr, 'Location / Zone', 'Lokacija / zona'),
                          controller: _locationController,
                          hint: Lang.sel(
                              isHr, 'Zone A, Spot 42', 'Zona A, Mjesto 42'),
                          enabled: false, // Fixed to current lot
                        ),
                        const SizedBox(height: 24),
                        _buildTextField(
                          label: Lang.sel(
                              isHr, 'Officer Notes', 'Bilješke službenika'),
                          controller: _notesController,
                          hint: Lang.sel(isHr, 'Additional context...',
                              'Dodatni kontekst...'),
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
                          Lang.sel(isHr, 'Evidence', 'Dokaz'),
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
                                        Lang.sel(isHr, 'Capture Photo',
                                            'Snimi fotografiju'),
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
                              label: Text(
                                Lang.sel(
                                    isHr, 'Remove Photo', 'Ukloni fotografiju'),
                                style: const TextStyle(
                                    color: Colors.red,
                                    fontWeight: FontWeight.bold),
                              ),
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
                      : Text(
                          Lang.sel(isHr, 'Issue Citation', 'Izdaj kaznu'),
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold),
                        ),
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
    List<TextInputFormatter>? inputFormatters,
    TextCapitalization textCapitalization = TextCapitalization.none,
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
          inputFormatters: inputFormatters,
          textCapitalization: textCapitalization,
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
    final isHr = ref.watch(localeIsCroatianProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(Lang.sel(isHr, 'Violation Type', 'Vrsta prekršaja'),
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
              ]
                  .map((e) => DropdownMenuItem(
                        value: e,
                        child: Text({
                              'Illegal Parking': Lang.sel(isHr,
                                  'Illegal Parking', 'Nepropisno parkiranje'),
                              'Time Expired': Lang.sel(
                                  isHr, 'Time Expired', 'Isteklo vrijeme'),
                              'Blocking Driveway': Lang.sel(isHr,
                                  'Blocking Driveway', 'Zatvaranje prilaza'),
                              'Handicap Zone': Lang.sel(isHr, 'Handicap Zone',
                                  'Mjesto za osobe s invaliditetom'),
                              'Fire Hydrant': Lang.sel(
                                  isHr, 'Fire Hydrant', 'Protupožarni hidrant'),
                            }[e] ??
                            e),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _violationType = v!),
            ),
          ),
        ),
      ],
    );
  }
}
