import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { site } from "./site";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachmentNote?: string;
}

const OUTBOX = path.join(process.cwd(), "data", "runtime", "outbox.json");

/**
 * Sends through Resend when RESEND_API_KEY is set. Without a key every message
 * is appended to data/runtime/outbox.json so the whole flow stays testable.
 */
export async function queueMail(mail: Mail): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || `${site.brand} <no-reply@${site.domain}>`;

  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        }),
      });
      if (res.ok) return { delivered: true };
    } catch {
      /* fall through to the outbox */
    }
  }

  try {
    await fs.mkdir(path.dirname(OUTBOX), { recursive: true });
    let existing: unknown[] = [];
    try {
      existing = JSON.parse(await fs.readFile(OUTBOX, "utf8"));
    } catch {
      existing = [];
    }
    existing.push({ ...mail, from, at: new Date().toISOString(), delivered: false });
    await fs.writeFile(OUTBOX, JSON.stringify(existing, null, 2), "utf8");
  } catch {
    /* never break a request because of the outbox */
  }
  return { delivered: false };
}

export function orderConfirmationMail(params: {
  locale: "en" | "de";
  name: string;
  orderId: string;
  codes: string[];
  total: number;
  password?: string;
  baseUrl: string;
}): Mail {
  const { locale, name, orderId, codes, total, password, baseUrl } = params;
  const link = `${baseUrl}/${locale}/order/${orderId}`;
  if (locale === "de") {
    return {
      to: "",
      subject: `Ihr Walnussbaum ist bestätigt — ${orderId}`,
      text: [
        `Liebe/r ${name},`,
        "",
        `vielen Dank. Die folgenden Bäume sind ab sofort auf Ihren Namen erfasst: ${codes.join(", ")}.`,
        `Bestellnummer: ${orderId} · Summe: ${total} €`,
        "",
        password ? `Ihr Eigentümer-Konto ist eingerichtet. Vorläufiges Passwort: ${password}` : "",
        `Bestellung und Zertifikat: ${link}`,
        "",
        "Wir fotografieren Ihren Baum in jeder Saison und berichten die Ernte in Kilogramm.",
        `${site.brand}`,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }
  return {
    to: "",
    subject: `Your walnut tree is confirmed — ${orderId}`,
    text: [
      `Dear ${name},`,
      "",
      `Thank you. The following trees are now recorded in your name: ${codes.join(", ")}.`,
      `Order: ${orderId} · Total: €${total}`,
      "",
      password ? `Your owner account is ready. Temporary password: ${password}` : "",
      `Order and certificate: ${link}`,
      "",
      "We photograph your tree every season and report its harvest in kilograms.",
      `${site.brand}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
