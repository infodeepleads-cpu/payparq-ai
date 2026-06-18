'use client';
import { useState, useEffect } from 'react';
import { ManagementDashboard } from '@/components/ManagementDashboard';
import { EmailInboxTab } from '@/components/EmailInboxTab';

type CRMTab = 'crm' | 'email';

interface CRMRow {
  id: string;
  company: string;
  email: string;
  status: string;
  nextAction: string;
  date: string;
  notes: string;
  city: string;
}

const COLUMNS: { key: keyof CRMRow; label: string }[] = [
  { key: 'company', label: 'Tvrtka' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'nextAction', label: 'Next Action' },
  { key: 'date', label: 'Date' },
  { key: 'notes', label: 'Notes' },
];

type TemplateLanguage = 'serbian' | 'italian' | 'german' | 'spanish' | 'english';
type ParkingLanguage = 'hr' | 'en' | 'de' | 'it' | 'fr';

interface EmailTemplate {
  subjects: Record<TemplateLanguage, string>;
  bodies: Record<TemplateLanguage, (name: string) => string>;
  disclaimers: Record<TemplateLanguage, string>;
}

interface ParkingTemplate {
  number: number;
  subject: Record<ParkingLanguage, string>;
  body: Record<ParkingLanguage, string>;
}

const PARKING_SEQUENCE_TEMPLATES: ParkingTemplate[] = [
  {
    number: 1,
    subject: {
      hr: 'Zaradite od svog parking mjesta',
      en: 'Earn from your parking space',
      de: 'Verdienen Sie mit Ihrem Parkplatz',
      it: 'Guadagna dal tuo parcheggio',
      fr: 'Gagnez avec votre parking'
    },
    body: {
      hr: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Zaradite od svog parking mjesta</h1><p>Lijep Poz,</p><p>evo za Vaš parking ako želite pogledati na vrijeme za ovu sezonu</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Započnite sada →</a></p><p>Ako sta treba, javite ako imate jos interes, pa ću Vam objasniti.</p><p>Srdačno,<br>PayParq Tim</p></div></body></html>`,
      en: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Earn from your parking space</h1><p>Hello,</p><p>Turn your parking space into steady income this season. Check out how it works:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Get Started →</a></p><p>Have questions? Feel free to ask — we're here to help.</p><p>Best regards,<br>PayParq Team</p></div></body></html>`,
      de: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Verdienen Sie mit Ihrem Parkplatz</h1><p>Hallo,</p><p>Verwandeln Sie Ihren Parkplatz diese Saison in stabiles Einkommen. Schauen Sie, wie es funktioniert:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Jetzt beginnen →</a></p><p>Haben Sie Fragen? Kontaktieren Sie uns gerne — wir helfen Ihnen.</p><p>Mit freundlichen Grüßen,<br>PayParq Team</p></div></body></html>`,
      it: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Guadagna dal tuo parcheggio</h1><p>Ciao,</p><p>Trasforma il tuo parcheggio in un reddito stabile questa stagione. Scopri come funziona:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Inizia ora →</a></p><p>Hai domande? Non esitare a chiedere — siamo qui per aiutarti.</p><p>Cordiali saluti,<br>PayParq Team</p></div></body></html>`,
      fr: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Gagnez avec votre parking</h1><p>Bonjour,</p><p>Transformez votre parking en revenu stable cette saison. Découvrez comment cela fonctionne:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Commencer →</a></p><p>Des questions? N'hésitez pas à nous contacter — nous sommes là pour vous aider.</p><p>Cordialement,<br>PayParq Team</p></div></body></html>`
    }
  },
  {
    number: 2,
    subject: {
      hr: 'Naš Agent je spreman pomoći s Onboardingom',
      en: 'Our Agent is ready to help with onboarding',
      de: 'Unser Agent ist bereit, bei der Onboarding-Hilfe',
      it: 'Il nostro Agente è pronto ad aiutare con l\'onboarding',
      fr: 'Notre Agent est prêt à aider avec l\'onboarding'
    },
    body: {
      hr: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Agent je spreman pomagati</h1><p>Zdravo,</p><p>Naš Agent je spreman pomoći s Onboardingom, možemo učiniti sve za Vas. Da li biste pogledali draft? Sve sto nam treba je link Vase web stranice ili email adresa ako nemate web stranicu.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Kontaktirajte nas →</a></p><p>Čekamo Vas!</p></div></body></html>`,
      en: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Agent ready to help</h1><p>Hi,</p><p>Our Agent is ready to help with onboarding — we can handle everything for you. Would you like to see a draft? All we need is your website link or email address.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Contact us →</a></p><p>Looking forward to it!</p></div></body></html>`,
      de: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Agent bereit zu helfen</h1><p>Hallo,</p><p>Unser Agent ist bereit, Ihnen beim Onboarding zu helfen — wir können alles für Sie übernehmen. Möchten Sie einen Entwurf sehen? Wir benötigen nur Ihren Website-Link oder Ihre E-Mail-Adresse.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Kontaktieren Sie uns →</a></p><p>Wir freuen uns darauf!</p></div></body></html>`,
      it: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Agente pronto ad aiutare</h1><p>Ciao,</p><p>Il nostro Agente è pronto ad aiutarti con l'onboarding — possiamo gestire tutto per te. Vuoi vedere una bozza? Abbiamo solo bisogno del link del tuo sito web o dell'indirizzo email.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Contattaci →</a></p><p>Non vediamo l'ora!</p></div></body></html>`,
      fr: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Agent prêt à aider</h1><p>Bonjour,</p><p>Notre Agent est prêt à vous aider avec l'intégration — nous pouvons tout gérer pour vous. Voulez-vous voir un brouillon? Nous avons besoin de votre lien de site web ou de votre adresse email.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Nous contacter →</a></p><p>On a hâte!</p></div></body></html>`
    }
  },
  {
    number: 3,
    subject: {
      hr: 'Agent follow-up',
      en: 'Following up on onboarding',
      de: 'Verfolgung des Onboardings',
      it: 'Seguendo l\'onboarding',
      fr: 'Suivi de l\'intégration'
    },
    body: {
      hr: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Nastavak razgovora</h1><p>Zdravo,</p><p>Malo nas je zabrinulo što nismo čuli od Vas. Možda ste bili zauzeti ili ste imali pitanja?</p><p>Slobodno nam javite - Agent čeka Vaš odgovor i spreman je odgovoriti na sve što Vas zanima!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Odgovori sada →</a></p></div></body></html>`,
      en: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Checking in</h1><p>Hi,</p><p>We were wondering if you've had a chance to review our onboarding offer. Maybe you were busy or had some questions?</p><p>Feel free to reach out — our Agent is waiting for your response and ready to answer anything!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Reply now →</a></p></div></body></html>`,
      de: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Nachverfolgung</h1><p>Hallo,</p><p>Wir fragten uns, ob Sie unsere Onboarding-Anfrage überprüft haben. Vielleicht waren Sie beschäftigt oder hatten Fragen?</p><p>Kontaktieren Sie uns gerne — unser Agent wartet auf Ihre Antwort!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Jetzt antworten →</a></p></div></body></html>`,
      it: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Controllo</h1><p>Ciao,</p><p>Ci chiedevamo se hai avuto la possibilità di rivedere la nostra offerta di onboarding. Forse sei stato occupato o hai avuto domande?</p><p>Non esitare a contattarci — il nostro Agente aspetta la tua risposta!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Rispondi ora →</a></p></div></body></html>`,
      fr: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Suivi</h1><p>Bonjour,</p><p>Nous nous demandions si vous aviez eu l'occasion d'examiner notre offre d'intégration. Peut-être étiez-vous occupé ou aviez-vous des questions?</p><p>N'hésitez pas à nous contacter — notre Agent attend votre réponse!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Répondre maintenant →</a></p></div></body></html>`
    }
  },
  {
    number: 4,
    subject: {
      hr: 'Zadnji poziv za ovu sezonu!',
      en: 'Last Call for this Season!',
      de: 'Letzter Aufruf für diese Saison!',
      it: 'Ultima chiamata per questa stagione!',
      fr: 'Dernji appel pour cette saison!'
    },
    body: {
      hr: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Zadnji poziv za ovu sezonu!</h1><p>Zdravo,</p><p>Zaradite sada — kliknite i pokreni svoj parking:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Počni sada →</a></p><p>Ne propusti ovu priliku!</p></div></body></html>`,
      en: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Last Call for this Season!</h1><p>Hi,</p><p>Earn now — click and start your parking:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Start now →</a></p><p>Don't miss this opportunity!</p></div></body></html>`,
      de: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Letzter Aufruf für diese Saison!</h1><p>Hallo,</p><p>Verdiene jetzt — klick und starte dein Parkplatz:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Jetzt starten →</a></p><p>Verpasse diese Chance nicht!</p></div></body></html>`,
      it: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Ultima chiamata per questa stagione!</h1><p>Ciao,</p><p>Guadagna ora — clicca e avvia il tuo parcheggio:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Inizia ora →</a></p><p>Non perdere questa opportunità!</p></div></body></html>`,
      fr: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000000;">Dernier appel pour cette saison!</h1><p>Bonjour,</p><p>Gagnez maintenant — cliquez et lancez votre parking:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #3B82F6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Commencer maintenant →</a></p><p>Ne manquez pas cette opportunité!</p></div></body></html>`
    }
  }
];

