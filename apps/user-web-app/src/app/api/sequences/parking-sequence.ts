// Parking Owner Email Sequence - 4 emails, 5 languages

export const PARKING_SEQUENCE = {
  name: 'Parking Owner Revenue Sequence',
  description: '4-email sequence for parking space owners',

  emails: [
    {
      number: 1,
      delayDays: 0,
      templates: {
        hr: {
          subject: '🅿️ Zaradite od svog parking mjesta',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Zaradite od svog parking mjesta</h1><p>Lijep Poz,</p><p>evo za Vaš parking ako želite pogledati na vrijeme za ovu sezonu</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Započnite sada →</a></p><p>Ako sta treba, javite ako imate jos interes, pa ću Vam objasniti.</p><p>Srdačno,<br>PayParq Tim</p></div></body></html>`
        },
        en: {
          subject: '🅿️ Earn from your parking space',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Earn from your parking space</h1><p>Hello,</p><p>Turn your parking space into steady income this season. Check out how it works:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Get Started →</a></p><p>Have questions? Feel free to ask — we're here to help.</p><p>Best regards,<br>PayParq Team</p></div></body></html>`
        },
        de: {
          subject: '🅿️ Verdienen Sie mit Ihrem Parkplatz',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Verdienen Sie mit Ihrem Parkplatz</h1><p>Hallo,</p><p>Verwandeln Sie Ihren Parkplatz diese Saison in stabiles Einkommen. Schauen Sie, wie es funktioniert:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Jetzt beginnen →</a></p><p>Haben Sie Fragen? Kontaktieren Sie uns gerne — wir helfen Ihnen.</p><p>Mit freundlichen Grüßen,<br>PayParq Team</p></div></body></html>`
        },
        it: {
          subject: '🅿️ Guadagna dal tuo parcheggio',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Guadagna dal tuo parcheggio</h1><p>Ciao,</p><p>Trasforma il tuo parcheggio in un reddito stabile questa stagione. Scopri come funziona:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Inizia ora →</a></p><p>Hai domande? Non esitare a chiedere — siamo qui per aiutarti.</p><p>Cordiali saluti,<br>PayParq Team</p></div></body></html>`
        },
        fr: {
          subject: '🅿️ Gagnez avec votre parking',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Gagnez avec votre parking</h1><p>Bonjour,</p><p>Transformez votre parking en revenu stable cette saison. Découvrez comment cela fonctionne:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Commencer →</a></p><p>Des questions? N'hésitez pas à nous contacter — nous sommes là pour vous aider.</p><p>Cordialement,<br>PayParq Team</p></div></body></html>`
        }
      }
    },

    {
      number: 2,
      delayDays: 2,
      templates: {
        hr: {
          subject: '🎯 Naš Agent je spreman pomoći s Onboardingom',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Agent je spreman pomagati</h1><p>Zdravo,</p><p>Naš Agent je spreman pomoći s Onboardingom, možemo učiniti sve za Vas. Da li biste pogledali draft? Sve sto nam treba je link Vase web stranice ili email adresa ako nemate web stranicu.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Kontaktirajte nas →</a></p><p>Čekamo Vas!</p></div></body></html>`
        },
        en: {
          subject: '🎯 Our Agent is ready to help with onboarding',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Agent ready to help</h1><p>Hi,</p><p>Our Agent is ready to help with onboarding — we can handle everything for you. Would you like to see a draft? All we need is your website link or email address.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Contact us →</a></p><p>Looking forward to it!</p></div></body></html>`
        },
        de: {
          subject: '🎯 Unser Agent ist bereit, bei der Onboarding-Hilfe',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Agent bereit zu helfen</h1><p>Hallo,</p><p>Unser Agent ist bereit, Ihnen beim Onboarding zu helfen — wir können alles für Sie übernehmen. Möchten Sie einen Entwurf sehen? Wir benötigen nur Ihren Website-Link oder Ihre E-Mail-Adresse.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Kontaktieren Sie uns →</a></p><p>Wir freuen uns darauf!</p></div></body></html>`
        },
        it: {
          subject: '🎯 Il nostro Agente è pronto ad aiutare con l\'onboarding',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Agente pronto ad aiutare</h1><p>Ciao,</p><p>Il nostro Agente è pronto ad aiutarti con l'onboarding — possiamo gestire tutto per te. Vuoi vedere una bozza? Abbiamo solo bisogno del link del tuo sito web o dell'indirizzo email.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Contattaci →</a></p><p>Non vediamo l'ora!</p></div></body></html>`
        },
        fr: {
          subject: '🎯 Notre Agent est prêt à aider avec l\'onboarding',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Agent prêt à aider</h1><p>Bonjour,</p><p>Notre Agent est prêt à vous aider avec l'intégration — nous pouvons tout gérer pour vous. Voulez-vous voir un brouillon? Nous avons besoin de votre lien de site web ou de votre adresse email.</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Nous contacter →</a></p><p>On a hâte!</p></div></body></html>`
        }
      }
    },

    {
      number: 3,
      delayDays: 2,
      templates: {
        hr: {
          subject: '📱 Agent follow-up',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Nastavak razgovora</h1><p>Zdravo,</p><p>Malo nas je zabrinulo što nismo čuli od Vas. Možda ste bili zauzeti ili ste imali pitanja?</p><p>Slobodno nam javite - Agent čeka Vaš odgovor i spreman je odgovoriti na sve što Vas zanima!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Odgovori sada →</a></p></div></body></html>`
        },
        en: {
          subject: '📱 Following up on onboarding',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Checking in</h1><p>Hi,</p><p>We were wondering if you've had a chance to review our onboarding offer. Maybe you were busy or had some questions?</p><p>Feel free to reach out — our Agent is waiting for your response and ready to answer anything!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Reply now →</a></p></div></body></html>`
        },
        de: {
          subject: '📱 Verfolgung des Onboardings',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Nachverfolgung</h1><p>Hallo,</p><p>Wir fragten uns, ob Sie unsere Onboarding-Anfrage überprüft haben. Vielleicht waren Sie beschäftigt oder hatten Fragen?</p><p>Kontaktieren Sie uns gerne — unser Agent wartet auf Ihre Antwort!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Jetzt antworten →</a></p></div></body></html>`
        },
        it: {
          subject: '📱 Seguendo l\'onboarding',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Controllo</h1><p>Ciao,</p><p>Ci chiedevamo se hai avuto la possibilità di rivedere la nostra offerta di onboarding. Forse sei stato occupato o hai avuto domande?</p><p>Non esitare a contattarci — il nostro Agente aspetta la tua risposta!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Rispondi ora →</a></p></div></body></html>`
        },
        fr: {
          subject: '📱 Suivi de l\'intégration',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Suivi</h1><p>Bonjour,</p><p>Nous nous demandions si vous aviez eu l'occasion d'examiner notre offre d'intégration. Peut-être étiez-vous occupé ou aviez-vous des questions?</p><p>N'hésitez pas à nous contacter — notre Agent attend votre réponse!</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/contact" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Répondre maintenant →</a></p></div></body></html>`
        }
      }
    },

    {
      number: 4,
      delayDays: 2,
      templates: {
        hr: {
          subject: '🔔 Zadnji poziv za ovu sezonu!',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Zadnji poziv za ovu sezonu!</h1><p>Zdravo,</p><p>Zaradite sada — kliknite i pokreni svoj parking:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Počni sada →</a></p><p>Ne propusti ovu priliku!</p></div></body></html>`
        },
        en: {
          subject: '🔔 Last Call for this Season!',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Last Call for this Season!</h1><p>Hi,</p><p>Earn now — click and start your parking:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Start now →</a></p><p>Don't miss this opportunity!</p></div></body></html>`
        },
        de: {
          subject: '🔔 Letzter Aufruf für diese Saison!',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Letzter Aufruf für diese Saison!</h1><p>Hallo,</p><p>Verdiene jetzt — klick und starte dein Parkplatz:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Jetzt starten →</a></p><p>Verpasse diese Chance nicht!</p></div></body></html>`
        },
        it: {
          subject: '🔔 Ultima chiamata per questa stagione!',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Ultima chiamata per questa stagione!</h1><p>Ciao,</p><p>Guadagna ora — clicca e avvia il tuo parcheggio:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Inizia ora →</a></p><p>Non perdere questa opportunità!</p></div></body></html>`
        },
        fr: {
          subject: '🔔 Dernier appel pour cette saison!',
          html: `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #5F3DFC;">Dernier appel pour cette saison!</h1><p>Bonjour,</p><p>Gagnez maintenant — cliquez et lancez votre parking:</p><p style="text-align: center; margin: 30px 0;"><a href="https://www.payparq.com/list-your-space" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Commencer maintenant →</a></p><p>Ne manquez pas cette opportunité!</p></div></body></html>`
        }
      }
    }
  ]
};
