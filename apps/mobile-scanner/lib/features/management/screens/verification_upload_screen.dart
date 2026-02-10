import 'dart:async';
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
import '../../../../theme.dart';
import '../../../logic/providers/locale_provider.dart';

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
  List<String> _existingPhotoUrls = [];

  // Removed call scheduling state
  @override
  void initState() {
    super.initState();
    final photos = widget.location['verification_photos'];
    if (photos is List) {
      _existingPhotoUrls = photos.map((e) => e.toString()).toList();
    }
  }

  Future<void> _pickImage() async {
    if (_selectedImages.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 5 photos allowed.')),
      );
      return;
    }

    const bool isWeb = kIsWeb;
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: isWeb ? 15 : 25,
      maxWidth: isWeb ? 800 : 1024,
      maxHeight: isWeb ? 800 : 1024,
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

    const bool isWeb = kIsWeb;
    final List<XFile> images = await _picker.pickMultiImage(
      imageQuality: isWeb ? 15 : 25,
      maxWidth: isWeb ? 800 : 1024,
      maxHeight: isWeb ? 800 : 1024,
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
      ui.Image image = await boundary.toImage(pixelRatio: 6.0);
      ByteData? byteData =
          await image.toByteData(format: ui.ImageByteFormat.png);
      Uint8List pngBytes = byteData!.buffer.asUint8List();

      if (kIsWeb) {
        downloadFileWeb(
            pngBytes, "parking_sign_${widget.location['display_id']}.png");
      } else {
        // Handle mobile download if needed, but the user is likely on web
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Download only supported on Web for now.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(Lang.sel(
                  ref.read(localeIsCroatianProvider),
                  'Error generating sign: $e',
                  'Greška pri generiranju znaka: $e'))),
        );
      }
    }
  }

  Future<void> _submitVerification() async {
    if (_selectedImages.length < 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(Lang.sel(
                ref.read(localeIsCroatianProvider),
                'Please upload at least 3 photos.',
                'Prenesite najmanje 3 fotografije.'))),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      final supabase = Supabase.instance.client;
      final locationId = widget.location['id'];
      // Parallel Upload for Speed
      final List<Future<String>> uploadFutures = [];

      for (var i = 0; i < _selectedImages.length; i++) {
        final image = _selectedImages[i];

        uploadFutures.add(() async {
          final bytes = await image.readAsBytes();

          String fileExt = 'jpg';
          if (image.name.contains('.')) {
            fileExt = image.name.split('.').last.toLowerCase();
          } else if (image.path.contains('.')) {
            fileExt = image.path.split('.').last.toLowerCase();
          }

          if (!['jpg', 'jpeg', 'png', 'webp'].contains(fileExt)) {
            fileExt = 'jpg';
          }

          final String mimeType = fileExt == 'jpg' || fileExt == 'jpeg'
              ? 'image/jpeg'
              : 'image/$fileExt';

          final fileName =
              '${locationId}_${DateTime.now().millisecondsSinceEpoch}_$i.$fileExt';

          await supabase.storage.from('location-verification').uploadBinary(
                fileName,
                bytes,
                fileOptions: FileOptions(contentType: mimeType, upsert: true),
              );

          return supabase.storage
              .from('location-verification')
              .getPublicUrl(fileName);
        }());
      }

      final List<String> uploadedUrls =
          await Future.wait(uploadFutures).timeout(const Duration(seconds: 40));

      await supabase.from('locations').update({
        'verification_status': 'pending',
        'verification_photos': uploadedUrls,
        'verification_submitted_at': DateTime.now().toIso8601String(),
      }).eq('id', locationId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(Lang.sel(
                ref.read(localeIsCroatianProvider),
                'Verification submitted successfully!',
                'Verifikacija uspješno poslana!')),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(Lang.sel(
                ref.read(localeIsCroatianProvider), 'Error: $e', 'Greška: $e')),
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
    final isHr = ref.watch(localeIsCroatianProvider);
    final String displayId = widget.location['display_id'] ?? 'N/A';
    final String status =
        widget.location['verification_status'] ?? 'unverified';
    final String stripeUrl =
        'https://iafjygownkhedereaoxw.supabase.co/functions/v1/create-checkout?location_id=$displayId&type=hourly';
    final isNarrow = MediaQuery.of(context).size.width < 900;

    // Determine what to show based on status
    final bool showPhotosOnly = status == 'unverified';
    final bool isPending = status == 'pending';
    final bool isVerified = status == 'verified';
    // Removed call scheduling status

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        title: Text(
          Lang.sel(isHr, 'Verify Lot: ${widget.location['name']}',
              'Verifikacija lokacije: ${widget.location['name']}'),
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              Navigator.pushReplacementNamed(context, '/');
            }
          },
        ),
        actions: const [SizedBox(width: 16)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            if (isPending)
              _buildStatusBanner(
                Icons.hourglass_empty,
                Colors.orange,
                Lang.sel(isHr, 'Verification Pending', 'Verifikacija u tijeku'),
                Lang.sel(
                    isHr,
                    'We are currently reviewing your photos. This usually takes 24-48 hours.',
                    'Trenutno pregledavamo vaše fotografije. Obično traje 24–48 sati.'),
              )
            else if (isVerified)
              _buildStatusBanner(
                Icons.verified,
                Colors.green,
                Lang.sel(isHr, 'Lot Verified', 'Lokacija verificirana'),
                Lang.sel(
                    isHr,
                    'Your lot has been successfully verified. You can now start managing sessions.',
                    'Vaša lokacija je uspješno verificirana. Sada možete upravljati sesijama.'),
              )
            else
              isNarrow
                  ? Column(
                      children: [
                        _buildSignColumn(displayId, stripeUrl),
                        const SizedBox(height: 48),
                        if (showPhotosOnly) _buildUploadColumn(),
                      ],
                    )
                  : Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 1,
                          child: Column(
                            children: [
                              if (showPhotosOnly) _buildUploadColumn(),
                            ],
                          ),
                        ),
                        const SizedBox(width: 48),
                        Expanded(
                          flex: 1,
                          child: _buildSignColumn(displayId, stripeUrl),
                        ),
                      ],
                    ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBanner(
      IconData icon, Color color, String title, String subtitle) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 64),
          const SizedBox(height: 16),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 16,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  // Removed call scheduling section and picker button

  Widget _buildUploadColumn() {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.grey.withValues(alpha: 0.15),
            ),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: Colors.grey[700]),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  Lang.sel(
                      isHr,
                      'Please upload 3-5 high-quality photos of your lot showing our signage clearly.',
                      'Prenesite 3–5 fotografija visoke kvalitete koje jasno prikazuju naše oznake na lokaciji.'),
                  style: GoogleFonts.inter(
                    color: Colors.black87,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        if (_existingPhotoUrls.isNotEmpty) ...[
          Text(
            Lang.sel(isHr, 'Previously Uploaded (${_existingPhotoUrls.length})',
                'Prethodno prenesene (${_existingPhotoUrls.length})'),
            style: GoogleFonts.inter(
              color: Colors.black,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: _existingPhotoUrls.length,
            itemBuilder: (context, index) {
              return Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                  image: DecorationImage(
                    image: NetworkImage(_existingPhotoUrls[index]),
                    fit: BoxFit.cover,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 32),
        ],
        Text(
          Lang.sel(isHr, 'Upload Photos (${_selectedImages.length}/5)',
              'Prenesite fotografije (${_selectedImages.length}/5)'),
          style: GoogleFonts.inter(
            color: Colors.black,
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
                    backgroundColor: Colors.white,
                    shape: const RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    builder: (context) => SafeArea(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ListTile(
                            leading: const Icon(Icons.camera_alt),
                            title: Text(Lang.sel(
                                isHr, 'Take Photo', 'Snimi fotografiju')),
                            onTap: () {
                              Navigator.pop(context);
                              _pickImage();
                            },
                          ),
                          ListTile(
                            leading: const Icon(Icons.photo_library),
                            title: Text(Lang.sel(isHr, 'Choose from Gallery',
                                'Odaberi iz galerije')),
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
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
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
                    border: Border.all(color: AppTheme.border),
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
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: _isUploading
                ? const CircularProgressIndicator(color: Colors.white)
                : Text(
                    Lang.sel(isHr, 'Submit for Verification',
                        'Pošalji na verifikaciju'),
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              Lang.sel(isHr, 'Cancel & Go Back', 'Odustani i vrati se'),
              style: GoogleFonts.inter(
                color: AppTheme.textSecondary,
                fontSize: 14,
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
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        LayoutBuilder(builder: (context, constraints) {
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
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
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
        child: Stack(
          children: [
            Positioned.fill(
              child: Image.asset(
                'assets/images/sign_template_v2.png',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stack) => Container(
                  color: Colors.white,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.image_not_supported,
                          color: Colors.grey, size: 48),
                      const SizedBox(height: 8),
                      Text(
                        'Template not found',
                        style:
                            GoogleFonts.inter(color: Colors.grey, fontSize: 12),
                      ),
                      Text(
                        'assets/images/your_photo.png',
                        style:
                            GoogleFonts.inter(color: Colors.grey, fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              top: 48,
              left: 0,
              right: 0,
              height: 56,
              child: Center(
                child: Text(
                  widget.location['name'].toString().toUpperCase(),
                  style: GoogleFonts.montserrat(
                    color: Colors.black,
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.8,
                  ),
                ),
              ),
            ),
            Align(
              alignment: const Alignment(0, 0.28),
              child: SizedBox(
                width: 180,
                height: 180,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    QrImageView(
                      data: stripeUrl,
                      version: QrVersions.auto,
                      size: 120.0,
                      eyeStyle: const QrEyeStyle(
                        eyeShape: QrEyeShape.square,
                        color: Colors.black,
                      ),
                      dataModuleStyle: const QrDataModuleStyle(
                        dataModuleShape: QrDataModuleShape.square,
                        color: Colors.black,
                      ),
                    ),
                    Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'P',
                        style: GoogleFonts.montserrat(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Padding(
                  padding: const EdgeInsets.only(left: 52, bottom: 4),
                  child: Text(
                    displayId,
                    style: GoogleFonts.inter(
                      color: Colors.black,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class QrFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;

    const length = 40.0;
    const radius = 24.0;

    // Top Left
    canvas.drawPath(
      Path()
        ..moveTo(0, length)
        ..lineTo(0, radius)
        ..arcToPoint(const Offset(radius, 0),
            radius: const Radius.circular(radius))
        ..lineTo(length, 0),
      paint,
    );

    // Top Right
    canvas.drawPath(
      Path()
        ..moveTo(size.width - length, 0)
        ..lineTo(size.width - radius, 0)
        ..arcToPoint(Offset(size.width, radius),
            radius: const Radius.circular(radius))
        ..lineTo(size.width, length),
      paint,
    );

    // Bottom Right
    canvas.drawPath(
      Path()
        ..moveTo(size.width, size.height - length)
        ..lineTo(size.width, size.height - radius)
        ..arcToPoint(Offset(size.width - radius, size.height),
            radius: const Radius.circular(radius))
        ..lineTo(size.width - length, size.height),
      paint,
    );

    // Bottom Left
    canvas.drawPath(
      Path()
        ..moveTo(length, size.height)
        ..lineTo(radius, size.height)
        ..arcToPoint(Offset(0, size.height - radius),
            radius: const Radius.circular(radius))
        ..lineTo(0, size.height - length),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
