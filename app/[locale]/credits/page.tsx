import type { Metadata } from "next";
import Image from "next/image";
import { getDict, resolveLocale } from "@/lib/i18n";
import { photos } from "@/lib/photos";

export const metadata: Metadata = { title: "Photo credits", robots: { index: false } };

export default async function CreditsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  return (
    <div className="pb-24 pt-32">
      <div className="shell max-w-4xl">
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)]">{dict.footer.photoCredits}</h1>
        <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink/65">
          {locale === "de"
            ? "Die Fotos dieser Demo-Installation stammen aus frei lizenzierten Quellen (Creative Commons / Public Domain) und stehen hier stellvertretend für die eigenen Aufnahmen der Anlage. Vor dem Livegang werden sie durch Bilder des Guts ersetzt."
            : "The photographs in this demo installation come from freely licensed sources (Creative Commons / public domain) and stand in for the estate's own photography. They are replaced by the estate's images before launch."}
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {photos.map((photo) => (
            <li key={photo.name} className="card flex items-center gap-4 p-3">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                <Image src={photo.src} alt="" fill sizes="96px" quality={55} className="object-cover" />
              </div>
              <div className="min-w-0 text-[0.78rem]">
                <p className="truncate font-medium text-ink/80">{photo.credit || "Unknown"}</p>
                <p className="text-ink/50">{photo.license}</p>
                {photo.creditUrl && (
                  <a
                    href={photo.creditUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-underline text-forest"
                  >
                    {dict.common.open} ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