const TEMPLATES: Record<string, EmailTemplate> = {
  parking: {
    subjects: {
      serbian: 'Upit za parking mjesta',
      italian: 'Richiesta di Spazi Parcheggio',
      german: 'Anfrage zum Parken',
      spanish: 'Consulta de Espacios de Estacionamiento',
      english: 'Parking Space Inquiry',
    },
    bodies: {
      serbian: (name: string) =>
        `<p><b>Poštovani predstavnici ${name},</b></p><p>Da li imate višak praznog parking mjesta?</p><p>Mi smo digitalna parking trgovina, oglašavamo prazna mjesta u Vašim terminima po Vašim cijenama, maržu (service fee) plaća kupac.</p><p>Zainteresirani?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
      italian: (name: string) =>
        `<p><b>Egregi rappresentanti di ${name},</b></p><p>Avete posti auto vuoti in eccesso?</p><p>Siamo una piattaforma digitale per parcheggi, pubblicizziamo spazi liberi secondo i vostri orari e prezzi, la commissione viene pagata dal cliente.</p><p>Interessati?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
      german: (name: string) =>
        `<p><b>Sehr geehrte Damen und Herren von ${name},</b></p><p>Haben Sie überschüssige leere Parkplätze?</p><p>Wir sind ein digitales Parkplatz-Marktplatz, wir bewerben freie Plätze zu Ihren Bedingungen und Preisen, die Gebühr zahlt der Käufer.</p><p>Interessiert?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
      spanish: (name: string) =>
        `<p><b>Estimados representantes de ${name},</b></p><p>¿Tienen espacios de estacionamiento vacíos en exceso?</p><p>Somos una plataforma digital de estacionamiento, publicitamos espacios vacíos en sus términos y precios, la tarifa de servicio la paga el comprador.</p><p>¿Interesados?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
      english: (name: string) =>
        `<p><b>Dear representatives of ${name},</b></p><p>Do you have excess empty parking spaces?</p><p>We are a digital parking marketplace, we advertise empty spaces on your terms and prices, the service fee is paid by the buyer.</p><p>Interested?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
    },
    disclaimers: {
      serbian: `IZJAVA O ODRICANJU ODGOVORNOSTI: Sadržaj ove poruke i eventualno priloženih datoteka je povjerljiv i namijenjen je samo osobama ili subjektima koji su navedeni u adresi. Ukoliko ste primili ovu poruku greškom, molimo Vas, obavijestite pošiljatelja, a poruku i sve njene privitke odmah, bez čitanja, trajno uklonite s računala. Bilo kakvo prenošenje, kopiranje ili distribucija informacija sadržanih u poruci trećim osobama je zabranjeno i može biti zakonski kažnjivo. Sadržaj, stavovi i mišljenja izneseni u poruci su autorovi i ne predstavljaju nužno stavove PayParq Grupe. PayParq Group ne prihvaća nikakvu odgovornost za eventualnu štetu nastalu primitkom ove poruke i priloga sadržanih u poruci.`,
      italian: `DISCLAIMER: Il contenuto di questa email e eventuali allegati è riservato e destinato esclusivamente alle persone o entità indicate come destinatari. Se hai ricevuto questo messaggio per errore, ti preghiamo di notificarlo al mittente e di eliminare permanentemente il messaggio e tutti gli allegati dal tuo computer senza leggerli. Qualsiasi divulgazione, copia o distribuzione delle informazioni contenute in questo messaggio a terzi è proibita e potrebbe essere illegale. Le opinioni espresse in questo messaggio sono solo quelle dell'autore e non rappresentano necessariamente le opinioni di PayParq Group. PayParq Group non assume alcuna responsabilità per eventuali danni causati da questo messaggio.`,
      german: `HAFTUNGSAUSSCHLUSS: Der Inhalt dieser E-Mail und eventueller Anhänge ist vertraulich und ausschließlich für die Personen oder Entitäten bestimmt, die als Empfänger aufgeführt sind. Sollten Sie diese Nachricht versehentlich erhalten haben, bitten wir Sie, den Absender zu benachrichtigen und die Nachricht sowie alle Anhänge sofort und ohne sie zu lesen dauerhaft von Ihrem Computer zu löschen. Jede Weitergabe, Vervielfältigung oder Verteilung von Informationen aus dieser Nachricht an Dritte ist untersagt und kann rechtswidrig sein. Die in dieser Nachricht geäußerten Meinungen sind nur die des Autors und stellen nicht unbedingt die Ansichten von PayParq Group dar. PayPayParq Group übernimmt keine Haftung für Schäden, die durch diese Nachricht entstehen.`,
      spanish: `DESCARGO DE RESPONSABILIDAD: El contenido de este correo electrónico y los anexos adjuntos es confidencial y está destinado únicamente a las personas o entidades indicadas como destinatarios. Si ha recibido este mensaje por error, le pedimos que notifique al remitente y elimine permanentemente el mensaje y todos los anexos de su computadora sin leerlos. Está prohibida la divulgación, copia o distribución de cualquier información contenida en este mensaje a terceros y puede ser ilegal. Las opiniones expresadas en este mensaje son solo las del autor y no representan necesariamente las opiniones de PayParq Group. PayParq Group no asume ninguna responsabilidad por los daños causados por este mensaje.`,
      english: `DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message and files attached to it.`,
    },
  },
  'parking-bilingual': {
    subjects: {
      serbian: 'Upit za parking mjesta',
      italian: 'Richiesta di Spazi Parcheggio',
      german: 'Anfrage zum Parken',
      spanish: 'Consulta de Espacios de Estacionamiento',
      english: 'Parking Space Inquiry',
    },
    bodies: {
      serbian: (name: string) =>
        `<p><b>Poštovani predstavnici ${name},</b></p><p>Da li imate višak praznog parking mjesta?</p><p>Mi smo digitalna parking trgovina, oglašavamo prazna mjesta u Vašim terminima po Vašim cijenama, maržu (service fee) plaća kupac.</p><p>Zainteresirani?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
      italian: (name: string) =>
        `<p><b>Egregi rappresentanti di ${name},</b></p><p>Avete posti auto vuoti in eccesso?</p><p>Siamo una piattaforma digitale per parcheggi, pubblicizziamo spazi liberi secondo i vostri orari e prezzi, la commissione viene pagata dal cliente.</p><p>Interessati?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
      german: (name: string) =>
        `<p><b>Sehr geehrte Damen und Herren von ${name},</b></p><p>Haben Sie überschüssige leere Parkplätze?</p><p>Wir sind ein digitales Parkplatz-Marktplatz, wir bewerben freie Plätze zu Ihren Bedingungen und Preisen, die Gebühr zahlt der Käufer.</p><p>Interessiert?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
      spanish: (name: string) =>
        `<p><b>Estimados representantes de ${name},</b></p><p>¿Tienen espacios de estacionamiento vacíos en exceso?</p><p>Somos una plataforma digital de estacionamiento, publicitamos espacios vacíos en sus términos y precios, la tarifa de servicio la paga el comprador.</p><p>¿Interesados?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
      english: (name: string) =>
        `<p><b>Dear representatives of ${name},</b></p><p>Do you have excess empty parking spaces?</p><p>We are a digital parking marketplace, we advertise empty spaces on your terms and prices, the service fee is paid by the buyer.</p><p>Interested?</p><p style="margin-top:24px;"><b>Karlo Žamić, mag.oec.</b><br />Managing Partner, payparq<br />payparq.com<br />+385915963139</p>`,
    },
    disclaimers: {
      serbian: `<p style="color: #666;">IZJAVA O ODRICANJU ODGOVORNOSTI: Sadržaj ove poruke i eventualno priloženih datoteka je povjerljiv i namijenjen je samo osobama ili subjektima koji su navedeni u adresi. Ukoliko ste primili ovu poruku greškom, molimo Vas, obavijestite pošiljatelja, a poruku i sve njene privitke odmah, bez čitanja, trajno uklonite s računala. Bilo kakvo prenošenje, kopiranje ili distribucija informacija sadržanih u poruci trećim osobama je zabranjeno i može biti zakonski kažnjivo. Sadržaj, stavovi i mišljenja izneseni u poruci su autorovi i ne predstavljaju nužno stavove PayParq Grupe. PayParq Group ne prihvaća nikakvu odgovornost za eventualnu štetu nastalu primitkom ove poruke i priloga sadržanih u poruci.</p><p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
      italian: `<p style="color: #666;">DISCLAIMER: Il contenuto di questa email e eventuali allegati è riservato e destinato esclusivamente alle persone o entità indicate come destinatari. Se hai ricevuto questo messaggio per errore, ti preghiamo di notificarlo al mittente e di eliminare permanentemente il messaggio e tutti gli allegati dal tuo computer senza leggerli. Qualsiasi divulgazione, copia o distribuzione delle informazioni contenute in questo messaggio a terzi è proibita e potrebbe essere illegale. Le opinioni espresse in questo messaggio sono solo quelle dell'autore e non rappresentano necessariamente le opinioni di PayParq Group. PayParq Group non assume alcuna responsabilità per eventuali danni causati da questo messaggio.</p><p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
      german: `<p style="color: #666;">HAFTUNGSAUSSCHLUSS: Der Inhalt dieser E-Mail und eventueller Anhänge ist vertraulich und ausschließlich für die Personen oder Entitäten bestimmt, die als Empfänger aufgeführt sind. Sollten Sie diese Nachricht versehentlich erhalten haben, bitten wir Sie, den Absender zu benachrichtigen und die Nachricht sowie alle Anhänge sofort und ohne sie zu lesen dauerhaft von Ihrem Computer zu löschen. Jede Weitergabe, Vervielfältigung oder Verteilung von Informationen aus dieser Nachricht an Dritte ist untersagt und kann rechtswidrig sein. Die in dieser Nachricht geäußerten Meinungen sind nur die des Autors und stellen nicht unbedingt die Ansichten von PayParq Group dar. PayParq Group übernimmt keine Haftung für Schäden, die durch diese Nachricht entstehen.</p><p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
      spanish: `<p style="color: #666;">DESCARGO DE RESPONSABILIDAD: El contenido de este correo electrónico y los anexos adjuntos es confidencial y está destinado únicamente a las personas o entidades indicadas como destinatarios. Si ha recibido este mensaje por error, le pedimos que notifique al remitente y elimine permanentemente el mensaje y todos los anexos de su computadora sin leerlos. Está prohibida la divulgación, copia o distribución de cualquier información contenida en este mensaje a terceros y puede ser ilegal. Las opiniones expresadas en este mensaje son solo las del autor y no representan necesariamente las opiniones de PayParq Group. PayParq Group no asume ninguna responsabilidad por los daños causados por este mensaje.</p><p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
      english: `<p style="color: #666;">DISCLAIMER: The contents of this email as well as any files attached to it are confidential and intended solely for individuals or entities to which they are addressed. If you have received this email message in error, please notify the sender and permanently remove the message and all attached files from your computer without reading them. Any disclosure, copying or distribution of all or part of information contained herein to third parties is prohibited and may be unlawful. Please note that any views or opinions presented in this message are solely those of the author and do not necessarily represent the views and opinions of PayParq Group. PayParq Group accepts no liability for any potential damage caused by this message.</p>`,
    },
  },
};

