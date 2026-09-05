import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";
import { getDict, resolveLocale } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.meta.login.title, description: dict.meta.login.description, robots: { index: false } };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "admin" ? `/${locale}/admin` : user.role === "worker" ? `/${locale}/field` : `/${locale}/dashboard`);
  }

  return (
    <div className="bg-beige/25 pb-24 pt-32">
      <div className="shell max-w-5xl">
        <LoginClient locale={locale} dict={dict} />
      </div>
    </div>
  );
}
