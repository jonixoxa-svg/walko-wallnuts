import Link from "next/link";
import { getDict } from "@/lib/i18n";

export default function NotFound() {
  const dict = getDict("en");
  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-900 px-6 text-center text-ivory">
      <div>
        <p className="font-display text-6xl text-gold-light">404</p>
        <h1 className="mt-4 font-display text-3xl">{dict.notFound.title}</h1>
        <p className="mt-3 text-[0.95rem] text-ivory/70">{dict.notFound.lead}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/en/orchard" className="btn btn-gold">
            {dict.notFound.cta}
          </Link>
          <Link href="/en" className="btn btn-ghost">
            {dict.notFound.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
