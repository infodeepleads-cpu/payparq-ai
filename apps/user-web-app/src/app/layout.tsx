import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { LocaleProvider } from "@/components/LocaleProvider";
import { RuntimeTextTranslator } from "@/components/RuntimeTextTranslator";
import { AppLocale, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/locale";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "payparq.com",
  description:
    "The world’s first mobile software-only platform for frictionless urban mobility.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=pp_static_v4", type: "image/x-icon", sizes: "any" },
      { url: "/icon-192.png?v=pp_static_v4", type: "image/png", sizes: "192x192" },
      { url: "/favicon.svg?v=pp_static_v4", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico?v=pp_static_v4"],
    apple: [{ url: "/icon-192.png?v=pp_static_v4", sizes: "192x192", type: "image/png" }],
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
    <html lang={locale}>
      <body className={`${plusJakarta.className} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){if(typeof window==='undefined')return;var n=window.navigator;if(n&&'serviceWorker' in n){n.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){});}if('caches' in window){window.caches.keys().then(function(keys){keys.forEach(function(k){window.caches.delete(k);});}).catch(function(){});}})();",
          }}
        />
        <LocaleProvider initialLocale={locale}>
          <RuntimeTextTranslator />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
