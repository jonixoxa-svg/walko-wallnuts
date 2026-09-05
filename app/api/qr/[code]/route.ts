import QRCode from "qrcode";
import { baseUrl } from "@/lib/site";

/** QR image for a tree tag. Scanning it opens the tree's public record. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const target = `${baseUrl()}/t/${clean}`;
  const format = new URL(request.url).searchParams.get("format") === "png" ? "png" : "svg";

  if (format === "png") {
    const buffer = await QRCode.toBuffer(target, {
      width: 720,
      margin: 1,
      color: { dark: "#1e3a2b", light: "#fbf8f2" },
    });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${clean}-qr.png"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const svg = await QRCode.toString(target, {
    type: "svg",
    margin: 1,
    color: { dark: "#1e3a2b", light: "#00000000" },
  });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
  });
}
