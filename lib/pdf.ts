import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { baseUrl, site } from "./site";
import type { Order, Tree } from "./model";

const FOREST = rgb(0.118, 0.227, 0.169);
const GOLD = rgb(0.776, 0.631, 0.357);
const INK = rgb(0.063, 0.102, 0.078);
const MUTED = rgb(0.45, 0.44, 0.4);

/** pdf-lib standard fonts are WinAnsi only — drop anything they cannot draw. */
function safe(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/[^\u0000-\u00FF\u20AC]/g, "");
}


export async function ownershipCertificate(params: {
  tree: Tree;
  ownerName: string;
  since: string;
  locale: "en" | "de";
  giftMessage?: string;
}): Promise<Uint8Array> {
  const { tree, ownerName, since, locale, giftMessage } = params;
  const de = locale === "de";
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]); // A4 landscape
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: rgb(0.984, 0.972, 0.949) });
  page.drawRectangle({ x: 24, y: 24, width: 794, height: 547, borderColor: GOLD, borderWidth: 1.2 });
  page.drawRectangle({ x: 32, y: 32, width: 778, height: 531, borderColor: FOREST, borderWidth: 0.5 });

  page.drawText(safe(site.brand.toUpperCase()), {
    x: 64,
    y: 505,
    size: 15,
    font: sans,
    color: FOREST,
  });
  page.drawText(safe(de ? "EIGENTUMSZERTIFIKAT" : "CERTIFICATE OF TREE OWNERSHIP"), {
    x: 64,
    y: 452,
    size: 30,
    font: serifBold,
    color: INK,
  });
  page.drawLine({ start: { x: 64, y: 436 }, end: { x: 420, y: 436 }, thickness: 1, color: GOLD });

  const intro = de
    ? "Hiermit wird bestätigt, dass der nachstehend bezeichnete Walnussbaum im Eigentum von"
    : "This certifies that the walnut tree described below is owned by";
  page.drawText(safe(intro), { x: 64, y: 402, size: 11, font: sans, color: MUTED });
  page.drawText(safe(ownerName), { x: 64, y: 366, size: 26, font: serifBold, color: FOREST });

  const rows: [string, string][] = [
    [de ? "Baumnummer" : "Tree number", tree.code],
    [de ? "Sorte" : "Cultivar", tree.cultivar],
    [de ? "Parzelle / Reihe" : "Parcel / row", `${tree.parcel} / ${tree.row}`],
    [de ? "Gepflanzt" : "Planted", String(tree.planted)],
    [de ? "Standort" : "Location", site.location.label],
    [de ? "Koordinaten" : "Coordinates", `${tree.lat.toFixed(5)}, ${tree.lng.toFixed(5)}`],
    [de ? "Im Eigentum seit" : "Owned since", since],
  ];

  rows.forEach(([label, value], i) => {
    const y = 320 - i * 26;
    page.drawText(safe(label.toUpperCase()), { x: 64, y, size: 8, font: sans, color: MUTED });
    page.drawText(safe(value), { x: 210, y: y - 1, size: 12, font: serifBold, color: INK });
  });

  if (giftMessage) {
    page.drawText(safe(`“${giftMessage}”`), { x: 64, y: 122, size: 11, font: serif, color: MUTED, maxWidth: 420 });
  }

  const qrPng = await QRCode.toBuffer(`${baseUrl()}/t/${tree.code}`, {
    width: 420,
    margin: 0,
    color: { dark: "#1e3a2b", light: "#fbf8f2" },
  });
  const qrImage = await pdf.embedPng(qrPng);
  page.drawImage(qrImage, { x: 620, y: 210, width: 150, height: 150 });
  page.drawText(safe(de ? "Baumpass scannen" : "Scan the tree passport"), {
    x: 620,
    y: 192,
    size: 8,
    font: sans,
    color: MUTED,
  });

  const disclaimer = de
    ? "Pflege, Dokumentation und Erntebericht sind für die Ertragszeit des Baumes inkludiert. Es besteht kein Anspruch auf eine bestimmte Erntemenge oder Rendite."
    : "Care, documentation and harvest reporting are included for the productive life of the tree. No harvest quantity or financial return is guaranteed.";
  page.drawText(safe(disclaimer), { x: 64, y: 82, size: 8.5, font: sans, color: MUTED, maxWidth: 520, lineHeight: 12 });

  page.drawText(safe(`${site.legalName} · ${site.contact.addressLines.slice(1).join(", ")}`), {
    x: 64,
    y: 52,
    size: 8,
    font: sans,
    color: MUTED,
  });
  page.drawText(safe(`${de ? "Ausgestellt" : "Issued"}: ${new Date().toISOString().slice(0, 10)}`), {
    x: 640,
    y: 52,
    size: 8,
    font: sans,
    color: MUTED,
  });

  return pdf.save();
}

