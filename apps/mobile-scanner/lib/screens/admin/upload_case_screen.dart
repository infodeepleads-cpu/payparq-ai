import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../logic/providers/locale_provider.dart';

class UploadCaseScreen extends ConsumerStatefulWidget {
  const UploadCaseScreen({super.key});

  @override
  ConsumerState<UploadCaseScreen> createState() => _UploadCaseScreenState();
}

class _UploadCaseScreenState extends ConsumerState<UploadCaseScreen> {
  final ImagePicker _picker = ImagePicker();
  XFile? _image;
  bool _isUploading = false;

  Future<void> _pickImage(ImageSource source) async {
    final XFile? image = await _picker.pickImage(
      source: source,
      imageQuality: 25,
      maxWidth: 1024,
      maxHeight: 1024,
    );
    if (image != null) {
      setState(() {
        _image = image;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              Lang.sel(isHr, 'Upload Case', 'Prenesi predmet'),
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              Lang.sel(isHr, 'Create a new enforcement case by uploading evidence.',
                  'Kreirajte novi predmet nadzora prijenosom dokaza.'),
              style: GoogleFonts.inter(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 32),
            
            // Upload Area
            Expanded(
              child: Center(
                child: _image == null 
                  ? _buildUploadPlaceholder() 
                  : _buildImagePreview(),
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Submit Button
            if (_image != null)
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isUploading ? null : _uploadEvidence,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isUploading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2),
                        )
                      : Text(Lang.sel(isHr, 'Submit Case', 'Predaj predmet')),
                ),
              ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _pickImage(ImageSource.camera),
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.camera_alt, color: Colors.white),
        label: Text(Lang.sel(isHr, 'Open Camera', 'Otvori kameru'),
            style: const TextStyle(color: Colors.white)),
      ),
    );
  }

  Widget _buildUploadPlaceholder() {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Container(
      width: double.infinity,
      height: 400,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 2),
        // dash pattern simulated by standard border for now
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.cloud_upload_outlined,
              size: 48,
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            Lang.sel(isHr, 'Drag & drop or click to upload',
                'Povucite i ispustite ili kliknite za prijenos'),
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            Lang.sel(isHr, 'Support for JPG, PNG', 'Podrška za JPG, PNG'),
            style: GoogleFonts.inter(
              color: Colors.grey[500],
            ),
          ),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: () => _pickImage(ImageSource.gallery),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primary,
              side: const BorderSide(color: AppTheme.primary),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(Lang.sel(isHr, 'Select File', 'Odaberi datoteku')),
          ),
        ],
      ),
    );
  }

  Widget _buildImagePreview() {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          height: 400,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB)),
            image: DecorationImage(
              image: NetworkImage(_image!.path), // Works for web XFile
              fit: BoxFit.cover,
            ),
          ),
        ),
        const SizedBox(height: 16),
        TextButton.icon(
          onPressed: () {
            setState(() {
              _image = null;
            });
          },
          icon: const Icon(Icons.delete, color: Colors.red),
          label: Text(Lang.sel(isHr, 'Remove Image', 'Ukloni sliku'),
              style: const TextStyle(color: Colors.red)),
        ),
      ],
    );
  }

  Future<void> _uploadEvidence() async {
    final isHr = ref.read(localeIsCroatianProvider);
    if (_image == null) return;
    setState(() => _isUploading = true);
    try {
      final bytes = await _image!.readAsBytes();
      final ts = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'evidence_$ts.jpg';
      await Supabase.instance.client.storage
          .from('evidence')
          .uploadBinary(fileName, bytes, fileOptions: const FileOptions(contentType: 'image/jpeg'));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(Lang.sel(isHr, 'Evidence uploaded', 'Dokaz prenesen'))),
        );
        setState(() {
          _image = null;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(Lang.sel(isHr, 'Error: $e', 'Greška: $e'))),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }
}
