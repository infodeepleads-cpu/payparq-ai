import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../config/app_config.dart';
import '../../../../theme.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  final _ibanController = TextEditingController();
  final _holderController = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  bool _editing = false;
  String? _savedIban;
  String? _savedHolder;
  String? _error;
  String? _successMsg;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ibanController.dispose();
    _holderController.dispose();
    super.dispose();
  }

  Future<String?> _getToken() async {
    var session = Supabase.instance.client.auth.currentSession;
    if (session == null) return null;
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    if ((session.expiresAt ?? 0) <= (now + 60)) {
      await Supabase.instance.client.auth.refreshSession();
      session = Supabase.instance.client.auth.currentSession;
    }
    return session?.accessToken;
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final token = await _getToken();
      if (token == null) {
        setState(() { _error = 'Niste prijavljeni.'; _loading = false; });
        return;
      }
      final uri = Uri.parse('${AppConfig.webAppBaseUrl}/api/owners/bank-details');
      final res = await http.get(uri, headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final iban = data['bank_iban'] as String?;
        final holder = data['bank_account_holder'] as String?;
        setState(() {
          _savedIban = iban;
          _savedHolder = holder;
          _ibanController.text = iban ?? '';
          _holderController.text = holder ?? '';
          _loading = false;
        });
      } else {
        setState(() { _error = 'Greška pri učitavanju.'; _loading = false; });
      }
    } catch (_) {
      setState(() { _error = 'Greška pri učitavanju.'; _loading = false; });
    }
  }

  Future<void> _save() async {
    final iban = _ibanController.text.trim();
    final holder = _holderController.text.trim();
    if (iban.isEmpty || holder.isEmpty) {
      setState(() { _error = 'IBAN i ime su obavezni.'; });
      return;
    }
    setState(() { _saving = true; _error = null; _successMsg = null; });
    try {
      final token = await _getToken();
      if (token == null) {
        setState(() { _error = 'Niste prijavljeni.'; _saving = false; });
        return;
      }
      final uri = Uri.parse('${AppConfig.webAppBaseUrl}/api/owners/bank-details');
      final res = await http.post(
        uri,
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'bank_iban': iban, 'bank_account_holder': holder}),
      );
      if (res.statusCode == 200) {
        await _load();
        setState(() { _editing = false; _successMsg = 'Spremljeno.'; _saving = false; });
      } else {
        final body = jsonDecode(res.body) as Map<String, dynamic>?;
        setState(() {
          _error = body?['error']?.toString() ?? 'Greška pri spremanju.';
          _saving = false;
        });
      }
    } catch (_) {
      setState(() { _error = 'Greška pri spremanju.'; _saving = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.sidebarBackground,
      appBar: AppBar(
        backgroundColor: AppTheme.sidebarBackground,
        elevation: 0,
        title: Text(
          'Financije',
          style: GoogleFonts.inter(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        actions: [
          if (!_loading && !_editing)
            TextButton(
              onPressed: () => setState(() { _editing = true; _successMsg = null; _error = null; }),
              child: Text('Uredi', style: GoogleFonts.inter(color: Colors.white70, fontSize: 14)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Colors.white))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bankovni podaci',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Unesite podatke za isplatu prihoda.',
                    style: GoogleFonts.inter(color: Colors.white54, fontSize: 13),
                  ),
                  const SizedBox(height: 28),

                  if (!_editing && _savedHolder != null && _savedIban != null) ...[
                    _infoTile('Ime i prezime', _savedHolder!),
                    const SizedBox(height: 12),
                    _infoTile('IBAN', _savedIban!, mono: true),
                    const SizedBox(height: 24),
                  ],

                  if (_editing || _savedIban == null) ...[
                    _label('Ime i prezime'),
                    const SizedBox(height: 8),
                    _field(_holderController, 'npr. Ivan Horvat'),
                    const SizedBox(height: 16),
                    _label('IBAN'),
                    const SizedBox(height: 8),
                    _field(_ibanController, 'npr. HR1210010051863000160', mono: true,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9 ]')),
                          _IbanFormatter(),
                        ]),
                    const SizedBox(height: 28),
                    Row(
                      children: [
                        if (_editing)
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _saving ? null : () {
                                setState(() {
                                  _editing = false;
                                  _ibanController.text = _savedIban ?? '';
                                  _holderController.text = _savedHolder ?? '';
                                  _error = null;
                                });
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.white54,
                                side: const BorderSide(color: Colors.white24),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                              child: Text('Odustani', style: GoogleFonts.inter()),
                            ),
                          ),
                        if (_editing) const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _saving ? null : _save,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: _saving
                                ? const SizedBox(
                                    height: 18, width: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                  )
                                : Text('Spremi', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                          ),
                        ),
                      ],
                    ),
                  ],

                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Text(_error!, style: GoogleFonts.inter(color: Colors.redAccent, fontSize: 13)),
                  ],
                  if (_successMsg != null) ...[
                    const SizedBox(height: 16),
                    Text(_successMsg!, style: GoogleFonts.inter(color: Colors.greenAccent, fontSize: 13)),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _label(String text) => Text(
    text,
    style: GoogleFonts.inter(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
  );

  Widget _field(
    TextEditingController controller,
    String hint, {
    bool mono = false,
    List<TextInputFormatter>? inputFormatters,
  }) =>
      TextField(
        controller: controller,
        style: mono
            ? GoogleFonts.robotoMono(color: Colors.white, fontSize: 14)
            : GoogleFonts.inter(color: Colors.white, fontSize: 14),
        inputFormatters: inputFormatters,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.inter(color: Colors.white24, fontSize: 14),
          filled: true,
          fillColor: Colors.white.withOpacity(0.07),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      );

  Widget _infoTile(String label, String value, {bool mono = false}) => Container(
    width: double.infinity,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.07),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(
          value,
          style: mono
              ? GoogleFonts.robotoMono(color: Colors.white, fontSize: 14)
              : GoogleFonts.inter(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
        ),
      ],
    ),
  );
}

class _IbanFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue old, TextEditingValue next) {
    final clean = next.text.replaceAll(' ', '').toUpperCase();
    final buf = StringBuffer();
    for (int i = 0; i < clean.length; i++) {
      if (i > 0 && i % 4 == 0) buf.write(' ');
      buf.write(clean[i]);
    }
    final formatted = buf.toString();
    return next.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
