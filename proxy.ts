import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/site";

const PUBLIC_FILE = /\.(?:webp|avif|jpg|jpeg|png|svg|ico|txt|xml|pdf|webmanifest)$/i;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/t/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (LOCALES.includes(first as (typeof LOCALES)[number])) {
    const response = NextResponse.next();
    response.headers.set("x-locale", first);
    response.headers.set("x-pathname", pathname);
    return response;
  }

  // Pick a language from the browser, then send the visitor to that prefix.
  const header = request.headers.get("accept-language") || "";
  const preferred = header.toLowerCase().includes("de") ? "de" : DEFAULT_LOCALE;
  const url = request.nextUrl.clone();
  url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|photos|favicon.ico).*)"],
};
