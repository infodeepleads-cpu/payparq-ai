import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { LocaleProvider } from "@/components/LocaleProvider";
import { RuntimeTextTranslator } from "@/components/RuntimeTextTranslator";
import { WebVitals } from "@/components/WebVitals";
import { AppLocale, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/locale";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.payparq.com"),
  title: "Payparq | Frictionless Parking and Urban Mobility",
  description:
    "Payparq is the software-only platform for frictionless parking, access, and urban mobility for drivers, operators, and modern cities.",
  applicationName: "Payparq",
  alternates: {
    canonical: "https://www.payparq.com",
    languages: {
      "hr": "https://www.payparq.com",
      "en": "https://www.payparq.com/en",
      "hr-HR": "https://www.payparq.com",
      "en-US": "https://www.payparq.com/en",
      "x-default": "https://www.payparq.com",
    },
  },
  openGraph: {
    title: "Payparq | Frictionless Parking and Urban Mobility",
    description:
      "Payparq is the software-only platform for frictionless parking, access, and urban mobility for drivers, operators, and modern cities.",
    siteName: "Payparq",
  },
  twitter: {
    title: "Payparq | Frictionless Parking and Urban Mobility",
    description:
      "Payparq is the software-only platform for frictionless parking, access, and urban mobility for drivers, operators, and modern cities.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=pp_static_v4", type: "image/x-icon", sizes: "any" },
      { url: "/icon-512.png?v=pp_static_v4", type: "image/png", sizes: "512x512" },
      { url: "/favicon.svg?v=pp_static_v4", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico?v=pp_static_v4"],
    apple: [{ url: "/icon-512.png?v=pp_static_v4", sizes: "512x512", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const localeFromCookie = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const localeFromHeader = normalizeLocale(headerStore.get("x-locale"));
  const locale: AppLocale = localeFromCookie ?? localeFromHeader ?? DEFAULT_LOCALE;

  return (
    <html lang={locale} translate="no">
      <head>
        <meta name="google" content="notranslate" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Payparq",
              url: "https://www.payparq.com",
              logo: "https://www.payparq.com/logo.png",
              description:
                "Payparq is the software-only platform for frictionless parking, access, and urban mobility for drivers, operators, and modern cities.",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5.0",
                reviewCount: "133",
                bestRating: "5",
                worstRating: "1"
              }
            }),
          }}
        />
      </head>
      <body className={`${plusJakarta.className} antialiased`}>
        <LocaleProvider initialLocale={locale}>
          <RuntimeTextTranslator />
          <WebVitals />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