export async function invoicePdf(params: { order: Order; locale: "en" | "de" }): Promise<Uint8Array> {
  const { order, locale } = params;
  const de = locale === "de";
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4 portrait
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawText(safe(site.brand.toUpperCase()), { x: 48, y: 780, size: 13, font: sansBold, color: FOREST });
  page.drawText(safe(site.contact.addressLines.slice(1).join(", ")), { x: 48, y: 762, size: 8.5, font: sans, color: MUTED });
  page.drawText(safe(de ? "RECHNUNG" : "INVOICE"), { x: 48, y: 712, size: 24, font: sansBold, color: INK });

  page.drawText(safe(`${de ? "Rechnungsnummer" : "Invoice number"}: ${order.id}`), { x: 48, y: 684, size: 10, font: sans, color: INK });
  page.drawText(safe(`${de ? "Datum" : "Date"}: ${order.date.slice(0, 10)}`), { x: 48, y: 668, size: 10, font: sans, color: INK });

  page.drawText(safe(de ? "Rechnungsempfänger" : "Billed to"), { x: 340, y: 684, size: 8, font: sans, color: MUTED });
  const addressLines = [order.name, order.address, [order.zip, order.city].filter(Boolean).join(" "), order.country].filter(
    Boolean
  ) as string[];
  addressLines.forEach((line, i) => {
    page.drawText(safe(line), { x: 340, y: 668 - i * 13, size: 10, font: sans, color: INK });
  });

  let y = 590;
  page.drawLine({ start: { x: 48, y: y + 14 }, end: { x: 547, y: y + 14 }, thickness: 0.8, color: FOREST });
  page.drawText(safe(de ? "Position" : "Item"), { x: 48, y, size: 9, font: sansBold, color: INK });
  page.drawText(safe(de ? "Betrag" : "Amount"), { x: 480, y, size: 9, font: sansBold, color: INK });
  y -= 8;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 0.4, color: MUTED });

  order.items.forEach((item) => {
    y -= 22;
    page.drawText(safe(`${de ? "Walnussbaum" : "Walnut tree"} ${item.code}`), { x: 48, y, size: 10, font: sans, color: INK });
    page.drawText(safe(`€ ${item.price.toFixed(2)}`), { x: 480, y, size: 10, font: sans, color: INK });
  });

  y -= 30;
  page.drawLine({ start: { x: 340, y: y + 14 }, end: { x: 547, y: y + 14 }, thickness: 0.4, color: MUTED });
  page.drawText(safe(de ? "Gesamt" : "Total"), { x: 340, y, size: 12, font: sansBold, color: INK });
  page.drawText(safe(`€ ${order.total.toFixed(2)}`), { x: 480, y, size: 12, font: sansBold, color: FOREST });

  y -= 40;
  page.drawText(safe(
    de
      ? "Zahlungsart: " + order.method + (order.demo ? " (Demo-Installation, keine echte Zahlung)" : "")
      : "Payment method: " + order.method + (order.demo ? " (demo installation, no real payment taken)" : "")),
    { x: 48, y, size: 9, font: sans, color: MUTED }
  );
  y -= 16;
  page.drawText(safe(
    de
      ? `UID: ${site.contact.vat} · ${site.contact.register}`
      : `VAT ID: ${site.contact.vat} · ${site.contact.register}`),
    { x: 48, y, size: 8.5, font: sans, color: MUTED }
  );
  y -= 14;
  page.drawText(safe(`IBAN: ${site.contact.iban} · BIC: ${site.contact.bic}`), { x: 48, y, size: 8.5, font: sans, color: MUTED });

  return pdf.save();
}
