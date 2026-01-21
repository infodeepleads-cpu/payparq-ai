import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// v2.5.0: REDESIGN THEME (Grayscale/Minimalist)
class AppTheme {
  // Brand Colors (Refined from photo)
  static const Color primary = Color(0xFF000000); // Pure Black
  static const Color sidebarBackground =
      Color(0xFF3D3D3D); // Premium lighter gray
  static const Color headerBackground =
      Color(0xFF000000); // Pure Black for logo bar
  static const Color background = Color(0xFFF9FAFB); // Light gray background
  static const Color lightBackground = Color(0xFFFFFFFF); // Pure White
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFD1D5DB);

  static const Color textPrimary = Color(0xFF000000);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textOnDark = Color(0xFFFFFFFF);

  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      colorScheme: const ColorScheme.light(
        primary: primary,
        surface: background,
        onSurface: textPrimary,
        outline: border,
      ),
      cardColor: background,
      useMaterial3: true,
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.light().textTheme.apply(
              bodyColor: textPrimary,
              displayColor: textPrimary,
            ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: textPrimary),
        titleTextStyle: TextStyle(
            color: textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: textOnDark,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: background,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
      ),
    );
  }
}
