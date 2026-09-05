import { redirect } from "next/navigation";

/** Short link printed on the tree tag: /t/WT-0417 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const lang = request.headers.get("accept-language")?.toLowerCase().includes("de") ? "de" : "en";
  redirect(`/${lang}/tree/${clean}`);
}
