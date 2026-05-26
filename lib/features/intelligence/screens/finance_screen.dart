import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/app_config.dart';
import '../../../../theme.dart';
import '../../../../logic/providers/locale_provider.dart';

class FinanceScreen extends ConsumerStatefulWidget {
  const FinanceScreen({super.key});

  @override
  ConsumerState<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends ConsumerState<FinanceScreen> {
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
        final isHr = ref.read(localeIsCroatianProvider);
        setState(() { _error = Lang.sel(isHr, 'Not logged in.', 'Niste prijavljeni.'); _loading = false; });
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
        final isHr = ref.read(localeIsCroatianProvider);
        setState(() { _error = Lang.sel(isHr, 'Error loading.', 'Greška pri učitavanju.'); _loading = false; });
      }
    } catch (_) {
      final isHr = ref.read(localeIsCroatianProvider);
      setState(() { _error = Lang.sel(isHr, 'Error loading.', 'Greška pri učitavanju.'); _loading = false; });
    }
  }

  Future<void> _save() async {
    final iban = _ibanController.text.trim();
    final holder = _holderController.text.trim();
    final isHr = ref.read(localeIsCroatianProvider);
    if (iban.isEmpty || holder.isEmpty) {
      setState(() { _error = Lang.sel(isHr, 'IBAN and name required.', 'IBAN i ime su obavezni.'); });
      return;
    }
    setState(() { _saving = true; _error = null; _successMsg = null; });
    try {
      final token = await _getToken();
      if (token == null) {
        setState(() { _error = Lang.sel(isHr, 'Not logged in.', 'Niste prijavljeni.'); _saving = false; });
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
        setState(() { _editing = false; _successMsg = Lang.sel(isHr, 'Saved.', 'Spremljeno.'); _saving = false; });
      } else {
        final body = jsonDecode(res.body) as Map<String, dynamic>?;
        setState(() {
          _error = body?['error']?.toString() ?? Lang.sel(isHr, 'Error saving.', 'Greška pri spremanju.');
          _saving = false;
        });
      }
    } catch (_) {
      setState(() { _error = Lang.sel(isHr, 'Error saving.', 'Greška pri spremanju.'); _saving = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Colors.black))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(48.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            Lang.sel(isHr, 'Finance', 'Financije'),
                            style: GoogleFonts.inter(
                              fontSize: 40,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                              letterSpacing: -1,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            Lang.sel(isHr, 'Bank details for income payout.', 'Bankovni podaci za isplatu prihoda.'),
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      if (!_editing && _savedIban != null)
                        SizedBox(
                          height: 44,
                          child: ElevatedButton.icon(
                            onPressed: () => setState(() {
                              _editing = true;
                              _successMsg = null;
                              _error = null;
                            }),
                            icon: const Icon(Icons.edit_outlined, size: 18),
                            label: Text(
                              Lang.sel(isHr, 'Edit', 'Uredi'),
                              style: GoogleFonts.inter(),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 48),

                  // Card
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Lang.sel(isHr, 'Bank Details', 'Bankovni podaci'),
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Lang.sel(isHr, 'Details used for payout.', 'Podaci se koriste za isplatu zarađenih sredstava.'),
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 28),

                        // Read-only display
                        if (!_editing && _savedHolder != null && _savedIban != null) ...[
                          _readonlyRow(Lang.sel(isHr, 'Name and Surname', 'Ime i prezime'), _savedHolder!),
                          const SizedBox(height: 16),
                          _readonlyRow('IBAN', _savedIban!, mono: true),
                        ],

                        // Edit / first-time form
                        if (_editing || _savedIban == null) ...[
                          _fieldLabel(Lang.sel(isHr, 'Name and Surname', 'Ime i prezime')),
                          const SizedBox(height: 8),
                          _textField(_holderController, Lang.sel(isHr, 'e.g. Ivan Horvat', 'npr. Ivan Horvat')),
                          const SizedBox(height: 20),
                          _fieldLabel('IBAN'),
                          const SizedBox(height: 8),
                          _textField(
                            _ibanController,
                            Lang.sel(isHr, 'e.g. HR12 1001 0051 8630 0016 0', 'npr. HR12 1001 0051 8630 0016 0'),
                            mono: true,
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9 ]')),
                              _IbanFormatter(),
                            ],
                          ),
                          const SizedBox(height: 28),
                          Row(
                            children: [
                              if (_editing) ...[
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: _saving ? null : () => setState(() {
                                      _editing = false;
                                      _ibanController.text = _savedIban ?? '';
                                      _holderController.text = _savedHolder ?? '';
                                      _error = null;
                                    }),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.black,
                                      side: BorderSide(color: Colors.grey[400]!),
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                    child: Text(Lang.sel(isHr, 'Cancel', 'Odustani'), style: GoogleFonts.inter()),
                                  ),
                                ),
                                const SizedBox(width: 12),
                              ],
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: _saving ? null : _save,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.black,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                  child: _saving
                                      ? const SizedBox(
                                          height: 18,
                                          width: 18,
                                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                        )
                                      : Text(
                                          Lang.sel(isHr, 'Save', 'Spremi'),
                                          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ],

                        if (_error != null) ...[
                          const SizedBox(height: 16),
                          Text(
                            _error!,
                            style: GoogleFonts.inter(color: Colors.red[700], fontSize: 13),
                          ),
                        ],
                        if (_successMsg != null) ...[
                          const SizedBox(height: 16),
                          Text(
                            _successMsg!,
                            style: GoogleFonts.inter(color: Colors.green[700], fontSize: 13),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _fieldLabel(String text) => Text(
    text,
    style: GoogleFonts.inter(
      fontSize: 13,
      fontWeight: FontWeight.w600,
      color: Colors.black,
    ),
  );

  Widget _textField(
    TextEditingController controller,
    String hint, {
    bool mono = false,
    List<TextInputFormatter>? inputFormatters,
  }) =>
      TextField(
        controller: controller,
        inputFormatters: inputFormatters,
        style: mono
            ? GoogleFonts.robotoMono(fontSize: 13, color: Colors.black)
            : GoogleFonts.inter(fontSize: 13, color: Colors.black),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 13),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.grey[400]!),
          ),
          focusedBorder: const OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
            borderSide: BorderSide(color: Colors.black),
          ),
        ),
      );

  Widget _readonlyRow(String label, String value, {bool mono = false}) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppTheme.textSecondary,
          letterSpacing: 0.5,
        ),
      ),
      const SizedBox(height: 4),
      Text(
        value,
        style: mono
            ? GoogleFonts.robotoMono(fontSize: 14, color: Colors.black)
            : GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.black),
      ),
    ],
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
