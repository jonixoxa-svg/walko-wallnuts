import { notFound } from "next/navigation";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { getDict } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";
import { LOCALES, isLocale } from "@/lib/site";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDict(locale);
  const user = await getSessionUser();

  return (
    <>
      <Nav locale={locale} dict={dict} user={user ? { name: user.name, role: user.role } : null} />
      <main id="main" className="min-h-screen">
        {children}
      </main>
      <Footer locale={locale} dict={dict} />
    </>
  );
}
