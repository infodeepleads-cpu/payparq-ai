import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:payparq_scanner/utils/web_download_helper.dart';

class VerificationUploadScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> location;

  const VerificationUploadScreen({
    super.key,
    required this.location,
  });

  @override
  ConsumerState<VerificationUploadScreen> createState() =>
      _VerificationUploadScreenState();
}

class _VerificationUploadScreenState
    extends ConsumerState<VerificationUploadScreen> {
  final List<XFile> _selectedImages = [];
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;
  final GlobalKey _signKey = GlobalKey();

  Future<void> _pickImage() async {
    if (_selectedImages.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 5 photos allowed.')),
      );
      return;
    }

    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
    );

    if (image != null) {
      setState(() {
        _selectedImages.add(image);
      });
    }
  }

  Future<void> _pickFromGallery() async {
    if (_selectedImages.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 5 photos allowed.')),
      );
      return;
    }

    final List<XFile> images = await _picker.pickMultiImage(
      imageQuality: 70,
    );

    if (images.isNotEmpty) {
      setState(() {
        _selectedImages.addAll(images.take(5 - _selectedImages.length));
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Future<void> _downloadSign() async {
    try {
      RenderRepaintBoundary boundary =
          _signKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      ByteData? byteData =
          await image.toByteData(format: ui.ImageByteFormat.png);
      Uint8List pngBytes = byteData!.buffer.asUint8List();

      if (kIsWeb) {
        downloadFileWeb(
            pngBytes, "parking_sign_${widget.location['display_id']}.png");
      } else {
        // Handle mobile download if needed, but the user is likely on web
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Download only supported on Web for now.')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error generating sign: $e')),
      );
    }
  }

  Future<void> _submitVerification() async {
    if (_selectedImages.length < 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload at least 3 photos.')),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      final supabase = Supabase.instance.client;
      final locationId = widget.location['id'];
      final List<String> uploadedUrls = [];

      for (var i = 0; i < _selectedImages.length; i++) {
        final image = _selectedImages[i];
        final bytes = await image.readAsBytes();

        // Better extension handling
        String fileExt = 'jpg';
        if (image.name.contains('.')) {
          fileExt = image.name.split('.').last.toLowerCase();
        } else if (image.path.contains('.')) {
          fileExt = image.path.split('.').last.toLowerCase();
        }

        // Ensure valid extension for Supabase
        if (!['jpg', 'jpeg', 'png', 'webp'].contains(fileExt)) {
          fileExt = 'jpg';
        }

        final fileName =
            '${locationId}_${DateTime.now().millisecondsSinceEpoch}_$i.$fileExt';
        final path = fileName;

        debugPrint('Uploading image $i: $path (size: ${bytes.length} bytes)');

        try {
          await supabase.storage.from('location-verification').uploadBinary(
                path,
                bytes,
                fileOptions:
                    FileOptions(contentType: 'image/$fileExt', upsert: true),
              );
          debugPrint('Upload success for image $i');
        } catch (storageErr) {
          debugPrint('Storage error for image $i: $storageErr');
          rethrow;
        }

        final String publicUrl =
            supabase.storage.from('location-verification').getPublicUrl(path);
        uploadedUrls.add(publicUrl);
      }

      await supabase.from('locations').update({
        'verification_status': 'pending',
        'verification_photos': uploadedUrls,
        'verification_submitted_at': DateTime.now().toIso8601String(),
      }).eq('id', locationId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verification submitted successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final String displayId = widget.location['display_id'] ?? 'N/A';
    final String stripeUrl =
        'https://iafjygownkhedereaoxw.supabase.co/functions/v1/create-checkout?location_id=$displayId&type=hourly';
    final isNarrow = MediaQuery.of(context).size.width < 900;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: Text(
          'Verify Lot: ${widget.location['name']}',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: isNarrow
            ? Column(
                children: [
                  _buildSignColumn(displayId, stripeUrl),
                  const SizedBox(height: 48),
                  _buildUploadColumn(),
                ],
              )
            : Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 1, child: _buildUploadColumn()),
                  const SizedBox(width: 48),
                  Expanded(
                      flex: 1, child: _buildSignColumn(displayId, stripeUrl)),
                ],
              ),
      ),
    );
  }

  Widget _buildUploadColumn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.orange.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.orange.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: Colors.orange),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'Please upload 3-5 high-quality photos of your lot showing our signage clearly.',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        Text(
          'Upload Photos (${_selectedImages.length}/5)',
          style: GoogleFonts.inter(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount:
              _selectedImages.length < 5 ? _selectedImages.length + 1 : 5,
          itemBuilder: (context, index) {
            if (index == _selectedImages.length && _selectedImages.length < 5) {
              return InkWell(
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    backgroundColor: const Color(0xFF1A1A1A),
                    builder: (context) => SafeArea(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ListTile(
                            leading: const Icon(Icons.camera_alt,
                                color: Colors.white),
                            title: const Text('Take Photo',
                                style: TextStyle(color: Colors.white)),
                            onTap: () {
                              Navigator.pop(context);
                              _pickImage();
                            },
                          ),
                          ListTile(
                            leading: const Icon(Icons.photo_library,
                                color: Colors.white),
                            title: const Text('Choose from Gallery',
                                style: TextStyle(color: Colors.white)),
                            onTap: () {
                              Navigator.pop(context);
                              _pickFromGallery();
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A1A1A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.withOpacity(0.3)),
                  ),
                  child: const Icon(Icons.add_a_photo, color: Colors.grey),
                ),
              );
            }

            return Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    image: DecorationImage(
                      image: kIsWeb
                          ? NetworkImage(_selectedImages[index].path)
                          : FileImage(File(_selectedImages[index].path))
                              as ImageProvider,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: InkWell(
                    onTap: () => _removeImage(index),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.black54,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close,
                          size: 16, color: Colors.white),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 48),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _isUploading ? null : _submitVerification,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isUploading
                ? const CircularProgressIndicator(color: Colors.black)
                : Text(
                    'Submit for Verification',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildSignColumn(String displayId, String stripeUrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          'Your Parking Sign',
          style: GoogleFonts.inter(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        // Wrap RepaintBoundary in a SingleChildScrollView or similar to avoid overflow if needed,
        // but mainly we want to ensure it fits.
        // For mobile, we might want to scale it down visually but keep pixel density for download.
        LayoutBuilder(builder: (context, constraints) {
          // If screen is narrow, we might need to scale the preview down
          final double scale =
              constraints.maxWidth < 400 ? constraints.maxWidth / 400 : 1.0;

          if (scale < 1.0) {
            return Transform.scale(
              scale: scale,
              alignment: Alignment.topCenter,
              child: _buildSignContent(displayId, stripeUrl),
            );
          }
          return _buildSignContent(displayId, stripeUrl);
        }),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: _downloadSign,
          icon: const Icon(Icons.download),
          label: const Text('Download Sign'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSignContent(String displayId, String stripeUrl) {
    return RepaintBoundary(
      key: _signKey,
      child: Container(
        width: 400,
        height: 600,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Container(
              height: 60,
              alignment: Alignment.center,
              child: Text(
                widget.location['name'].toString().toUpperCase(),
                style: GoogleFonts.inter(
                  color: Colors.black,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            Expanded(
              child: Container(
                width: double.infinity,
                color: const Color(0xFF111111),
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      children: [
                        Text(
                          'Safe parking',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                                width: 30, height: 1, color: Colors.white54),
                            const SizedBox(width: 12),
                            Text(
                              'WITH',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                                width: 30, height: 1, color: Colors.white54),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'payparq',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 48,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -1,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      width: 220,
                      height: 220,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      padding: const EdgeInsets.all(20),
                      child: QrImageView(
                        data: stripeUrl,
                        version: QrVersions.auto,
                        size: 200.0,
                      ),
                    ),
                    Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Scan to ',
                              style: GoogleFonts.inter(
                                  color: Colors.white, fontSize: 18),
                            ),
                            Text(
                              'stripe',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            Container(
              height: 40,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              alignment: Alignment.centerLeft,
              child: Row(
                children: [
                  Text(
                    'ID ',
                    style: GoogleFonts.inter(
                      color: Colors.black,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    displayId,
                    style: GoogleFonts.inter(
                      color: Colors.black,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
