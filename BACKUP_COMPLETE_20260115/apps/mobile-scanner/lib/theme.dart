import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Unified Theme Data for Mobile & Desktop
class AppTheme {
  static const Color primary = Color(0xFF6D28D9); // AI Violet
  static const Color background = Color(0xFF1E1B4B); // Dark Indigo
  static const Color surface = Color(0xFF312E81);
  static const Color textPrimary = Colors.white;

  // Light Theme Colors (Derived from Images)
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightSurface = Color(0xFFF3F4F6); // Light Grey
  static const Color lightTextPrimary = Color(0xFF111827); // Dark Grey/Black

  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightBackground,
      primaryColor: primary,
      colorScheme: ColorScheme.light(
        primary: primary,
        surface: lightBackground,
        onSurface: lightTextPrimary,
      ),
      cardColor: lightSurface,
      useMaterial3: true,
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.light().textTheme.apply(
          bodyColor: lightTextPrimary,
          displayColor: lightTextPrimary,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: lightBackground,
        elevation: 0,
        iconTheme: IconThemeData(color: lightTextPrimary),
        titleTextStyle: TextStyle(color: lightTextPrimary, fontSize: 20, fontWeight: FontWeight.w600),
      ),
    );
  }
  
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      cardColor: surface,
      useMaterial3: true,
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme.apply(
          bodyColor: textPrimary,
          displayColor: textPrimary,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        elevation: 0,
      ),
    );
  }
}
