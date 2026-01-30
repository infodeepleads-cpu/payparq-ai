import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PulsatingLoadingScreen extends StatefulWidget {
  const PulsatingLoadingScreen({super.key});

  @override
  State<PulsatingLoadingScreen> createState() => _PulsatingLoadingScreenState();
}

class _PulsatingLoadingScreenState extends State<PulsatingLoadingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    debugPrint('PulsatingLoadingScreen: initState()');
    debugPrint('PulsatingLoadingScreen: timestamp: ${DateTime.now()}');

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    // Add timeout to auto-exit if stuck
    Future.delayed(const Duration(seconds: 10), () {
      if (mounted) {
        debugPrint(
            'PulsatingLoadingScreen: 10s timeout reached, still mounted');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('PulsatingLoadingScreen: build()');
    debugPrint('PulsatingLoadingScreen: timestamp: ${DateTime.now()}');

    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: FadeTransition(
          opacity: _animation,
          child: Text(
            'payparq.ai',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
        ),
      ),
    );
  }
}
