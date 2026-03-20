import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../logic/providers/locale_provider.dart';

class TermsConditionsScreen extends ConsumerWidget {
  const TermsConditionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          Lang.sel(isHr, 'Terms & Conditions', 'Uvjeti i pravila privatnosti'),
          style: GoogleFonts.inter(
            color: Colors.black,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              Lang.sel(isHr, 'General Partner Terms', 'Opći uvjeti suradnje'),
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              Lang.sel(isHr, 'Last updated: March 20, 2026', 'Posljednje ažuriranje: 20. ožujka 2026.'),
              style: GoogleFonts.inter(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              Lang.sel(
                isHr,
                'If you want to learn more, visit us at www.payparq.com.',
                'Ako želite znati više, posjetite nas na www.payparq.com.',
              ),
              style: GoogleFonts.inter(
                fontSize: 14,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 32),
            _buildSection(
              Lang.sel(isHr, '1. Core Cooperation Principles', '1. Temeljna načela suradnje'),
              Lang.sel(
                isHr,
                'This cooperation is based on a full-partnership model without financial burden for the Land Owner:\n'
                    '• No Cost: PayParq covers all implementation, system digitalization, and marketing visibility costs\n'
                    '• No Risk: The Owner does not invest their own funds. Earnings are generated exclusively from realized traffic\n'
                    '• No Contract Lock-In: The partnership is flexible. The Owner may terminate cooperation at any time with prior notice, without exit fees',
                'Ova suradnja temelji se na modelu potpunog partnerstva bez financijskog tereta za Vlasnika zemljišta:\n'
                    '• Bez troška: PayParq snosi sve troškove implementacije sustava, digitalizacije i marketinške vidljivosti\n'
                    '• Bez rizika: Vlasnik ne ulaže vlastita sredstva. Zarada se ostvaruje isključivo od realiziranog prometa\n'
                    '• Bez ugovorne obveze: Partnerstvo je fleksibilno. Vlasnik može raskinuti suradnju u bilo kojem trenutku uz prethodnu najavu, bez izlaznih naknada',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '2. Commission and Service Models', '2. Modeli provizija i usluga'),
              Lang.sel(
                isHr,
                'PayParq offers two management models, depending on automation level and location:\n\n'
                    'A. Safe Parking Model (Owner Earnings 90%)\n'
                    'Purpose: For owners who want self-management with digital collection, security, and their own PayParq system.\n'
                    'Service: QR-based digital payment system, customer support, and basic supervision system.\n'
                    'Billing: PayParq retains the agreed percentage from each transaction completed through the platform.\n\n'
                    'B. HUB Model (Owner Earnings Hour/Day 50% + 90% Month)\n'
                    'Purpose: Fully automated Smart HUB system with high vehicle throughput.\n'
                    'Service: Complete management, QR payment system, personalized signs, mobile LPR system, Google Maps listing, terrain marking and review management, SEO/GEO optimization, promotion on all relevant channels, and intensive social-media marketing for maximum occupancy.\n'
                    'Billing: Higher commission covers advanced software equipment, risk assumption, and active location management.\n'
                    'Improper-parking fee: 1/4 via Parq agent mediation or 50% with owner evidence after fee settlements.',
                'PayParq nudi dva modela upravljanja, ovisno o razini automatizacije i lokaciji:\n\n'
                    'A. Safe Parking Model (Zarada 90%)\n'
                    'Namjena: Za vlasnike koji žele samoupravljanje uz digitalnu naplatu, sigurnost i vlastiti Payparq sustav.\n'
                    'Usluga: Digitalni sustav naplate putem QR kodova, korisnička podrška i osnovni sustav nadzora.\n'
                    'Naplata: PayParq zadržava dogovoreni postotak od svake transakcije izvršene putem platforme.\n\n'
                    'B. HUB Model (Zarada Sat/Dan 50% + 90% Mjesec)\n'
                    'Namjena: Potpuno automatizirani Smart HUB sustav s visokim protokom vozila.\n'
                    'Usluga: Kompletno upravljanje (Management), QR platni sustav i personalizirani znakovi, mobilni LPR sustav, Google Maps izlistavanje, označavanje terena i upravljanje recenzijama, SEO/GEO optimizacija, oglašavanje na svim relevantnim stranicama i intenzivan digitalni marketing na društvenim mrežama za maksimalno popunjavanje kapaciteta.\n'
                    'Naplata: Veća provizija pokriva troškove napredne softverske opreme, preuzimanja rizika i aktivnog upravljanja lokacijom.\n'
                    'Naknada za nepropisno parkiranje: 1/4 uz posredništvo Parq agenta ili 50% uz vlastitu evidenciju nakon isplate naknada.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '3. PayParq Obligations and Management', '3. Obveze i upravljanje (PayParq)'),
              Lang.sel(
                isHr,
                'PayParq undertakes complete technical and operational support:\n'
                    '• Implementation: Placement of QR codes and terrain marking\n'
                    '• Payment Processing: Secure collection from domestic and international users (cards, Apple Pay, Google Pay)\n'
                    '• Transparency: Owner has 24/7 real-time traffic visibility through the partner interface\n'
                    '• Maintenance: Regular software updates and system functionality maintenance',
                'PayParq se obvezuje na potpunu tehničku i operativnu podršku:\n'
                    '• Implementacija: Postavljanje QR kodova i označavanje terena\n'
                    '• Obrada plaćanja: Sigurna naplata od domaćih i stranih korisnika (kartice, Apple Pay, Google Pay)\n'
                    '• Transparentnost: Vlasnik ima 24/7 uvid u promet u realnom vremenu putem partnerskog sučelja\n'
                    '• Održavanje: Redovito ažuriranje softvera i održavanje funkcionalnosti sustava',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '4. Land Owner Obligations', '4. Obveze vlasnika zemljišta'),
              Lang.sel(
                isHr,
                'The Land Owner agrees to:\n'
                    '• Ensure access: Allow unobstructed access to the land for users who paid parking\n'
                    '• Maintain order: Keep basic cleanliness and terrain accessibility\n'
                    '• Priority: During cooperation, PayParq is the primary system for digital parking collection at the location',
                'Vlasnik se obvezuje:\n'
                    '• Osigurati pristup: Omogućiti nesmetan pristup zemljištu za korisnike koji su platili parking\n'
                    '• Urednost: Održavati osnovnu čistoću i pristupačnost terena\n'
                    '• Prvenstvo: Tijekom trajanja suradnje, PayParq je primarni sustav za digitalnu naplatu parkinga na predmetnoj lokaciji',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '5. Partners and Responsibility', '5. Partneri i odgovornost'),
              Lang.sel(
                isHr,
                'This platform is the result of cooperation between international and local experts:\n'
                    '• Principal: Leadvex Group LLC\n'
                    '• Croatian operating partners: Local expert team (PayParq team) responsible for direct communication, on-site technical support (Dalmatia and the rest of Croatia), and signalization setup',
                'Ova platforma rezultat je suradnje međunarodnih i lokalnih stručnjaka:\n'
                    '• Nositelj: Leadvex Group LLC\n'
                    '• Hrvatski operativni partneri: Lokalni tim stručnjaka (PayParq tim) zadužen je za direktnu komunikaciju, tehničku podršku na terenu (Dalmacija i ostatak Hrvatske) te postavljanje signalizacije',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '6. Earnings Payout and Dispute Resolution', '6. Isplata zarade i rješavanje sporova'),
              Lang.sel(
                isHr,
                'Payout: Earnings are calculated weekly and processed via the Stripe platform. PayParq does not manage the owner\'s money. Stripe pays the net amount to the Owner\'s account no later than the 15th of the month for the previous month. Earnings are calculated after processing fees and costs.\n\n'
                    'Jurisdiction: All disputes will be resolved amicably. If needed, the court in Split has jurisdiction.\n\n'
                    'Final note: This model enables the Owner to convert underutilized land into passive income without operational burden, while Leadvex Group LLC and local operating partners assume full system management and risk.',
                'Isplata: Zarada se obračunava tjedno i radi se putem Stripe platforme. Payparq ne upravlja novcem vlasnika. Stripe isplaćuje neto iznos Vlasniku na žiro-račun najkasnije do 15. u mjesecu za prethodni mjesec. Zarada se računa nakon isplata procesnih naknada i troškova.\n\n'
                    'Nadležnost: Svi sporovi rješavat će se sporazumno. U slučaju potrebe, nadležan je sud u Splitu.\n\n'
                    'Zaključna napomena: Ovim modelom Vlasnik pretvara neiskorišteno zemljište u pasivni prihod bez ikakvih operativnih briga, dok kompletan sustav upravljanja i rizika preuzimaju Leadvex Group LLC i lokalni operativni partneri.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '7. Addendum', '7. Addendum'),
              Lang.sel(
                isHr,
                '1) Exclusion of liability for failed collection (user risk)\n'
                    'PayParq acts as an intermediary and management platform. Although the system uses advanced control methods (scanners, barriers), PayParq does not guarantee 100% collection from every individual user.\n'
                    'The Land Owner accepts that commission is calculated exclusively on actually collected transactions. PayParq is not obliged to compensate potential lost profit for vehicles that used parking without a valid digital transaction, but will take all technical measures to minimize such cases.\n\n'
                    '2) Protection against misdemeanor and criminal liability\n'
                    'Under Croatian law, liability for illegal parking, parking non-payment, or traffic obstruction lies exclusively with the vehicle driver, not with the Land Owner or the platform operator.\n'
                    'Where intervention by authorities is required, PayParq provides technical documentation, while all costs and procedural risks are borne by the vehicle owner.\n\n'
                    '3) Exclusion of liability for vehicle damage\n'
                    'Neither the Land Owner nor PayParq is liable for theft of valuables from vehicles, damage caused by third parties, or damage caused by force majeure.\n'
                    'The Land Owner is released from user damage claims provided the damage occurred in the ordinary use of parking.\n\n'
                    '4) Legal protection (Indemnification)\n'
                    'Leadvex Group LLC and local operating partners undertake to defend the Land Owner against all unfounded legal claims arising from PayParq software operating errors.\n'
                    'The Land Owner is protected from legal dispute costs arising exclusively from the operation method of the collection system.',
                '1) Isključenje odgovornosti za nenaplatu (Rizik korisnika)\n'
                    'PayParq djeluje kao platforma za posredovanje i upravljanje. Iako sustav koristi napredne metode kontrole (skeneri, barijere), PayParq ne jamči 100% naplatu od svakog pojedinog korisnika.\n'
                    'Vlasnik zemljišta prihvaća da se provizija obračunava isključivo na stvarno naplaćene transakcije. PayParq nije dužan nadoknaditi potencijalno izgubljenu dobit za vozila koja su koristila parking bez valjane digitalne transakcije, ali će poduzeti sve tehničke mjere da takve slučajeve svede na minimum.\n\n'
                    '2) Zaštita od prekršajne i kaznene odgovornosti\n'
                    'Prema zakonima RH, za nepropisno parkiranje, neplaćanje parkinga ili ometanje prometa odgovoran je isključivo vozač vozila, a ne vlasnik zemljišta niti operater platforme.\n'
                    'U slučaju potrebe za intervencijom nadležnih službi, PayParq pruža tehničku dokumentaciju, ali sve troškove i rizike postupka snosi vlasnik vozila.\n\n'
                    '3) Isključenje odgovornosti za štetu na vozilima\n'
                    'Ni Vlasnik zemljišta ni PayParq ne odgovaraju za krađu dragocjenosti iz vozila, oštećenja od trećih osoba ni štete nastale uslijed viših sila.\n'
                    'Vlasnik zemljišta se oslobađa odštetnih zahtjeva korisnika pod uvjetom da je šteta nastala uobičajenim korištenjem parkinga.\n\n'
                    '4) Pravna zaštita (Indemnifikacija)\n'
                    'Leadvex Group LLC i lokalni operativni partneri obvezuju se braniti Vlasnika zemljišta od svih neosnovanih pravnih zahtjeva proizašlih iz grešaka u radu PayParq softvera.\n'
                    'Vlasnik zemljišta je zaštićen od troškova pravnih sporova koji nastanu isključivo zbog načina rada sustava naplate.',
              ),
            ),
            const SizedBox(height: 32),
            _buildSection(
              Lang.sel(isHr, 'COMPANY INFORMATION', 'PODACI O TVRTKI'),
              Lang.sel(
                isHr,
                'Parent company: Leadvex Group LLC\n'
                    'Headquarters: 1309 Coffeen Avenue STE 1200 Sheridan Wyoming 82801\n'
                    'Tax Number: EIN 98-1844326\n'
                    'Contact: payparq@outlook.com\n'
                    'Phone: +385 915963139\n\n'
                    'Croatian Partner: Indirektno, Vl. Karlo Žamić, Obala Kneza Domagoja 52, 21322 Brela, OIB: 83928715622',
                'Matična tvrtka: Leadvex Group LLC\n'
                    'Sjedište: 1309 Coffeen Avenue STE 1200 Sheridan Wyoming 82801\n'
                    'Porezni broj: EIN 98-1844326\n'
                    'Kontakt: payparq@outlook.com\n'
                    'Telefon: +385 915963139\n\n'
                    'Hrvatski partner: Indirektno, Vl. Karlo Žamić, Obala Kneza Domagoja 52, 21322 Brela, OIB: 83928715622',
              ),
            ),
            const SizedBox(height: 48),
            Center(
              child: Text(
                Lang.sel(isHr, '© 2026 payparq.ai • Professional Enforcement Systems',
                    '© 2026 payparq.ai • Profesionalni sustavi nadzora'),
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.grey[400],
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: GoogleFonts.inter(
              fontSize: 14,
              height: 1.6,
              color: Colors.grey[800],
            ),
          ),
        ],
      ),
    );
  }
}