export function CRMTable() {
  const [activeTab, setActiveTab] = useState<CRMTab>('crm');
  const [rows, setRows] = useState<CRMRow[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof CRMRow } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCity, setImportCity] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<Array<{ id: string; email: string; displayName: string }>>([]);
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [senderType, setSenderType] = useState<'transactional' | 'outreach'>('outreach');
  const [senderRegion, setSenderRegion] = useState<'international' | 'yugoslavia'>('international');
  const [sendingProgress, setSendingProgress] = useState('');
  const [availableRecipients, setAvailableRecipients] = useState<CRMRow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<'custom' | 'parking' | 'parking-bilingual' | 'parking-sequence'>('custom');
  const [templateLanguage, setTemplateLanguage] = useState<'serbian' | 'italian' | 'german' | 'spanish' | 'english'>('serbian');
  const [showDashboard, setShowDashboard] = useState(false);
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [emailSubjectB, setEmailSubjectB] = useState('');
  const [emailBodyB, setEmailBodyB] = useState('');
  const [showSequenceEnrollModal, setShowSequenceEnrollModal] = useState(false);
  const [sequences, setSequences] = useState<any[]>([]);
  const [selectedSequence, setSelectedSequence] = useState('');
  const [enrollmentProgress, setEnrollmentProgress] = useState('');
  const [enrollmentStatuses, setEnrollmentStatuses] = useState<Record<string, any>>({});
  const [sendMode, setSendMode] = useState<'single' | 'sequence'>('single');
  const [selectedParkingEmail, setSelectedParkingEmail] = useState(1);
  const [parkingLanguage, setParkingLanguage] = useState<ParkingLanguage>('en');
  const [sequenceDaySpacing, setSequenceDaySpacing] = useState(2);
  const [skipWeekends, setSkipWeekends] = useState(true);

  useEffect(() => {
    fetchCRM();
    fetchSequences();
  }, []);

  useEffect(() => {
    const cityRows = selectedCity ? rows.filter((r) => r.city === selectedCity) : [];
    const emails = cityRows.map(r => r.email).filter(Boolean);
    if (emails.length > 0) fetchEnrollmentStatuses(emails);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, rows]);

  const fetchEnrollmentStatuses = async (emails: string[]) => {
    if (!emails.length) return;
    try {
      const params = emails.map(e => `email=${encodeURIComponent(e)}`).join('&');
      const res = await fetch(`/api/admin/enrollment-status?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollmentStatuses(data);
      }
    } catch (error) {
      console.error('Failed to fetch enrollment statuses:', error);
    }
  };

  const fetchSequences = async () => {
    try {
      const res = await fetch('/api/sequences');
      const data = await res.json();
      setSequences(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sequences:', error);
    }
  };

  const fetchCRM = async () => {
    try {
      setLoading(true);
      setSetupError('');
      const res = await fetch('/api/crm');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRows(data);
        const uniqueCities = Array.from(new Set(data.map((r: CRMRow) => r.city).filter(Boolean))).sort();
        setCities(uniqueCities as string[]);
        if (uniqueCities.length > 0 && !selectedCity) {
          setSelectedCity(uniqueCities[0] as string);
        }
      } else if (data?.error) {
        setSetupError(data.error);
        setRows([]);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching CRM:', error);
      setSetupError('Failed to connect to database');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCRM = async (updatedRows: CRMRow[]) => {
    try {
      setSaving(true);
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRows),
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Save failed: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving CRM:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCellClick = (id: string, field: keyof CRMRow, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const handleCellSave = (id: string, field: keyof CRMRow, value: string) => {
    const updated = rows.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setRows(updated);
    saveCRM(updated);
    setEditingCell(null);
  };

  const handleAddRow = () => {
    const newRow: CRMRow = {
      id: `${selectedCity}-${Date.now()}`,
      company: '',
      email: '',
      status: '',
      nextAction: '',
      date: '',
      notes: '',
      city: selectedCity,
    };
    const updated = [...rows, newRow];
    setRows(updated);
    saveCRM(updated);
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('Delete this row?')) {
      const updated = rows.filter((row) => row.id !== id);
      setRows(updated);
      saveCRM(updated);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!importCity.trim()) {
      alert('Please enter a city name first');
      e.target.value = '';
      return;
    }

    try {
      setImportLoading(true);
      const text = await file.text();

      // Parse CSV
      const lines = text.trim().split('\n');
      const csvRows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parser - handles quoted fields
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        // Skip tier headers
        if (!parts[0] || parts[0].toLowerCase().includes('tier') || parts[0].toLowerCase() === 'company') {
          continue;
        }

        const company = parts[0] || '';
        const status = parts[1] || '';
        const nextAction = parts[2] || '';
        const date = parts[3] || '';
        const notes = parts[4] || '';

        if (company) {
          csvRows.push({
            company,
            status,
            nextAction,
            date,
            notes,
            city: importCity,
          });
        }
      }

      if (csvRows.length === 0) {
        alert('No valid data found in CSV');
        return;
      }

      const res = await fetch('/api/crm/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: csvRows, city: importCity }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert(`✅ Imported ${result.imported} entries for ${importCity}`);
      setShowImportModal(false);
      setImportCity('');
      fetchCRM();
    } catch (error) {
      alert(`Error importing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const filteredRows = selectedCity ? rows.filter((r) => r.city === selectedCity) : [];

  const handleDeleteCity = () => {
    if (!selectedCity) return;
    if (!confirm(`Delete all ${filteredRows.length} entries from ${selectedCity}? This cannot be undone.`)) return;

    const updated = rows.filter((r) => r.city !== selectedCity);
    setRows(updated);
    saveCRM(updated);
    setSelectedCity('');
  };

  const handleRenameCity = () => {
    if (!selectedCity) return;
    const newCityName = prompt(`Rename "${selectedCity}" to:`, selectedCity);
    if (!newCityName || newCityName === selectedCity) return;

    const updated = rows.map((r) =>
      r.city === selectedCity ? { ...r, city: newCityName } : r
    );
    setRows(updated);
    saveCRM(updated);
    setSelectedCity(newCityName);
  };


  const handleOpenEmailModal = (row: CRMRow) => {
    setEmailRecipients([{
      id: row.id,
      email: row.email,
      displayName: extractDisplayName(row),
    }]);
    setAvailableRecipients(filteredRows.filter((r) => r.id !== row.id));
    setCustomEmails([]);
    setCustomEmailInput('');
    setEmailSubject('');
    setEmailBody('');
    setSenderType('outreach');
    setSenderRegion('international');
    setSendingProgress('');
    setSelectedTemplate('custom');
    setTemplateLanguage('serbian');
    setSendMode('single');
    setSelectedParkingEmail(1);
    setParkingLanguage('en');
    setShowEmailModal(true);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailRecipients([]);
    setAvailableRecipients(filteredRows);
    setCustomEmails([]);
    setEmailSubject('');
    setEmailBody('');
  };

  const handleEnrollInSequence = async () => {
    if (!selectedSequence) {
      alert('Please select a sequence');
      return;
    }

    const sequence = sequences.find(s => s.id === selectedSequence);
    if (!sequence) return;

    try {
      setEnrollmentProgress('Enrolling...');

      const toEnroll = filteredRows.map(row => ({
        email: row.email,
        name: row.company || 'Unknown',
      }));

      const res = await fetch('/api/sequences/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: toEnroll,
          sequenceId: sequence.id,
          sequenceName: sequence.name,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Enrollment failed');
      }

      setEnrollmentProgress(`✅ Enrolled ${result.enrolled} leads in "${sequence.name}"`);
      setTimeout(() => {
        setShowSequenceEnrollModal(false);
        setEnrollmentProgress('');
        setSelectedSequence('');
      }, 2000);
    } catch (error) {
      setEnrollmentProgress(`❌ ${error instanceof Error ? error.message : 'Error'}`);
    }
  };

  const handleApplyTemplate = (templateName: string, language: TemplateLanguage) => {
    const template = TEMPLATES[templateName];
    if (template) {
      setSelectedTemplate(templateName as 'custom' | 'parking');
      setTemplateLanguage(language);
      setEmailSubject(template.subjects[language]);
      const disclaimer = template.disclaimers[language];
      const bodyWithDisclaimer = `${template.bodies[language]('X')}\n\n${disclaimer}`;
      setEmailBody(bodyWithDisclaimer);
    }
  };

  const extractDisplayName = (row: CRMRow): string => {
    const company = row.company?.trim() || '';
    if (company && !company.includes('@')) return company;
    return 'Sir/Madam';
  };

  const handleAddAllRecipients = () => {
    const newRecipients = availableRecipients.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: extractDisplayName(row),
    }));
    setEmailRecipients([...emailRecipients, ...newRecipients]);
    setAvailableRecipients([]);
  };

  const handleAddCustomEmail = () => {
    const email = customEmailInput.trim();
    if (email && !customEmails.includes(email)) {
      setCustomEmails([...customEmails, email]);
      setCustomEmailInput('');
    }
  };

  const handleRemoveCustomEmail = (email: string) => {
    setCustomEmails(customEmails.filter((e) => e !== email));
  };

  const handleAddRecipient = (row: CRMRow) => {
    if (!emailRecipients.find((r) => r.id === row.id)) {
      setEmailRecipients([...emailRecipients, {
        id: row.id,
        email: row.email,
        displayName: extractDisplayName(row),
      }]);
      setAvailableRecipients(availableRecipients.filter((r) => r.id !== row.id));
    }
  };

  const handleRemoveRecipient = (rowId: string) => {
    const removed = emailRecipients.find((r) => r.id === rowId);
    setEmailRecipients(emailRecipients.filter((r) => r.id !== rowId));
    if (removed) {
      const originalRow = rows.find((r) => r.id === rowId);
      if (originalRow) {
        setAvailableRecipients([...availableRecipients, originalRow]);
      }
    }
  };

  const handleSendEmails = async () => {
    // Parking sequence mode
    if (selectedTemplate === 'parking-sequence' && sendMode === 'sequence') {
      if (emailRecipients.length === 0 && customEmails.length === 0) {
        alert('Please select at least one recipient');
        return;
      }

      try {
        setSendingProgress('Enrolling in sequence...');
        const allRecipients = [
          ...emailRecipients.map((r) => ({ email: r.email, name: r.displayName })),
          ...customEmails.map((email) => ({ email, name: 'Contact' })),
        ];

        const res = await fetch('/api/sequences/start-parking-sequence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emails: allRecipients,
            language: parkingLanguage
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to enroll');

        setSendingProgress(`✅ Enrolled ${data.enrolled} leads in parking sequence (${parkingLanguage.toUpperCase()})`);
        setTimeout(() => {
          handleCloseEmailModal();
          setSendingProgress('');
        }, 2000);
        return;
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setSendingProgress('');
        return;
      }
    }

    // Parking sequence single email mode
    if (selectedTemplate === 'parking-sequence' && sendMode === 'single') {
      if (emailRecipients.length === 0 && customEmails.length === 0) {
        alert('Please select at least one recipient');
        return;
      }

      const emailTemplate = PARKING_SEQUENCE_TEMPLATES.find(e => e.number === selectedParkingEmail);
      if (!emailTemplate) {
        alert('Email template not found');
        return;
      }

      try {
        setSendingProgress('Sending emails...');
        const allRecipients = [
          ...emailRecipients.map((r) => ({ email: r.email, displayName: r.displayName })),
          ...customEmails.map((email) => ({ email, displayName: 'Sir/Madam' })),
        ];

        let sentCount = 0;
        for (const recipient of allRecipients) {
          setSendingProgress(`Sending ${sentCount + 1}/${allRecipients.length}...`);

          const res = await fetch('/api/send-outreach-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: recipient.email,
              subject: emailTemplate.subject[parkingLanguage],
              html: emailTemplate.body[parkingLanguage],
              nameVariant: 'international'
            })
          });

          if (!res.ok) throw new Error(`Failed to send to ${recipient.email}`);
          sentCount++;
        }

        setSendingProgress(`✅ Sent email #${selectedParkingEmail} to ${sentCount} recipient(s)`);
        setTimeout(() => {
          handleCloseEmailModal();
          setSendingProgress('');
        }, 2000);
        return;
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setSendingProgress('');
        return;
      }
    }

    // Regular email mode
    if (!emailSubject.trim() || !emailBody.trim() || (emailRecipients.length === 0 && customEmails.length === 0)) {
      alert('Please fill in all fields and select at least one recipient');
      return;
    }

    if (abTestEnabled && (!emailSubjectB.trim() || !emailBodyB.trim())) {
      alert('Please fill in both A and B variants for A/B testing');
      return;
    }

    try {
      setSendingProgress('Starting...');
      const endpoint = senderType === 'transactional' ? '/api/send-email' : '/api/send-outreach-email';

      const allRecipients = [
        ...emailRecipients.map((r) => ({ email: r.email, displayName: r.displayName })),
        ...customEmails.map((email) => ({ email, displayName: 'Sir/Madam' })),
      ];
      const totalRecipients = allRecipients.length;

      const invalidRecipients = allRecipients.filter((r) => !r.email || !r.email.includes('@'));
      if (invalidRecipients.length > 0) {
        const names = invalidRecipients.map((r) => r.displayName).join(', ');
        alert(`These contacts have no email address set: ${names}\n\nPlease fill in the Email column for each contact before sending.`);
        setSendingProgress('');
        return;
      }

      const midpoint = Math.ceil(totalRecipients / 2);
      const variantASentTo: string[] = [];
      const variantBSentTo: string[] = [];

      for (let i = 0; i < allRecipients.length; i++) {
        const recipient = allRecipients[i];
        const recipientName = recipient.displayName;
        const isVariantA = !abTestEnabled || i < midpoint;
        const variant = isVariantA ? 'A' : 'B';

        setSendingProgress(`Sending ${i + 1}/${totalRecipients} to ${recipientName} (Variant ${variant})...`);

        const subject = isVariantA ? emailSubject : emailSubjectB;
        const body = isVariantA ? emailBody : emailBodyB;
        const personalizedBody = body.replace(/X/g, recipientName);

        const payload: any = {
          to: String(recipient.email),
          subject: subject,
          html: personalizedBody,
          variant: abTestEnabled ? variant : undefined,
          campaignId: abTestEnabled ? `ab-${Date.now()}` : undefined,
        };

        if (senderType === 'outreach') {
          payload.nameVariant = senderRegion;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          let errorMsg = 'Unknown error';
          try {
            const errData = await res.json();
            errorMsg = errData.error || errData.message || JSON.stringify(errData);
          } catch (e) {
            errorMsg = res.statusText;
          }
          throw new Error(`Failed to send to ${recipientName}: ${errorMsg}`);
        }

        if (isVariantA) {
          variantASentTo.push(recipient.email);
        } else {
          variantBSentTo.push(recipient.email);
        }
      }

      let successMsg = '✅ All emails sent successfully!';
      if (abTestEnabled) {
        successMsg += `\n\nVariant A: ${variantASentTo.length} recipients\nVariant B: ${variantBSentTo.length} recipients\n\nCheck Campaign Analytics widget for results.`;
      }

      setSendingProgress(successMsg);
      setTimeout(() => {
        handleCloseEmailModal();
        setSendingProgress('');
        setAbTestEnabled(false);
        setEmailSubjectB('');
        setEmailBodyB('');
      }, 3000);
    } catch (error) {
      alert(`Error sending emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSendingProgress('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading CRM data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'crm'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          CRM
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'email'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Email Inbox
        </button>
      </div>

      {activeTab === 'email' ? (
        <EmailInboxTab />
      ) : (
        <>
          {setupError && (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900">Database error: {setupError}</p>
              <p className="text-xs text-gray-700 mt-1">
                You need to create the <code className="bg-gray-100 px-1 rounded">crm_entries</code> table in Supabase.
                Go to <strong>Supabase → SQL Editor</strong> and run the SQL from <code>sql/create_crm_table.sql</code>.
              </p>
            </div>
          )}

          {/* City Selector */}
          <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-lg border border-gray-200">
            <label className="text-sm font-semibold text-gray-900">City:</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
            >
              <option value="">Select a city...</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city} ({rows.filter((r) => r.city === city).length})
                </option>
              ))}
            </select>
            {selectedCity && (
              <>
                <span className="text-xs text-gray-600">
                  {filteredRows.length} entries
                </span>
                <button
                  onClick={handleRenameCity}
                  className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={handleDeleteCity}
                  className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-black rounded font-medium transition-colors"
                >
                  Delete City
                </button>
              </>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowDashboard(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Dashboard
            </button>
        <button
          onClick={handleAddRow}
          disabled={saving || !selectedCity}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Add Row
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Import CSV
        </button>
        <button
          onClick={fetchCRM}
          disabled={saving || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
        {saving && <span className="text-sm text-gray-600">Saving...</span>}
      </div>

      {/* Management Dashboard */}
      {showDashboard && (
        <ManagementDashboard rows={rows} onClose={() => setShowDashboard(false)} />
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Send Email</h2>
              <button onClick={handleCloseEmailModal} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Templates */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Template</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <button
                    onClick={() => setSelectedTemplate('custom')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      selectedTemplate === 'custom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Custom
                  </button>
                  <button
                    onClick={() => handleApplyTemplate('parking', templateLanguage)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      selectedTemplate === 'parking'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Parking Inquiry
                  </button>
                  <button
                    onClick={() => handleApplyTemplate('parking-bilingual', templateLanguage)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      selectedTemplate === 'parking-bilingual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Parking (Bilingual)
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('parking-sequence')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      selectedTemplate === 'parking-sequence'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sequence
                  </button>
                </div>

                {(selectedTemplate === 'parking' || selectedTemplate === 'parking-bilingual') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Language:</label>
                    <div className="grid grid-cols-5 gap-1 mb-3">
                      {(['serbian', 'italian', 'german', 'spanish', 'english'] as TemplateLanguage[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleApplyTemplate(selectedTemplate as 'parking' | 'parking-bilingual', lang)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors capitalize ${
                            templateLanguage === lang
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Preview (X = recipient name):</p>
                      <div className="bg-white rounded p-2 text-xs text-gray-900 whitespace-pre-wrap break-words max-h-40 overflow-y-auto font-mono">
                        {emailBody.split('\n').slice(0, 8).join('\n')}...
                      </div>
                    </div>
                  </div>
                )}

                {selectedTemplate === 'parking-sequence' && (
                  <div className="space-y-3">
                    {/* Email Number Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Email #:</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            onClick={() => setSelectedParkingEmail(num)}
                            disabled={num === 1 && sendMode === 'sequence'}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              selectedParkingEmail === num
                                ? 'bg-blue-600 text-white'
                                : num === 1 && sendMode === 'sequence'
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title={num === 1 && sendMode === 'sequence' ? 'Email 1 is always sent in parking sequence' : ''}
                          >
                            Email {num}
                          </button>
                        ))}
                      </div>
                      {sendMode === 'sequence' && (
                        <p className="text-xs text-blue-600 mt-2 font-medium">Email 1 (Parking template) is required and always sent first</p>
                      )}
                    </div>

                    {/* Language Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Language:</label>
                      <div className="grid grid-cols-5 gap-1">
                        {(['hr', 'en', 'de', 'it', 'fr'] as ParkingLanguage[]).map((lang) => {
                          const langNames = { hr: 'HR', en: 'EN', de: 'DE', it: 'IT', fr: 'FR' };
                          return (
                            <button
                              key={lang}
                              onClick={() => setParkingLanguage(lang)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                parkingLanguage === lang
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {langNames[lang]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Send Mode Toggle */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Send Mode:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSendMode('single')}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            sendMode === 'single'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Send Single
                        </button>
                        <button
                          onClick={() => setSendMode('sequence')}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            sendMode === 'sequence'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Send Sequence
                        </button>
                      </div>
                    </div>

                    {sendMode === 'sequence' && (
                      <>
                        {/* Day Spacing Customization */}
                        <div className="border-t border-gray-200 pt-3">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Email Spacing:</label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={sequenceDaySpacing}
                                onChange={(e) => setSequenceDaySpacing(parseInt(e.target.value))}
                                className="flex-1"
                              />
                              <span className="text-sm font-bold text-gray-900 w-12 text-right">{sequenceDaySpacing}d</span>
                            </div>
                            <p className="text-xs text-gray-600">Send each email {sequenceDaySpacing} day{sequenceDaySpacing !== 1 ? 's' : ''} apart</p>
                          </div>
                        </div>

                        {/* Skip Weekends Toggle */}
                        <div>
                          <label className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={skipWeekends}
                              onChange={(e) => setSkipWeekends(e.target.checked)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <span className="font-semibold text-gray-900 text-xs">Never send on weekends</span>
                              <p className="text-xs text-gray-600">Emails skip Sat/Sun</p>
                            </div>
                          </label>
                        </div>

                        {/* Timeline Preview */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Send Timeline:</p>
                          <div className="space-y-1 text-xs text-gray-600">
                            {[1, 2, 3, 4].map((email) => {
                              let daysFromStart = (email - 1) * sequenceDaySpacing;
                              let adjustedDays = daysFromStart;
                              if (skipWeekends) {
                                const weekendDays = Math.floor(daysFromStart / 7) * 2;
                                adjustedDays = daysFromStart + weekendDays;
                              }
                              return <div key={email}>Email {email}: +{adjustedDays}d</div>;
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Preview */}
                    {(() => {
                      const template = PARKING_SEQUENCE_TEMPLATES.find(e => e.number === selectedParkingEmail);
                      if (!template) return null;
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Preview:</p>
                          <p className="text-xs font-medium text-blue-900 mb-2">{template.subject[parkingLanguage]}</p>
                          <div className="bg-white rounded p-2 text-xs text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto font-mono">
                            {template.body[parkingLanguage].split('<p>').slice(1, 3).join('<p>').replace(/<[^>]+>/g, '')}
                          </div>
                          {sendMode === 'sequence' && (
                            <p className="text-xs text-blue-700 mt-2 font-semibold">
                              Will send all 4 emails with 2-day spacing, skipping weekends
                            </p>
                          )}
                          {sendMode === 'single' && (
                            <p className="text-xs text-blue-700 mt-2 font-semibold">
                              Will send only this email immediately
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900">Recipients ({emailRecipients.length + customEmails.length})</label>
                  {availableRecipients.length > 0 && (
                    <button
                      onClick={handleAddAllRecipients}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded font-medium"
                    >
                      Add All ({availableRecipients.length})
                    </button>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {emailRecipients.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-sm">
                      <span className="text-gray-900">{r.displayName} ({r.email})</span>
                      <button
                        onClick={() => handleRemoveRecipient(r.id)}
                        className="text-black hover:text-gray-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {customEmails.map((email) => (
                    <div key={email} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-sm">
                      <span className="text-gray-900">{email}</span>
                      <button
                        onClick={() => handleRemoveCustomEmail(email)}
                        className="text-black hover:text-gray-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {availableRecipients.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Add from contacts:</label>
                    <select
                      onChange={(e) => {
                        const selected = availableRecipients.find((r) => r.id === e.target.value);
                        if (selected) handleAddRecipient(selected);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-gray-900 text-sm"
                    >
                      <option value="">Select a contact...</option>
                      {availableRecipients.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.company} ({r.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Or add custom email:</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={customEmailInput}
                      onChange={(e) => setCustomEmailInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleAddCustomEmail();
                      }}
                      placeholder="e.g., kzamic@gmail.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-gray-900 text-sm"
                    />
                    <button
                      onClick={handleAddCustomEmail}
                      disabled={!customEmailInput.trim()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Sender Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Sender</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSenderType('transactional')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      senderType === 'transactional'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    PayParq (Transactional)
                  </button>
                  <button
                    onClick={() => setSenderType('outreach')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      senderType === 'outreach'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Karlo (Outreach)
                  </button>
                </div>

                {senderType === 'outreach' && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Region:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSenderRegion('international')}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          senderRegion === 'international'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Karlo Zamic (Int'l)
                      </button>
                      <button
                        onClick={() => setSenderRegion('yugoslavia')}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          senderRegion === 'yugoslavia'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Karlo Žamić (Yu)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* A/B Test Toggle */}
              <div>
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={abTestEnabled}
                    onChange={(e) => {
                      setAbTestEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setEmailSubjectB('');
                        setEmailBodyB('');
                      } else {
                        setEmailSubjectB(emailSubject);
                        setEmailBodyB(emailBody);
                      }
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-gray-900">A/B Test this email?</span>
                    <p className="text-xs text-gray-600 mt-0.5">Variant A (left) is required. Variant B (right) is optional.</p>
                  </div>
                </label>
              </div>

              {/* Email Content - Single or Dual Layout */}
              {!abTestEnabled ? (
                <>
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Message</label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email message"
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Dual Editors for A/B Test */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Email A */}
                    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">A</span>
                        Variant A (Original)
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Subject A</label>
                          <input
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Email subject"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Message A</label>
                          <textarea
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            placeholder="Email message"
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email B */}
                    <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-black text-white rounded-full text-xs font-bold">B</span>
                        Variant B (Copy - Edit here)
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Subject B</label>
                          <input
                            type="text"
                            value={emailSubjectB}
                            onChange={(e) => setEmailSubjectB(e.target.value)}
                            placeholder="Email subject"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Message B</label>
                          <textarea
                            value={emailBodyB}
                            onChange={(e) => setEmailBodyB(e.target.value)}
                            placeholder="Email message"
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Progress */}
              {sendingProgress && (
                <div className={`p-3 rounded-lg text-sm ${
                  sendingProgress.includes('✅')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {sendingProgress}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseEmailModal}
                  disabled={!!sendingProgress}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  onClick={handleSendEmails}
                  disabled={
                    !!sendingProgress ||
                    (emailRecipients.length === 0 && customEmails.length === 0) ||
                    (selectedTemplate !== 'parking-sequence' && (!emailSubject.trim() || !emailBody.trim())) ||
                    (abTestEnabled && !emailSubjectB.trim()) ||
                    (abTestEnabled && !emailBodyB.trim())
                  }
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 bg-blue-600 hover:bg-blue-700`}
                >
                  {sendingProgress ? 'Processing...' : (
                    selectedTemplate === 'parking-sequence'
                      ? sendMode === 'sequence'
                        ? `Enroll in Sequence (${emailRecipients.length + customEmails.length})`
                        : `Send Email #${selectedParkingEmail} (${emailRecipients.length + customEmails.length})`
                      : `Send ${abTestEnabled ? '(A/B Test)' : ''} to ${emailRecipients.length + customEmails.length} recipient(s)`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Import CSV Data</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">City Name</label>
                <input
                  type="text"
                  value={importCity}
                  onChange={(e) => setImportCity(e.target.value)}
                  placeholder="e.g., Torino, Milano, Roma"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">CSV File</label>
                <p className="text-xs text-gray-600 mb-3">
                  Upload a CSV with columns: Company | Status | Next Action | Date | Notes
                </p>
                <div className={`block px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  importCity
                    ? 'border-blue-300 hover:bg-blue-50 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 opacity-50'
                }`}>
                  <input
                    type="file"
                    id="csv-upload"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={importLoading}
                    className="hidden"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer block">
                    <div className="text-center">
                      <div className={`mx-auto mb-2 text-lg ${importCity ? 'text-blue-600' : 'text-gray-400'}`}>📁</div>
                      <p className={`text-sm font-medium ${importCity ? 'text-gray-900' : 'text-gray-500'}`}>
                        {importCity ? 'Click to upload CSV file' : 'Enter city name first'}
                      </p>
                      <p className="text-xs text-gray-600">or drag and drop</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                {importLoading && <span className="text-sm text-gray-600">Processing...</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedCity ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 font-medium">Select a city to view and edit entries</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider w-36">Sequence</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider w-16">Email</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider w-16">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {COLUMNS.map(({ key }) => (
                        <td key={key} className="px-4 py-2">
                          {key === 'status' ? (
                            <select
                              value={row.status}
                              onChange={(e) => handleCellSave(row.id, 'status', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                            >
                              <option value="">—</option>
                              <option value="Newly Contacted">Newly Contacted</option>
                              <option value="DEMO Sent">DEMO Sent</option>
                              <option value="Closed">Closed</option>
                            </select>
                          ) : editingCell?.id === row.id && editingCell.field === key ? (
                            <input
                              autoFocus
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleCellSave(row.id, key, editValue)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellSave(row.id, key, editValue);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none bg-white text-gray-900"
                            />
                          ) : (
                            <div
                              onClick={() => handleCellClick(row.id, key, row[key])}
                              className="px-2 py-1 cursor-pointer hover:bg-blue-50 rounded text-sm text-gray-900 break-words min-h-[28px]"
                            >
                              {row[key] || <span className="text-gray-400 italic text-xs">click to edit</span>}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        {(() => {
                          const s = enrollmentStatuses[row.email];
                          if (!s || s.status === 'none') return <span className="text-xs text-gray-400">—</span>;
                          if (s.hasReplied || s.status === 'paused') return (
                            <span className="text-xs font-semibold text-black">Replied</span>
                          );
                          if (s.status === 'completed') return (
                            <span className="text-xs font-semibold text-black">Done</span>
                          );
                          if (s.status === 'active') return (
                            <span className="text-xs font-semibold text-blue-700">
                              Email #{s.currentEmailNumber}
                            </span>
                          );
                          return null;
                        })()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleOpenEmailModal(row)}
                          className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium"
                        >
                          Email
                        </button>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-black rounded font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredRows.length === 0 && !setupError && (
            <div className="text-center py-12 text-gray-500">
              No entries for {selectedCity}. Click <strong>Import CSV</strong> or <strong>Add Row</strong>.
            </div>
          )}

            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
              Click any cell to edit inline. Changes auto-save. {filteredRows.length} entries in {selectedCity}
            </div>
          </>
        )}
        </>
      )}
    </div>
  );
}
