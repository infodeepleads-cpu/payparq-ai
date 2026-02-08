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
              Lang.sel(isHr, 'payparq.ai terms & conditions', 'payparq.ai uvjeti i pravila'),
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              Lang.sel(isHr, 'Last updated: January 18, 2026', 'Posljednje ažuriranje: 18. siječnja 2026.'),
              style: GoogleFonts.inter(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 32),
            _buildSection(
              Lang.sel(isHr, '1. Subject and Scope of Service', '1. Predmet i opseg usluge'),
              Lang.sel(
                isHr,
                'These Terms of Use ("Terms") govern the relationship between the digital service provider ("Provider") and the end-user ("User") regarding the use of the platform for private parking management, digital protection, identification of unauthorized parking, and administrative processing of irregular parking reports. By using the service, the User confirms they have read, understood, and accepted these Terms.',
                'Ovi Uvjeti korištenja ("Uvjeti") uređuju odnos između pružatelja digitalne usluge ("Pružatelj") i krajnjeg korisnika ("Korisnik") u vezi s korištenjem platforme za upravljanje privatnim parkiralištima, digitalnu zaštitu, identifikaciju neovlaštenog parkiranja te administrativnu obradu prijava nepravilnog parkiranja. Korištenjem usluge, Korisnik potvrđuje da je pročitao, razumio i prihvatio ove Uvjete.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '2. Service Content and Functionality', '2. Sadržaj i funkcionalnost usluge'),
              Lang.sel(
                isHr,
                'The Provider enables the User to:\n'
                    '• Register and digitally verify private parking spaces\n'
                    '• Generate and receive official identification tags (stickers) for physical marking\n'
                    '• Access a user account to submit reports of unauthorized parking by third parties\n'
                    '• Upload photographs and event data\n'
                    '• Track the status of administrative processing\n'
                    '• Communicate via digital channels with the Provider\n'
                    '• Utilize technical and administrative report processing\n'
                    '• Initiate informal debt collection processes against third parties on behalf of the User, where applicable\n\n'
                    'The Provider does not assume the obligation of legal representation, judicial proceedings, nor does it provide public authority.',
                'Pružatelj omogućuje Korisniku:\n'
                    '• Registraciju i digitalnu verifikaciju privatnih parkirnih mjesta\n'
                    '• Generiranje i zaprimanje službenih identifikacijskih oznaka (naljepnica) za fizičko označavanje\n'
                    '• Pristup korisničkom računu radi slanja prijava neovlaštenog parkiranja trećih osoba\n'
                    '• Učitavanje fotografija i podataka o događaju\n'
                    '• Praćenje statusa administrativne obrade\n'
                    '• Komunikaciju s Pružateljem putem digitalnih kanala\n'
                    '• Korištenje tehničke i administrativne obrade prijava\n'
                    '• Pokretanje neformalnog procesa naplate prema trećim osobama u ime Korisnika, gdje je primjenjivo\n\n'
                    'Pružatelj ne preuzima obvezu pravnog zastupanja, sudskih postupaka niti pruža javne ovlasti.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '3. Subscription and Payment', '3. Pretplata i plaćanje'),
              Lang.sel(
                isHr,
                'The service is activated upon purchase of a monthly subscription. Subscriptions are:\n'
                    '• Charged in advance\n'
                    '• Automatically renewed\n'
                    '• Cancellable at any time via the user interface\n\n'
                    'Cancellation takes effect at the start of the next billing cycle. Funds paid for the current period are non-refundable.',
                'Usluga se aktivira kupnjom mjesečne pretplate. Pretplate su:\n'
                    '• Naplaćene unaprijed\n'
                    '• Automatski se obnavljaju\n'
                    '• Mogu se otkazati u bilo kojem trenutku putem korisničkog sučelja\n\n'
                    'Otkazivanje stupa na snagu s početkom sljedećeg obračunskog razdoblja. Sredstva uplaćena za tekuće razdoblje nisu povratna.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '4. User Responsibilities and Obligations', '4. Odgovornosti i obveze korisnika'),
              Lang.sel(
                isHr,
                'The User agrees to:\n'
                    '• Provide truthful, complete, and updated information\n'
                    '• Use the service exclusively for managing their own parking spaces\n'
                    '• Ensure photographs and information are accurate, clear, and time-relevant\n'
                    '• Refrain from submitting reports not relating to actual irregular parking\n'
                    '• Correctly place the official tag in a visible location\n'
                    '• Not transfer the account or tag to third parties without approval\n\n'
                    'The User bears sole responsibility for all actions taken via their account.',
                'Korisnik se obvezuje:\n'
                    '• Davati istinite, potpune i ažurne informacije\n'
                    '• Koristiti uslugu isključivo za upravljanje vlastitim parkirnim mjestima\n'
                    '• Osigurati da su fotografije i informacije točne, jasne i vremenski relevantne\n'
                    '• Suzdržati se od podnošenja prijava koje se ne odnose na stvarno nepravilno parkiranje\n'
                    '• Pravilno postaviti službenu oznaku na vidljivo mjesto\n'
                    '• Ne prenositi račun ili oznaku na treće osobe bez odobrenja\n\n'
                    'Korisnik snosi isključivu odgovornost za sve radnje poduzete putem njegovog računa.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '5. Administrative Processing of Reports', '5. Administrativna obrada prijava'),
              Lang.sel(
                isHr,
                'The Provider verifies each submission to determine:\n'
                    '• If evidence is complete and legible\n'
                    '• If the event meets the criteria for action\n'
                    '• If debt collection against a third party can be initiated\n\n'
                    'The Provider may reject a report if it:\n'
                    '• Violates rules\n'
                    '• Lacks clear evidence\n'
                    '• Involves abuse or irregularities\n'
                    '• Lacks grounds for a procedure\n\n'
                    'The Provider does not guarantee the outcome, the amount of potential recovery, or processing time.',
                'Pružatelj provjerava svaku prijavu radi utvrđivanja:\n'
                    '• Je li dokaz potpun i čitljiv\n'
                    '• Udovoljava li događaj kriterijima za postupanje\n'
                    '• Može li se pokrenuti naplata prema trećoj osobi\n\n'
                    'Pružatelj može odbiti prijavu ako:\n'
                    '• Krši pravila\n'
                    '• Nedostaju jasni dokazi\n'
                    '• Postoje zlouporabe ili nepravilnosti\n'
                    '• Ne postoje osnove za postupak\n\n'
                    'Pružatelj ne jamči ishod, iznos potencijalne naplate ni vrijeme obrade.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '6. Limitations of Service and Liability', '6. Ograničenja usluge i odgovornosti'),
              Lang.sel(
                isHr,
                'The Provider is not responsible for:\n'
                    '• Actions and conduct of third parties\n'
                    '• The success of debt collection\n'
                    '• Damage resulting from improper use of the service\n'
                    '• Errors caused by incorrect User data\n'
                    '• Decisions by authorities that no grounds for action exist\n\n'
                    'The service is provided "as is" and "as available," without guarantees of continuous availability or error-free operation.',
                'Pružatelj nije odgovoran za:\n'
                    '• Radnje i ponašanje trećih osoba\n'
                    '• Uspjeh naplate\n'
                    '• Štetu nastalu nepravilnim korištenjem usluge\n'
                    '• Pogreške uzrokovane netočnim podacima Korisnika\n'
                    '• Odluke nadležnih tijela da ne postoje osnove za postupanje\n\n'
                    'Usluga se pruža "takva kakva jest" i "u mjeri dostupnosti", bez jamstava o kontinuiranoj dostupnosti ili besprijekornom radu.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '7. Prohibition of Unauthorized Use', '7. Zabrana neovlaštenog korištenja'),
              Lang.sel(
                isHr,
                'Users are strictly prohibited from:\n'
                    '• Submitting fictitious or intentionally inaccurate reports\n'
                    '• Manipulating photographs or data\n'
                    '• Misusing tags or using them on third-party parking spaces\n'
                    '• Interfering with platform operation\n'
                    '• Attempting unauthorized access\n\n'
                    'In case of abuse, the Provider may suspend or deactivate the account immediately without a refund.',
                'Strogo je zabranjeno:\n'
                    '• Podnositi izmišljene ili namjerno netočne prijave\n'
                    '• Manipulirati fotografijama ili podacima\n'
                    '• Zlouporabljati oznake ili ih koristiti na parkiralištima trećih osoba\n'
                    '• Ommetati rad platforme\n'
                    '• Pokušavati neovlašten pristup\n\n'
                    'U slučaju zlouporabe, Pružatelj može odmah suspendirati ili deaktivirati račun bez povrata sredstava.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '8. Processing of Personal Data', '8. Obrada osobnih podataka'),
              Lang.sel(
                isHr,
                'The Provider processes personal data exclusively for:\n'
                    '• Service provision and report processing\n'
                    '• Communication with involved parties\n'
                    '• Technical and security optimization\n\n'
                    'All data is stored in accordance with GDPR and national regulations. Users have rights to access, rectification, restriction, portability, and erasure.',
                'Pružatelj obrađuje osobne podatke isključivo za:\n'
                    '• Pružanje usluge i obradu prijava\n'
                    '• Komunikaciju s uključenim stranama\n'
                    '• Tehničku i sigurnosnu optimizaciju\n\n'
                    'Svi podaci pohranjuju se u skladu s GDPR-om i nacionalnim propisima. Korisnici imaju prava na pristup, ispravak, ograničenje, prenosivost i brisanje.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '9. Amendments to Terms', '9. Izmjene Uvjeta'),
              Lang.sel(
                isHr,
                'The Provider reserves the right to modify these Terms at any time. Users will be notified of significant changes via email or the application. Continued use constitutes acceptance of the new Terms.',
                'Pružatelj zadržava pravo izmjene ovih Uvjeta u bilo kojem trenutku. Korisnici će o značajnim promjenama biti obaviješteni putem e-pošte ili aplikacije. Nastavak korištenja predstavlja prihvaćanje novih Uvjeta.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '10. Termination of Service', '10. Prestanak usluge'),
              Lang.sel(
                isHr,
                'A User may request account deactivation at any time. The Provider may terminate the relationship in case of:\n'
                    '• Terms violations\n'
                    '• System abuse\n'
                    '• Non-payment\n'
                    '• Illegal activity',
                'Korisnik može u bilo kojem trenutku zatražiti deaktivaciju računa. Pružatelj može raskinuti odnos u slučaju:\n'
                    '• Kršenja Uvjeta\n'
                    '• Zlouporabe sustava\n'
                    '• Neplaćanja\n'
                    '• Nezakonite aktivnosti',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '11. Applicable Law and Jurisdiction', '11. Mjerodavno pravo i nadležnost'),
              Lang.sel(
                isHr,
                'The laws of the Republic of Croatia apply. Disputes shall be resolved amicably; otherwise, the court at the Provider\'s seat shall have jurisdiction.',
                'Primjenjuju se zakoni Republike Hrvatske. Sporovi se nastoje riješiti mirnim putem; u protivnom je nadležan sud prema sjedištu Pružatelja.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '12. Entry into Force', '12. Stupanje na snagu'),
              Lang.sel(
                isHr,
                'These Terms enter into force on the day of publication and remain valid until amended or revoked.',
                'Ovi Uvjeti stupaju na snagu danom objave i ostaju važeći dok se ne izmijene ili ukinu.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '13. Limitation of Liability: Failure to Contact Vehicle Owner',
                  '13. Ograničenje odgovornosti: Neuspjeh kontakta s vlasnikom vozila'),
              Lang.sel(
                isHr,
                'The User acknowledges that the Provider does not guarantee the identification or contacting of the vehicle owner. The Provider is not liable for:\n'
                    '• Failure to establish contact\n'
                    '• Loss, damage, or missed collection due to non-contact\n'
                    '• Decisions or actions of third parties\n'
                    '• Financial or material damage regarding unidentified vehicles',
                'Korisnik potvrđuje da Pružatelj ne jamči identifikaciju niti uspostavu kontakta s vlasnikom vozila. Pružatelj nije odgovoran za:\n'
                    '• Neuspjeh uspostave kontakta\n'
                    '• Gubitak, štetu ili propuštenu naplatu zbog neostvarenog kontakta\n'
                    '• Odluke ili postupke trećih osoba\n'
                    '• Financijsku ili materijalnu štetu vezanu uz neidentificirana vozila',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '14. General Limitation of Liability and Inclusion of Partners',
                  '14. Opće ograničenje odgovornosti i uključivanje partnera'),
              Lang.sel(
                isHr,
                'The User releases the Provider and its partners from liability for damages arising from service use, including technical failures or unsuccessful collections. Partners act as separate processors, and the Provider is not liable for their specific actions or errors.\n\n'
                    'The User expressly releases the Provider and its partners from liability in an absolute sense, regardless of the circumstances or events connected with the use of the service.',
                'Korisnik oslobađa Pružatelja i njegove partnere od odgovornosti za štetu nastalu korištenjem usluge, uključujući tehničke kvarove ili neuspješne naplate. Partneri djeluju kao zasebni izvršitelji obrade, a Pružatelj nije odgovoran za njihove pojedinačne radnje ili pogreške.\n\n'
                    'Korisnik izričito oslobađa Pružatelja i njegove partnere od odgovornosti u apsolutnom smislu, bez obzira na okolnosti ili događaje povezane s korištenjem usluge.',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '15. Free Tier Model and Daily Parking Tickets',
                  '15. Besplatni paket i dnevne parking-kazne'),
              Lang.sel(
                isHr,
                'Users may opt for the "Free Tier" without a monthly fee under these rules:\n'
                    '• Revenue Share: Revenue from successfully collected Daily Parking Tickets is split on predefined terms after transaction and administrative costs\n'
                    '• Warning vs. Ticket: The User decides whether to issue a free Warning or a Daily Parking Ticket (initiating administrative collection, e.g., 20 EUR)\n'
                    '• Burden of Proof: User must provide high-quality evidence (min. 2 photos, 5 mins apart)\n'
                    '• Payout: User\'s share is paid to their IBAN only after successful and final collection from the third party',
                'Korisnik može odabrati "Besplatni paket" bez mjesečne naknade uz sljedeća pravila:\n'
                    '• Dijeljenje prihoda: Prihod od uspješno naplaćenih dnevnih parking-kazni dijeli se prema unaprijed definiranim uvjetima nakon transakcijskih i administrativnih troškova\n'
                    '• Upozorenje vs. Kazna: Korisnik odlučuje hoće li izdati besplatno Upozorenje ili Dnevnu parking-kaznu (pokretanje administrativne naplate, npr. 20 EUR)\n'
                    '• Teret dokaza: Korisnik mora dostaviti visokokvalitetne dokaze (min. 2 fotografije, razmak 5 min)\n'
                    '• Isplata: Korisnikov udio isplaćuje se na IBAN tek nakon uspješne i konačne naplate od treće osobe',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '16. Absolute Indemnity Clause', '16. Klauzula o apsolutnom obeštećenju'),
              Lang.sel(
                isHr,
                'The User (parking owner/manager) expressly accepts and agrees to the following:\n'
                    '• Total independence: The Provider offers only a technological platform. Each individual decision is the sole and discretionary decision of the User\n'
                    '• Release of liability: The User irrevocably waives any claims for any direct, indirect, incidental, or consequential damage\n'
                    '• Legal protection of the Provider: If a third party initiates any procedure, the User agrees to fully indemnify the Provider for all costs\n'
                    '• Force Majeure: The Provider is not liable for system failures caused by factors beyond its control',
                'Korisnik (vlasnik/upravitelj parkirališta) izričito prihvaća i pristaje na sljedeće:\n'
                    '• Potpuna neovisnost: Pružatelj nudi samo tehnološku platformu. Svaka pojedina odluka isključivo je i diskrecijska odluka Korisnika\n'
                    '• Oslobađanje od odgovornosti: Korisnik neopozivo odustaje od bilo kakvih potraživanja za izravnu, neizravnu, slučajnu ili posljedičnu štetu\n'
                    '• Pravna zaštita Pružatelja: Ako treća osoba pokrene bilo kakav postupak, Korisnik pristaje u cijelosti obeštetiti Pružatelja za sve troškove\n'
                    '• Viša sila: Pružatelj ne odgovara za kvarove sustava uzrokovane čimbenicima izvan njegove kontrole',
              ),
            ),
            _buildSection(
              Lang.sel(isHr, '17. ISO/IEC 27001 & GDPR Strict Compliance Provision',
                  '17. Stroga usklađenost s ISO/IEC 27001 i GDPR'),
              Lang.sel(
                isHr,
                'This platform is engineered to adhere to the strictest global standards for Information Security Management (ISO/IEC 27001) and the General Data Protection Regulation (GDPR).\n'
                    '• Data Minimization: Personal data is processed strictly for execution of the parking contract\n'
                    '• Encryption & Integrity: All data is encrypted at rest and in transit\n'
                    '• Zero-Knowledge Principle: The Provider implements strict access controls; staff access is logged and restricted\n'
                    '• Data Subject Rights: The Provider facilitates the "Right to be Forgotten"\n'
                    '• Third-Party Processing: All subprocessors (Stripe, Meta, Firebase) are vetted for equivalent high-level security certifications',
                'Platforma je osmišljena u skladu s najstrožim globalnim standardima upravljanja sigurnošću informacija (ISO/IEC 27001) i Općom uredbom o zaštiti podataka (GDPR).\n'
                    '• Minimizacija podataka: Osobni podaci obrađuju se isključivo radi izvršenja ugovora o parkiranju\n'
                    '• Enkripcija i integritet: Svi podaci su šifrirani u mirovanju i prijenosu\n'
                    '• Načelo ograničenog pristupa: Pružatelj primjenjuje stroge kontrole pristupa; pristup osoblja se bilježi i ograničava\n'
                    '• Prava ispitanika: Pružatelj omogućuje pravo na zaborav\n'
                    '• Obrada od trećih strana: Svi podizvršitelji (Stripe, Meta, Firebase) potvrđeni su za ekvivalentne visoke sigurnosne standarde',
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
