# Walko Wallnuts — walnut tree ownership platform

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jonixoxa-svg/walko-wallnuts)

A complete, working website for selling and managing individual walnut trees in a
2,000-tree orchard. English and German only; there is no third language anywhere in
the interface or content.

- **2,000 trees**, each with a number (`WT-0001` … `WT-2000`), a parcel, a row, a
  cultivar, a planting year, a condition record, photographs and a harvest history.
- **700 trees are owned**, **1,300 are for sale** at **€200** each.
- Visitors pick an exact tree on an interactive map, buy it, and immediately get an
  owner account, a certificate and an invoice.
- Owners follow their trees: photos, season phase, inspection notes, harvest in
  kilograms, seasonal reports and documents.
- The field team records inspections from a phone (QR scan, photo upload).
- The estate office manages every tree, order, owner, announcement and export.

## Running it

```bash
npm install
npm run dev      # http://localhost:3012
```

The first request seeds the database into `data/runtime/db.json` (about 7 MB). With the
server stopped, `npm run reset` clears it and the next start rebuilds a pristine orchard
— the seed is deterministic, so the same 2,000 trees come back every time.

```bash
npm run build && npm start   # production build
npm run backup               # snapshot db + outbox + field photos into data/backups/
npm run reset                # clear runtime data (server stopped) and reseed on next start
```

## Deploying to Render

The repository contains a Blueprint (`render.yaml`), so Render configures itself:

1. Push this folder to a GitHub/GitLab repository.
2. Render dashboard → **New → Blueprint** → pick the repository → **Apply**.
   It creates a Node web service: `npm ci && npm run build`, `npm run start`,
   health check on `/api/health`, `SESSION_SECRET` generated automatically.
3. Optional environment variables (all blank by default, all safe to leave blank):
   `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`, `RESEND_API_KEY`,
   `MAIL_FROM`, and `NEXT_PUBLIC_BASE_URL` once a custom domain is attached.

Links, QR codes and the sitemap use `RENDER_EXTERNAL_URL` automatically until a
custom domain is set, so tree tags scan correctly straight after the first deploy.

**Storage.** The orchard lives in a JSON file. `render.yaml` mounts a 1 GB disk at
`data/runtime`, which needs a paid instance type. On the free plan, delete the `disk:`
block: the site still runs, but the filesystem is wiped on every restart and the
orchard reseeds itself — the same 2,000 trees return, while demo purchases and field
photos uploaded in the meantime are lost. Field photos also need a disk mounted at
`public/uploads` (or an object store) to survive a redeploy. For real production
traffic, move `lib/db.ts` behind Postgres and put the uploads in S3/R2.

The free instance also sleeps after inactivity, so the first request after a pause
takes a few seconds while the orchard is seeded again.

## Adding orchard footage

The site plays video wherever the estate has it and simply says so when it does not —
there are no empty players. Drop files into `public/videos/` and reference them:

- per tree: add `clips: [{ src: "/videos/wt-0417-harvest-2026.mp4", year: 2026, season: "autumn" }]`
  to that tree in `data/runtime/db.json` (or to the generator in `lib/seed.ts`);
- per journal entry: the same shape in `clip`.

MP4 (H.264) and WebM both work; add `poster` for a still frame.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@walko-wallnuts.com` | `walnut2026` |
| Field worker | `field@walko-wallnuts.com` | `orchard2026` |
| Administrator | `admin@walko-wallnuts.com` | `estate2026` |

The owner account (Anna Weber) holds four trees in four different parcels with full
photo timelines, harvest history and inspection notes.

## Structure

```
app/
  [locale]/                 en | de — every public and private page
    page.tsx                home
    orchard/                interactive map of all 2,000 trees
    tree/[code]/            public tree record + digital passport + QR
    cart/ checkout/ order/  selection → checkout → confirmation
    dashboard/              owner portal
    field/                  field worker console (QR scan, photo upload)
    admin/                  estate administration
    gallery/ about/ how-it-works/ faq/ contact/ legal/[slug]/ credits/
  api/                      auth, checkout, reserve, tree, field, admin, pdf, qr…
  t/[code]/                 short link printed on the tree tag → tree record
lib/
  i18n/en.ts, de.ts         all site copy, both languages
  seed.ts                   deterministic orchard, owners, orders, journal
  db.ts                     JSON-file database with atomic writes
  auth.ts, crypto.ts        scrypt passwords, signed session cookies, roles
  pdf.ts                    ownership certificate + invoice (pdf-lib)
  mail.ts                   Resend, or an outbox file when no key is set
components/                 map, tree, home, cart, ui
data/photos.json            photo manifest with credits and blur placeholders
public/photos/              57 licensed photographs (WebP)
```

## Where the keys go

Copy `.env.example` to `.env.local`.

| Variable | Effect when empty |
| --- | --- |
| `STRIPE_SECRET_KEY` | Checkout runs in **demo mode**: no card fields are shown, no card data is collected, and orders are recorded with `demo: true`. Everything else (inventory, account, certificate, invoice, email) behaves exactly as in production. Add the key and create the PaymentIntent in `app/api/checkout/route.ts` where the comment marks the spot. |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal is offered as a method but settled the same demo way. |
| `RESEND_API_KEY` | Emails are written to `data/runtime/outbox.json` instead of being sent. |
| `SESSION_SECRET` | A development fallback is used. **Set this in production.** |
| `NEXT_PUBLIC_BASE_URL` | Used for QR codes, sitemap and links in emails. |

## What is real and what is placeholder

Real and working: the map, the inventory, checkout and stock changes, accounts and
roles, PDF certificates and invoices, QR codes, field inspections with photo upload,
admin edits, CSV exports, sitemap, both languages.

Placeholder — replace before launch, all in `lib/site.ts`:

- Brand name, legal name, address, phone, WhatsApp, VAT number, IBAN.
- Orchard coordinates (`site.location`) — every tree's GPS is derived from them.
- Team names and biographies in `lib/i18n/*.ts`.
- Legal texts: written as usable drafts, but have them reviewed by a lawyer.
- Photographs: `public/photos/` holds freely licensed images (Creative Commons /
  public domain) standing in for the estate's own photography. Credits are listed at
  `/[locale]/credits`. Replace the files and `data/photos.json` with the real ones.

## Notes on honesty of numbers

Harvest figures shown as history are generated demo records; anything about a future
season is labelled as an estimate in both languages. No page promises a yield or a
financial return, and the risk disclaimer (`/legal/risk`) states plainly that this is
an agricultural purchase, not an investment product.

## Accessibility, performance, security

- Every image goes through `next/image` (AVIF/WebP, lazy loading, blur placeholder);
  route-level skeletons cover the heavier pages while they stream.
- All motion is CSS/IntersectionObserver based and disabled under
  `prefers-reduced-motion`.
- Skip link, focus rings, labelled form controls, ARIA on the map and progress bars.
  The map is keyboard operable (arrows pan, `+`/`-` zoom, `Enter` opens the centre
  tree, `Home` resets) and the same inventory is available as a plain list.
- Passwords are scrypt-hashed, sessions are signed httpOnly SameSite=Lax cookies,
  and roles are checked server-side on every private route and API.
- `lib/ratelimit.ts` throttles the public write endpoints (login, checkout, reserve,
  contact, newsletter) per IP. It is in-memory and per-node — put Cloudflare, a WAF
  or a Redis limiter in front for production traffic.
- Cookie consent stores nothing optional before the visitor chooses.
- `npm run backup` snapshots the database, the outbox and field photos, keeping the
  ten most recent copies; wire it to a daily cron.
- The site ships a web manifest, so the field team can install the console on a phone.
