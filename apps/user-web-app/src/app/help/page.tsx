'use client';

import { useLocale } from '@/components/LocaleProvider';

export default function HelpPage() {
  const { locale } = useLocale();

  const faqItems = [
    {
      en: { q: 'How do I book a parking spot?', a: 'Open the app, search for parking in your area, select a spot, and complete the booking.' },
      hr: { q: 'Kako rezerviram mjesto za parkiranje?', a: 'Otvorite aplikaciju, pretražite parking u vašoj oblasti, odaberite mjesto i dovršite rezervaciju.' }
    },
    {
      en: { q: 'Can I cancel my booking?', a: 'Yes, you can cancel your booking anytime before check-in, subject to the cancellation policy of your selected spot.' },
      hr: { q: 'Mogu li otkazati svoju rezervaciju?', a: 'Da, možete otkazati svoju rezervaciju u bilo kojem trenutku prije ulaska, podložno politici otkazivanja odabranog mjesta.' }
    },
    {
      en: { q: 'What payment methods do you accept?', a: 'We accept credit cards, debit cards, and other digital payment methods.' },
      hr: { q: 'Koje metode plaćanja prihvaćate?', a: 'Prihvaćamo kreditne kartice, debitne kartice i druge digitalne metode plaćanja.' }
    },
    {
      en: { q: 'Is my payment secure?', a: 'Yes, all payments are encrypted and processed through secure payment gateways.' },
      hr: { q: 'Je li moje plaćanje sigurno?', a: 'Da, sva plaćanja su šifrirana i obrađena kroz sigurne prolaze za plaćanje.' }
    },
  ];

  const currentFaq = faqItems.map(item => item[locale === 'en' ? 'en' : 'hr']);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">{locale === 'en' ? 'Help Centre' : 'Centar Pomoći'}</h1>
        <p className="text-gray-600 mb-8">{locale === 'en' ? 'Find answers to common questions' : 'Pronađite odgovore na česta pitanja'}</p>

        <div className="space-y-4">
          {currentFaq.map((item, idx) => (
            <details key={idx} className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-gray-300">
              <summary className="font-semibold text-black">{item.q}</summary>
              <p className="mt-3 text-gray-600 text-sm">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-3">{locale === 'en' ? 'Still need help?' : 'Trebate li dodatnu pomoć?'}</h2>
          <p className="text-gray-600 text-sm mb-4">
            {locale === 'en' ? 'Contact our support team through the app sidebar.' : 'Kontaktirajte naš tim podrške kroz bočnu traku aplikacije.'}
          </p>
          <a href="/app" className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            {locale === 'en' ? 'Back to App' : 'Natrag u Aplikaciju'}
          </a>
        </div>
      </div>
    </div>
  );
}
