import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";

function csv(rows: (string | number | undefined)[][]): string {
  const quote = String.fromCharCode(34);
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === undefined || cell === null ? "" : String(cell);
          return /[",;\n]/.test(value) ? quote + value.split(quote).join(quote + quote) + quote : value;
        })
        .join(";")
    )
    .join("\r\n");
}

/** Excel-friendly CSV export (semicolon separated, BOM prefixed). */
export async function GET(request: Request) {
  const user = await requireRole(["admin"]);
  if (!user) return new Response("Forbidden", { status: 403 });

  const type = new URL(request.url).searchParams.get("type") ?? "trees";
  const db = await getDb();
  let rows: (string | number | undefined)[][];
  let name = type;

  if (type === "orders") {
    rows = [["order", "date", "customer", "email", "country", "trees", "total_eur", "method", "status"]];
    db.orders.forEach((o) =>
      rows.push([
        o.id,
        o.date.slice(0, 10),
        o.name,
        o.email,
        o.country,
        o.items.map((i) => i.code).join(" "),
        o.total,
        o.method,
        o.status,
      ])
    );
  } else if (type === "owners") {
    rows = [["id", "name", "email", "country", "city", "since", "trees", "last_login"]];
    db.owners
      .filter((o) => o.role === "owner")
      .forEach((o) =>
        rows.push([
          o.id,
          o.name,
          o.email,
          o.country,
          o.city,
          o.since,
          db.trees.filter((t) => t.ownerId === o.id).length,
          o.lastLogin?.slice(0, 10),
        ])
      );
  } else {
    name = "trees";
    rows = [
      [
        "code",
        "parcel",
        "row",
        "col",
        "cultivar",
        "planted",
        "status",
        "owner",
        "health",
        "phase",
        "last_inspection",
        "estimate_kg",
        "harvest_2025_kg",
      ],
    ];
    db.trees.forEach((t) =>
      rows.push([
        t.code,
        t.parcel,
        t.row,
        t.col,
        t.cultivar,
        t.planted,
        t.status,
        db.owners.find((o) => o.id === t.ownerId)?.name,
        t.health,
        t.phase,
        t.lastInspection,
        t.estimateKg,
        t.harvests.find((h) => h.year === 2025)?.kg,
      ])
    );
  }

  return new Response("﻿" + csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="walko-${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
