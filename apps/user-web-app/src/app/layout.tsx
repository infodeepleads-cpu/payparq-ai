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
  title: "payparq | Software-only mobility for parking",
  description:
    "The world’s first mobile software-only platform for frictionless urban mobility.",
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
