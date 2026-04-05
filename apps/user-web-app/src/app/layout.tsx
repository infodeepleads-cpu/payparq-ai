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

const PAYPARQ_FAVICON_DATA_URI =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E%3Ccircle%20cx='32'%20cy='32'%20r='32'%20fill='%23000000'/%3E%3Cpath%20d='M24%2018h10.5c7%200%2011.5%204.2%2011.5%2010.3%200%206.2-4.5%2010.7-11.5%2010.7H30V46h-6V18zm6%205v11h4.2c3.7%200%205.8-2.1%205.8-5.5%200-3.4-2.1-5.5-5.8-5.5H30z'%20fill='%23ffffff'/%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "payparq | Software-only mobility for parking",
  description:
    "The world’s first mobile software-only platform for frictionless urban mobility.",
  icons: {
    icon: PAYPARQ_FAVICON_DATA_URI,
    shortcut: PAYPARQ_FAVICON_DATA_URI,
    apple: PAYPARQ_FAVICON_DATA_URI,
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
        <LocaleProvider initialLocale={locale}>
          <RuntimeTextTranslator />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
