import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../theme.dart';

class VerificationVideoScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> location;

  const VerificationVideoScreen({
    super.key,
    required this.location,
  });

  @override
  ConsumerState<VerificationVideoScreen> createState() =>
      _VerificationVideoScreenState();
}

class _VerificationVideoScreenState
    extends ConsumerState<VerificationVideoScreen> {
  XFile? _selectedVideo;
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;
  static final RegExp _uuidRegex = RegExp(
      r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
      caseSensitive: false);

  Future<void> _pickVideo() async {
    final XFile? video = await _picker.pickVideo(
      source: ImageSource.camera,
      maxDuration: const Duration(seconds: 30),
    );

    if (video != null) {
      setState(() {
        _selectedVideo = video;
      });
    }
  }

  Future<void> _pickFromGallery() async {
    final XFile? video = await _picker.pickVideo(
      source: ImageSource.gallery,
      maxDuration: const Duration(seconds: 30),
    );

    if (video != null) {
      setState(() {
        _selectedVideo = video;
      });
    }
  }

  Future<void> _submitVideo() async {
    if (_selectedVideo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or record a video first.')),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      final supabase = Supabase.instance.client;
      final String? locationId = widget.location['id'] as String?;
      final String? displayId = widget.location['display_id'] as String?;
      final bytes = await _selectedVideo!.readAsBytes();

      String fileExt = 'mp4';
      if (_selectedVideo!.name.contains('.')) {
        fileExt = _selectedVideo!.name.split('.').last.toLowerCase();
      }

      // Normalize content type
      final contentType =
          (fileExt == 'mp4' || fileExt == 'mov' || fileExt == 'webm')
              ? 'video/$fileExt'
              : 'video/mp4';

      // Basic validation to avoid invalid storage requests
      if (!['mp4', 'mov', 'webm'].contains(fileExt)) {
        throw Exception('Unsupported video format: $fileExt');
      }
      if (bytes.length > 15 * 1024 * 1024) {
        throw Exception('Video too large. Please upload under 15MB.');
      }

      final folderId = (displayId ?? locationId ?? 'unknown').toString();
      final fileName =
          '${folderId}_video_${DateTime.now().millisecondsSinceEpoch}.$fileExt';
      // Use the same bucket as photo verification to match existing policies
      await supabase.storage.from('location-verification').uploadBinary(
            fileName,
            bytes,
            fileOptions: FileOptions(contentType: contentType, upsert: true),
          );

      final String publicUrl =
          supabase.storage.from('location-verification').getPublicUrl(fileName);

      // Update location with video URL
      final updatePayload = {
        'verification_video_url': publicUrl,
        'verification_status': 'pending',
        'verification_submitted_at': DateTime.now().toIso8601String(),
      };
      var updateQuery = supabase.from('locations').update(updatePayload);
      if (locationId != null && _uuidRegex.hasMatch(locationId)) {
        updateQuery = updateQuery.eq('id', locationId);
      } else if (displayId != null) {
        updateQuery = updateQuery.eq('display_id', displayId);
      } else {
        throw Exception('Location identifier missing (id/display_id).');
      }
      await updateQuery;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video uploaded successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
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
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        title: Text(
          'Video Verification',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.blue.withValues(alpha: 0.1),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.videocam_outlined,
                          color: Colors.blue, size: 28),
                      const SizedBox(width: 12),
                      Text(
                        'Video Instructions',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Please record a short video (max 30 seconds) showing:',
                    style:
                        GoogleFonts.inter(color: Colors.black87, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  _buildInstructionItem(
                      'The main entrance of your parking lot'),
                  _buildInstructionItem(
                      'Our installed physical signage clearly'),
                  _buildInstructionItem('A quick pan of the overall lot area'),
                ],
              ),
            ),
            const SizedBox(height: 40),
            Text(
              'Select Video',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 16),
            if (_selectedVideo != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Video selected: ${_selectedVideo!.name}',
                        style: GoogleFonts.inter(fontSize: 14),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.red),
                      onPressed: () => setState(() => _selectedVideo = null),
                    ),
                  ],
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      onTap: _pickVideo,
                      icon: Icons.videocam,
                      label: 'Record Video',
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildActionButton(
                      onTap: _pickFromGallery,
                      icon: Icons.video_library,
                      label: 'From Gallery',
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 60),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isUploading ? null : _submitVideo,
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
                        'Upload Video',
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
                  'Cancel & Go Back',
                  style: GoogleFonts.inter(
                    color: AppTheme.textSecondary,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check, size: 18, color: Colors.green),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(color: Colors.black54, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required VoidCallback onTap,
    required IconData icon,
    required String label,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.grey, size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
