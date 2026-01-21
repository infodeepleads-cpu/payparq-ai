import 'package:flutter/material.dart';
import 'package:camera/camera.dart';

class HudScreen extends StatefulWidget {
  const HudScreen({super.key});

  @override
  State<HudScreen> createState() => _HudScreenState();
}

class _HudScreenState extends State<HudScreen> {
  CameraController? _controller;
  bool _isCameraInitialized = false;
  bool _isScanning = true;
  String? _detectedPlate;
  String _statusMessage = "SCANNING...";
  Color _statusColor = Colors.white;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    final firstCamera = cameras.first;

    _controller = CameraController(
      firstCamera,
      ResolutionPreset.high,
      enableAudio: false,
    );

    await _controller!.initialize();
    if (!mounted) return;

    setState(() {
      _isCameraInitialized = true;
    });
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isCameraInitialized) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // Camera Feed
          Positioned.fill(
            child: CameraPreview(_controller!),
          ),

          // Tactical HUD Overlay
          Positioned.fill(
            child: CustomPaint(
              painter: TacticalHudPainter(
                borderColor: _statusColor,
              ),
            ),
          ),

          // Top Status Bar
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatusBadge("LPR ACTIVE", Colors.green),
                _buildStatusBadge("ZONE: A-12", Colors.blue),
              ],
            ),
          ),

          // Center Reticle & Plate Display
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    border: Border.all(color: _statusColor, width: 2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _detectedPlate ?? "NO PLATE",
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 4,
                      fontFamily: 'Courier', // Monospace for tactical feel
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  _statusMessage,
                  style: TextStyle(
                    color: _statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    backgroundColor: Colors.black54,
                  ),
                ),
              ],
            ),
          ),

          // Bottom Action Hub
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildActionButton(
                  icon: Icons.warning_amber_rounded,
                  label: "WARNING",
                  color: Colors.orange,
                  onTap: () => _handleAction("WARNING"),
                ),
                _buildActionButton(
                  icon: Icons.receipt_long,
                  label: "TICKET",
                  color: Colors.red,
                  isPrimary: true,
                  onTap: () => _handleAction("TICKET"),
                ),
                _buildActionButton(
                  icon: Icons.check_circle_outline,
                  label: "VALIDATE",
                  color: Colors.green,
                  onTap: () => _handleAction("VALIDATE"),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        border: Border.all(color: color),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
    bool isPrimary = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: EdgeInsets.all(isPrimary ? 24 : 16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(color: color, width: 2),
              boxShadow: isPrimary
                  ? [
                      BoxShadow(
                        color: color.withOpacity(0.5),
                        blurRadius: 15,
                        spreadRadius: 2,
                      )
                    ]
                  : [],
            ),
            child: Icon(
              icon,
              color: color,
              size: isPrimary ? 40 : 28,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  void _handleAction(String action) {
    // Placeholder for actual logic
    setState(() {
      _statusMessage = "PROCESSING $action...";
    });
    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        _statusMessage = "READY";
      });
    });
  }
}

class TacticalHudPainter extends CustomPainter {
  final Color borderColor;

  TacticalHudPainter({required this.borderColor});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = borderColor.withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final cornerSize = 40.0;
    final w = size.width;
    final h = size.height;

    // Draw corners
    // Top Left
    canvas.drawLine(const Offset(20, 20), Offset(20 + cornerSize, 20), paint);
    canvas.drawLine(const Offset(20, 20), Offset(20, 20 + cornerSize), paint);

    // Top Right
    canvas.drawLine(Offset(w - 20, 20), Offset(w - 20 - cornerSize, 20), paint);
    canvas.drawLine(Offset(w - 20, 20), Offset(w - 20, 20 + cornerSize), paint);

    // Bottom Left
    canvas.drawLine(Offset(20, h - 20), Offset(20 + cornerSize, h - 20), paint);
    canvas.drawLine(Offset(20, h - 20), Offset(20, h - 20 - cornerSize), paint);

    // Bottom Right
    canvas.drawLine(Offset(w - 20, h - 20), Offset(w - 20 - cornerSize, h - 20), paint);
    canvas.drawLine(Offset(w - 20, h - 20), Offset(w - 20, h - 20 - cornerSize), paint);

    // Crosshair
    final centerPaint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    
    canvas.drawLine(Offset(w / 2 - 20, h / 2), Offset(w / 2 + 20, h / 2), centerPaint);
    canvas.drawLine(Offset(w / 2, h / 2 - 20), Offset(w / 2, h / 2 + 20), centerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return false;
  }
}
