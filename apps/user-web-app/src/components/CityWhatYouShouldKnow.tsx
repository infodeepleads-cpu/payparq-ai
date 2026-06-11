'use client';

import { useLocale } from '@/components/LocaleProvider';

interface CityWhatYouShouldKnowProps {
  cityName: string;
}

export function CityWhatYouShouldKnow({ cityName }: CityWhatYouShouldKnowProps) {
  const { locale } = useLocale();

  const content = {
    hr: {
      title: `Sve što trebate znati o parkiranju u ${cityName}`,
      paragraphs: [
        `Ne dopustite da parkiranje pokvari vaše putovanje. PayParqova mreža rezerviranih parkirnih mjesta - uključujući privatna parkirališta i osigurane objekte - dovodi vas bliže ${cityName}. Rezervacijom unaprijed osiguravate najbolju cijenu i slobodno mjesto.`,
        `PayParq je vodeće hrvatsko rješenje za parkiranje, kojemu vjeruje više od 100.000+ vozača. Naša mreža uključuje gradska parkirišta, privatna parkirališta i osigurana dvorišta. Ako trebate kratkoročno ili dugoročno parkiranje u ${cityName}, PayParq vas pokriva.`,
        `Naš inteligentni tražilac omogućuje vam lako pronalaženje najboljeg parkirnog mjesta u ${cityName} - birajte prema najnižoj cijeni, najbližoj lokaciji ili dodatnim značajkama poput CCTV-a, punjenja EV vozila ili natkrivenog parkinga.`,
        `Rezervirajte parkiranje u ${cityName} unaprijed - i imate ćete pouzdano mjesto koje čeka kad stignete. Dostupno za kratke ili dugoročne boravke, uključujući noćno parkiranje.`,
        `PayParq nudi više od tradicionalnih parkirališta. Pružamo pristup pristupačnim alternativama poput osiguranih privatnih dvorišta, često bliže centru ${cityName} i po boljim cijenama.`,
      ],
      faqTitle: 'Česta pitanja',
      faqs: [
        {
          q: `Zašto rezervirati parkiranje unaprijed u ${cityName}?`,
          a: 'Rezervacijom unaprijed osiguravate najbolje cijene, garantirano slobodno mjesto i mogućnost odabira između različitih parkirnih opcija.',
        },
        {
          q: `Nudi li PayParq sigurno parkiranje u ${cityName}?`,
          a: 'Da, naša parkirna mjesta u ${cityName} uključuju CCTV nadzor, osvjetljenje i osigurane objekte za maksimalnu sigurnost vašeg vozila.',
        },
        {
          q: `Koliko košta parkiranje u ${cityName}?`,
          a: 'Cijene parkiranje u ${cityName} variraju ovisno o lokaciji i tipu parkinga. Koristite našu aplikaciju za usporedbu cijena u realnom vremenu.',
        },
        {
          q: `Koje opcije parkinga PayParq nudi u ${cityName}?`,
          a: 'Nudi ćemo natkriveno parkiranje, privatna dvorišta, osigurane objekte i parkirišta na javnim mjestima diljem ${cityName}.',
        },
        {
          q: `Ima li pristupačnog parkinga u ${cityName}?`,
          a: 'Da, imamo parkirna mjesta s pristupom za osobe s invaliditetom na pojedinim lokacijama u ${cityName}.',
        },
      ],
    },
    en: {
      title: `All You Need to Know About Parking in ${cityName}`,
      paragraphs: [
        `Don't let parking spoil your trip. PayParq's network of reserved parking spaces - including private lots and secured facilities - gets you closer to ${cityName}. By booking in advance, you secure the best price and a guaranteed space.`,
        `PayParq is the leading Croatian parking solution, trusted by over 100,000+ drivers. Our network includes city parking, private lots and secured courtyards. Whether you need short-term or long-term parking in ${cityName}, PayParq has you covered.`,
        `Our intelligent parking finder makes it easy to find the best parking spot in ${cityName} - choose by lowest price, closest location or extra features like CCTV, EV charging or covered parking.`,
        `Book parking in ${cityName} in advance - and you'll have a reliable spot waiting when you arrive. Available for short or long stays, including overnight parking.`,
        `PayParq offers more than traditional parking. We provide access to affordable alternatives like secured private courtyards, often closer to ${cityName} center and at better prices.`,
      ],
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        {
          q: `Why book parking in advance in ${cityName}?`,
          a: 'Booking in advance guarantees the best prices, a reserved spot, and the ability to choose from different parking options.',
        },
        {
          q: `Does PayParq offer secure parking in ${cityName}?`,
          a: 'Yes, our parking spots in ${cityName} feature CCTV surveillance, lighting, and secured facilities for maximum vehicle security.',
        },
        {
          q: `How much does parking cost in ${cityName}?`,
          a: 'Parking prices in ${cityName} vary by location and type. Use our app to compare real-time pricing.',
        },
        {
          q: `What parking options does PayParq offer in ${cityName}?`,
          a: 'We offer covered parking, private courtyards, secured facilities, and street parking throughout ${cityName}.',
        },
        {
          q: `Is accessible parking available in ${cityName}?`,
          a: 'Yes, we have accessible parking spaces at select locations in ${cityName}.',
        },
      ],
    },
  };

  const texts = locale === 'hr' ? content.hr : content.en;

  return (
    <section className="w-full px-6 md:px-12 py-16 bg-white border-b border-black/10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-8">
          {texts.title}
        </h2>

        <div className="space-y-6 mb-12">
          {texts.paragraphs.map((para, idx) => (
            <p key={idx} className="text-base text-black/70 leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        <div className="border-t border-black/10 pt-12">
          <h3 className="text-2xl font-semibold tracking-tight text-black mb-6">
            {texts.faqTitle}
          </h3>

          <div className="space-y-6">
            {texts.faqs.map((faq, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-6">
                <h4 className="font-semibold text-black mb-2">
                  {faq.q}
                </h4>
                <p className="text-black/70 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
