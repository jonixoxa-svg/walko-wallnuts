import {
  type Announcement,
  type Cultivar,
  type Database,
  type Harvest,
  type Health,
  type JournalEntry,
  type Order,
  type Owner,
  type Phase,
  type SeasonReport,
  type Tree,
  type TreePhoto,
  type TreeUpdate,
} from "./model";
import { pick, pickFrom } from "./photos";
import { site } from "./site";
import { hashPassword } from "./crypto";

/** Deterministic PRNG so that the same orchard is generated on every machine. */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED_TODAY = "2026-09-04";
const THIS_YEAR = 2026;

/** Six parcels laid out in two bands across the valley. 2,000 trees in total. */
const PARCEL_SPEC = [
  { id: "A", rows: 18, cols: 20, ox: 0, oy: 0, planted: 2009, main: "Franquette" as Cultivar },
  { id: "B", rows: 16, cols: 20, ox: 200, oy: 12, planted: 2010, main: "Chandler" as Cultivar },
  { id: "C", rows: 18, cols: 20, ox: 400, oy: 0, planted: 2011, main: "Lara" as Cultivar },
  { id: "D", rows: 15, cols: 20, ox: 20, oy: 200, planted: 2013, main: "Chandler" as Cultivar },
  { id: "E", rows: 17, cols: 20, ox: 210, oy: 205, planted: 2015, main: "Geisenheim 26" as Cultivar },
  { id: "F", rows: 16, cols: 20, ox: 410, oy: 198, planted: 2016, main: "Franquette" as Cultivar },
];

const POLLINATOR: Record<string, Cultivar> = {
  Franquette: "Lara",
  Chandler: "Franquette",
  Lara: "Franquette",
  "Geisenheim 26": "Lara",
};

const TEAM = ["M. Novak", "T. Reiter", "E. Marchetti", "D. Frey", "L. Haas"];

/** Weather factor per harvest year — 2023 was the late-frost year. */
const YEAR_FACTOR: Record<number, number> = {
  2018: 0.92,
  2019: 1.0,
  2020: 0.86,
  2021: 0.95,
  2022: 1.08,
  2023: 0.38,
  2024: 1.07,
  2025: 0.88,
};

const CULTIVAR_FACTOR: Record<Cultivar, number> = {
  Franquette: 0.96,
  Chandler: 1.1,
  Lara: 1.02,
  "Geisenheim 26": 0.92,
};

const UPDATE_TEMPLATES: { phase: Phase; month: number; day: number; en: string[]; de: string[] }[] = [
  {
    phase: "dormant",
    month: 2,
    day: 12,
    en: [
      "Winter pruning finished. The crown was opened towards the south, three crossing branches removed. Trunk sound, no frost cracks.",
      "Winter inspection: bark healthy, support post replaced, compost spread within the drip line.",
      "Pruned for light. Old fruiting wood taken out, the tree carries a balanced crown into spring.",
    ],
    de: [
      "Winterschnitt abgeschlossen. Die Krone wurde nach Süden geöffnet, drei sich kreuzende Äste entfernt. Stamm gesund, keine Frostrisse.",
      "Winterkontrolle: Rinde gesund, Stützpfahl erneuert, Kompost im Kronenbereich ausgebracht.",
      "Auf Licht geschnitten. Altes Fruchtholz entnommen, der Baum geht mit ausgewogener Krone in den Frühling.",
    ],
  },
  {
    phase: "blooming",
    month: 4,
    day: 27,
    en: [
      "Bud break on schedule, catkins releasing pollen. No frost damage in this row this spring.",
      "Female flowers open, overlap with the pollinator row is good. A promising start to the season.",
      "Late bud break as expected for this cultivar — exactly what protects the crop after cold nights.",
    ],
    de: [
      "Austrieb termingerecht, die Kätzchen stäuben. In dieser Reihe kein Frostschaden in diesem Frühjahr.",
      "Weibliche Blüten offen, die Überschneidung mit der Bestäuberreihe passt. Ein vielversprechender Saisonstart.",
      "Später Austrieb, wie für diese Sorte erwartet — genau das schützt die Ernte nach kalten Nächten.",
    ],
  },
  {
    phase: "growing",
    month: 6,
    day: 18,
    en: [
      "Fruit set counted, husks are swelling well. Drip irrigation running four nights a week.",
      "Leaves clean, no husk fly in the traps of this parcel. Cover crop mown between the rows.",
      "Good fruit load for the age of the tree. Soil moisture at 62% of field capacity.",
    ],
    de: [
      "Fruchtansatz gezählt, die Schalen wachsen gut. Tropfbewässerung läuft vier Nächte pro Woche.",
      "Blätter sauber, keine Fruchtfliege in den Fallen dieser Parzelle. Begrünung zwischen den Reihen gemäht.",
      "Für das Alter des Baumes gute Fruchtlast. Bodenfeuchte bei 62 % der Feldkapazität.",
    ],
  },
  {
    phase: "ripening",
    month: 8,
    day: 26,
    en: [
      "Kernels filling, first husks beginning to split. Harvest for this row is planned for the last week of September.",
      "Pre-harvest check: shells firm, husk colour turning. Nets and shaker booked for the parcel.",
      "Ripening on time. The estimate below was updated after this visit.",
    ],
    de: [
      "Die Kerne füllen sich, erste Schalen platzen auf. Die Ernte dieser Reihe ist für die letzte Septemberwoche geplant.",
      "Kontrolle vor der Ernte: Schalen fest, Hüllfarbe dreht. Netze und Schüttler für die Parzelle eingeplant.",
      "Reife im Zeitplan. Die Schätzung unten wurde nach dieser Begehung aktualisiert.",
    ],
  },
];

function seasonOf(month: number): "spring" | "summer" | "autumn" | "winter" {
  if (month <= 2 || month === 12) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

function iso(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
}

const FIRST_NAMES = [
  "Anna", "Lukas", "Marie", "Jonas", "Sophie", "Felix", "Laura", "Elias", "Hannah", "Paul",
  "Julia", "Moritz", "Clara", "Simon", "Lena", "Tobias", "Emma", "Jakob", "Nina", "Florian",
  "Sara", "David", "Ines", "Matteo", "Eva", "Nils", "Greta", "Andreas", "Mira", "Stefan",
  "Katharina", "Philipp", "Johanna", "Michael", "Vera", "Christoph", "Iris", "Peter", "Alina", "Markus",
];
const LAST_NAMES = [
  "Weber", "Gruber", "Huber", "Steiner", "Berger", "Moser", "Fischer", "Wagner", "Bauer", "Hofer",
  "Lindqvist", "Kessler", "Meier", "Novak", "Vermeulen", "Rossi", "Dupont", "Andersen", "Kovac", "Larsen",
  "Schmidt", "Braun", "Keller", "Winkler", "Reiter", "Brandl", "Egger", "Marchetti", "Sauer", "Frey",
];
const PLACES = [
  ["Vienna", "AT"], ["Graz", "AT"], ["Salzburg", "AT"], ["Munich", "DE"], ["Berlin", "DE"],
  ["Hamburg", "DE"], ["Zürich", "CH"], ["Bern", "CH"], ["Milan", "IT"], ["Bolzano", "IT"],
  ["Amsterdam", "NL"], ["Copenhagen", "DK"], ["Malmö", "SE"], ["Prague", "CZ"], ["Ljubljana", "SI"],
  ["Brussels", "BE"], ["Paris", "FR"], ["Linz", "AT"], ["Stuttgart", "DE"], ["Innsbruck", "AT"],
];

function healthFrom(r: number): Health {
  if (r < 0.36) return "excellent";
  if (r < 0.82) return "good";
  if (r < 0.95) return "fair";
  return "attention";
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function buildHarvests(planted: number, cultivar: Cultivar, rnd: () => number): Harvest[] {
  const out: Harvest[] = [];
  for (let year = planted + 5; year <= THIS_YEAR - 1; year++) {
    const age = year - planted;
    const potential = Math.min(24, (age - 4) * 2.4);
    const factor = YEAR_FACTOR[year] ?? 1;
    const variance = 0.82 + rnd() * 0.33;
    const kg = potential * factor * CULTIVAR_FACTOR[cultivar] * variance;
    out.push({ year, kg: round1(Math.max(0, kg)) });
  }
  return out.slice(-8);
}

function buildPhotos(n: number, planted: number, rnd: () => number): TreePhoto[] {
  const out: TreePhoto[] = [];
  const timeline: { year: number; season: "spring" | "summer" | "autumn" | "winter"; themes: string[] }[] = [
    { year: THIS_YEAR - 2, season: "autumn", themes: ["autumn", "orchard", "harvest"] },
    { year: THIS_YEAR - 1, season: "spring", themes: ["spring", "detail"] },
    { year: THIS_YEAR - 1, season: "autumn", themes: ["harvest", "autumn"] },
    { year: THIS_YEAR, season: "winter", themes: ["winter"] },
    { year: THIS_YEAR, season: "spring", themes: ["spring", "detail"] },
    { year: THIS_YEAR, season: "summer", themes: ["fruit", "tree"] },
    { year: THIS_YEAR, season: "autumn", themes: ["fruit", "harvest", "nuts"] },
  ];
  timeline.forEach((t, i) => {
    const photo = pickFrom(t.themes, n * 7 + i * 13 + Math.floor(rnd() * 5));
    out.push({
      src: photo.src,
      year: t.year,
      season: t.season,
      credit: photo.credit,
      creditUrl: photo.creditUrl,
      license: photo.license,
    });
  });
  return out.filter((p) => p.year >= planted);
}

function buildUpdates(n: number, code: string, rnd: () => number, phase: Phase): TreeUpdate[] {
  const updates: TreeUpdate[] = [];
  UPDATE_TEMPLATES.forEach((tpl, i) => {
    const variant = Math.floor(rnd() * tpl.en.length);
    const photo = pick(
      tpl.phase === "dormant" ? "winter" : tpl.phase === "blooming" ? "spring" : tpl.phase === "growing" ? "fruit" : "harvest",
      n + i * 31
    );
    updates.push({
      id: `${code}-u${i + 1}`,
      date: iso(THIS_YEAR, tpl.month, tpl.day),
      author: TEAM[(n + i) % TEAM.length],
      en: tpl.en[variant],
      de: tpl.de[variant],
      phase: tpl.phase,
      photo: photo.src,
    });
  });
  return updates.filter((u) => u.date <= SEED_TODAY).concat(
    phase === "harvested"
      ? [
          {
            id: `${code}-uh`,
            date: iso(THIS_YEAR, 9, 2),
            author: TEAM[n % TEAM.length],
            en: "Harvested early with the rest of this row. Nuts washed the same afternoon and moved to the drying floor.",
            de: "Mit dem Rest dieser Reihe früh geerntet. Die Nüsse wurden am selben Nachmittag gewaschen und auf die Trocknung gebracht.",
            phase: "harvested",
            photo: pick("harvest", n + 5).src,
          },
        ]
      : []
  );
}

export function buildTrees(): Tree[] {
  const trees: Tree[] = [];
  let n = 0;
  for (const p of PARCEL_SPEC) {
    for (let row = 1; row <= p.rows; row++) {
      for (let col = 1; col <= p.cols; col++) {
        n += 1;
        const rnd = mulberry32(n * 2654435761);
        const isPollinatorRow = row % 6 === 0;
        const cultivar = isPollinatorRow ? POLLINATOR[p.main] : p.main;
        const planted = p.planted + (row > p.rows - 3 ? 1 : 0);
        const jitterX = (rnd() - 0.5) * 1.6;
        const jitterY = (rnd() - 0.5) * 1.6;
        const x = p.ox + (col - 1) * 8 + jitterX;
        const y = p.oy + (row - 1) * 8 + jitterY;
        const code = `WT-${String(n).padStart(4, "0")}`;
        const health = healthFrom(rnd());
        const phase: Phase = rnd() < 0.12 ? "harvested" : "ripening";
        const harvests = buildHarvests(planted, cultivar, rnd);
        const last3 = harvests.slice(-3).filter((h) => h.kg > 2);
        const avg = last3.length ? last3.reduce((s, h) => s + h.kg, 0) / last3.length : 0;
        const age = THIS_YEAR - planted;
        const estimateKg = round1(
          Math.max(
            0,
            (avg || Math.min(22, Math.max(0, (age - 4) * 2.3))) *
              (health === "excellent" ? 1.08 : health === "good" ? 1.0 : health === "fair" ? 0.88 : 0.7) *
              (0.95 + rnd() * 0.18)
          )
        );
        const updates = buildUpdates(n, code, rnd, phase);
        trees.push({
          n,
          code,
          parcel: p.id,
          row,
          col,
          x: round1(x),
          y: round1(y),
          lat: site.location.lat + (600 - y) * 0.0000090,
          lng: site.location.lng + (x - 300) * 0.0000131,
          cultivar,
          planted,
          status: "available",
          health,
          phase,
          photos: buildPhotos(n, planted, rnd),
          harvests,
          estimateKg,
          lastInspection: updates.length ? updates[updates.length - 1].date : iso(THIS_YEAR, 2, 12),
          updates,
        });
      }
    }
  }
  return trees;
}

/** Exactly `site.totals.sold` trees are owned, weighted towards the older parcels. */
function markSold(trees: Tree[]): Tree[] {
  const scored = trees.map((t) => {
    const rnd = mulberry32(t.n * 1103515245 + 12345);
    const parcelIndex = PARCEL_SPEC.findIndex((p) => p.id === t.parcel);
    return { code: t.code, score: rnd() + parcelIndex * 0.12 };
  });
  scored.sort((a, b) => a.score - b.score);
  const soldSet = new Set(scored.slice(0, site.totals.sold).map((s) => s.code));
  return trees.map((t) => (soldSet.has(t.code) ? { ...t, status: "sold" as const } : t));
}

export async function buildDatabase(): Promise<Database> {
  const trees = markSold(buildTrees());
  const owners: Owner[] = [];
  const orders: Order[] = [];

  const demoHash = await hashPassword(site.demoAccounts.owner.password);
  const workerHash = await hashPassword(site.demoAccounts.worker.password);
  const adminHash = await hashPassword(site.demoAccounts.admin.password);

  owners.push({
    id: "own-demo",
    name: "Anna Weber",
    email: site.demoAccounts.owner.email,
    passwordHash: demoHash,
    role: "owner",
    country: "AT",
    city: "Vienna",
    since: "2019-04-12",
    lastLogin: "2026-08-30T18:22:00.000Z",
    newsletter: true,
  });
  owners.push({
    id: "own-field",
    name: "Marija Novak",
    email: site.demoAccounts.worker.email,
    passwordHash: workerHash,
    role: "worker",
    country: "AT",
    since: "2017-03-01",
  });
  owners.push({
    id: "own-admin",
    name: "Elena Marchetti",
    email: site.demoAccounts.admin.email,
    passwordHash: adminHash,
    role: "admin",
    country: "AT",
    since: "2009-01-01",
  });

  const soldTrees = trees.filter((t) => t.status === "sold");

  // The demo owner keeps four trees with the longest history.
  const demoTrees = ["A", "B", "C", "E"]
    .map((parcel) => soldTrees.filter((t) => t.parcel === parcel).sort((a, b) => b.estimateKg - a.estimateKg)[0])
    .filter(Boolean)
    .slice(0, 4);
  const demoCodes = new Set(demoTrees.map((t) => t.code));

  const rest = soldTrees.filter((t) => !demoCodes.has(t.code));
  let index = 0;
  let ownerNo = 0;
  while (index < rest.length) {
    const rnd = mulberry32(9000 + ownerNo * 7919);
    const roll = rnd();
    const count = roll < 0.56 ? 1 : roll < 0.81 ? 2 : roll < 0.93 ? 3 : 4;
    const batch = rest.slice(index, index + count);
    index += batch.length;
    ownerNo += 1;
    const first = FIRST_NAMES[Math.floor(rnd() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rnd() * LAST_NAMES.length)];
    const place = PLACES[Math.floor(rnd() * PLACES.length)];
    const year = 2016 + Math.floor(rnd() * 10);
    const month = 1 + Math.floor(rnd() * 12);
    const day = 1 + Math.floor(rnd() * 27);
    const since = iso(Math.min(year, 2026), month, day) > SEED_TODAY ? iso(2026, 6, day) : iso(Math.min(year, 2026), month, day);
    const id = `own-${String(ownerNo).padStart(4, "0")}`;
    owners.push({
      id,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${ownerNo}@example.com`,
      passwordHash: "seeded-no-login",
      role: "owner",
      country: place[1],
      city: place[0],
      since,
      newsletter: rnd() < 0.6,
    });
    const methods = ["card", "paypal", "applepay", "transfer", "googlepay"] as const;
    orders.push({
      id: `WW-${since.replace(/-/g, "").slice(2)}-${String(ownerNo).padStart(4, "0")}`,
      date: `${since}T10:${String(10 + (ownerNo % 45)).padStart(2, "0")}:00.000Z`,
      ownerId: id,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${ownerNo}@example.com`,
      country: place[1],
      city: place[0],
      items: batch.map((t) => ({ code: t.code, price: site.totals.pricePerTree })),
      total: batch.length * site.totals.pricePerTree,
      method: methods[Math.floor(rnd() * methods.length)],
      status: "paid",
      demo: true,
      locale: place[1] === "AT" || place[1] === "DE" || place[1] === "CH" ? "de" : "en",
    });
    batch.forEach((t) => {
      const tree = trees.find((x) => x.code === t.code)!;
      tree.ownerId = id;
      tree.soldAt = since;
    });
  }

  demoTrees.forEach((t, i) => {
    const tree = trees.find((x) => x.code === t.code)!;
    tree.ownerId = "own-demo";
    tree.soldAt = i < 2 ? "2019-04-12" : i === 2 ? "2022-10-03" : "2025-03-18";
  });
  orders.push({
    id: "WW-190412-0001",
    date: "2019-04-12T11:20:00.000Z",
    ownerId: "own-demo",
    name: "Anna Weber",
    email: site.demoAccounts.owner.email,
    phone: "+43 660 0000000",
    address: "Lindengasse 12/4",
    zip: "1070",
    city: "Vienna",
    country: "AT",
    items: demoTrees.slice(0, 2).map((t) => ({ code: t.code, price: site.totals.pricePerTree })),
    total: 2 * site.totals.pricePerTree,
    method: "card",
    status: "paid",
    demo: true,
    locale: "de",
  });
  orders.push({
    id: "WW-221003-0002",
    date: "2022-10-03T16:05:00.000Z",
    ownerId: "own-demo",
    name: "Anna Weber",
    email: site.demoAccounts.owner.email,
    city: "Vienna",
    country: "AT",
    items: [{ code: demoTrees[2].code, price: site.totals.pricePerTree }],
    total: site.totals.pricePerTree,
    method: "paypal",
    status: "paid",
    demo: true,
    locale: "de",
  });
  orders.push({
    id: "WW-250318-0003",
    date: "2025-03-18T09:41:00.000Z",
    ownerId: "own-demo",
    name: "Anna Weber",
    email: site.demoAccounts.owner.email,
    city: "Vienna",
    country: "AT",
    items: [{ code: demoTrees[3].code, price: site.totals.pricePerTree }],
    total: site.totals.pricePerTree,
    method: "card",
    status: "paid",
    gift: { name: "Jonas Weber", message: "For your first birthday. It will be taller than you for a while." },
    demo: true,
    locale: "de",
  });

  orders.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    seededAt: new Date().toISOString(),
    trees,
    owners,
    orders,
    announcements: buildAnnouncements(),
    journal: buildJournal(),
    reports: buildReports(),
    messages: [],
    sessions: [],
  };
}

function buildAnnouncements(): Announcement[] {
  return [
    {
      id: "ann-2026-08",
      date: "2026-08-28",
      en: {
        title: "Harvest starts on 21 September",
        body: "The husks in parcels A and B are splitting on schedule. Shaking begins on 21 September and should take eleven days for the whole orchard. Owners are welcome on both harvest weekends — bring boots, the ground under the trees is soft after the August rain.",
      },
      de: {
        title: "Die Ernte beginnt am 21. September",
        body: "In den Parzellen A und B platzen die Schalen im Zeitplan auf. Das Schütteln startet am 21. September und dauert für die gesamte Anlage etwa elf Tage. Eigentümerinnen und Eigentümer sind an beiden Erntewochenenden willkommen — bitte feste Schuhe mitbringen, der Boden ist nach dem Augustregen weich.",
      },
    },
    {
      id: "ann-2026-06",
      date: "2026-06-14",
      en: {
        title: "Irrigation switched to night cycles",
        body: "After three dry weeks we moved all six parcels to night irrigation. Moisture sensors in parcels D and E showed the fastest drop, so those rows now run five nights a week instead of three.",
      },
      de: {
        title: "Bewässerung auf Nachtzyklen umgestellt",
        body: "Nach drei trockenen Wochen laufen alle sechs Parzellen auf Nachtbewässerung. Die Feuchtesensoren in D und E zeigten den schnellsten Rückgang, dort wird jetzt fünf statt drei Nächte pro Woche bewässert.",
      },
    },
    {
      id: "ann-2026-04",
      date: "2026-04-30",
      en: {
        title: "Blossom came through the cold nights",
        body: "Two nights at −1.4 °C at the end of April. Frost candles ran in the lower part of parcel D; the late-budding cultivars in the upper parcels were not yet open. No visible damage anywhere in the orchard.",
      },
      de: {
        title: "Die Blüte hat die kalten Nächte überstanden",
        body: "Zwei Nächte mit −1,4 °C Ende April. Im unteren Teil der Parzelle D liefen Frostkerzen; die spät austreibenden Sorten in den oberen Parzellen waren noch nicht offen. Keine sichtbaren Schäden in der Anlage.",
      },
    },
    {
      id: "ann-2026-02",
      date: "2026-02-20",
      en: {
        title: "Winter pruning finished across all parcels",
        body: "Four weeks of pruning are done. 2,000 trees inspected, 38 support posts replaced and 12 young trees re-staked. Photographs from the winter round are in your dashboard.",
      },
      de: {
        title: "Winterschnitt in allen Parzellen abgeschlossen",
        body: "Vier Wochen Schnittarbeit sind erledigt. 2.000 Bäume kontrolliert, 38 Stützpfähle getauscht und 12 junge Bäume neu angebunden. Die Fotos der Winterrunde liegen in Ihrem Konto.",
      },
    },
    {
      id: "ann-2025-11",
      date: "2025-11-08",
      en: {
        title: "2025 harvest reports are online",
        body: "Every tree was weighed separately after drying to 8% moisture. The orchard average came to 21.4 kg per mature tree, slightly below 2024. Your own figures are in the production tab.",
      },
      de: {
        title: "Die Ernteberichte 2025 sind online",
        body: "Jeder Baum wurde nach der Trocknung auf 8 % Restfeuchte einzeln gewogen. Der Durchschnitt der Anlage liegt bei 21,4 kg je ertragsfähigem Baum, leicht unter 2024. Ihre eigenen Zahlen finden Sie im Reiter Produktion.",
      },
    },
  ];
}

function journalPhoto(theme: string, i: number) {
  return pick(theme, i * 17 + 3).src;
}

function buildJournal(): JournalEntry[] {
  const raw: Omit<JournalEntry, "photo" | "gallery">[] = [
    {
      id: "j-2026-09",
      date: "2026-09-01",
      year: 2026,
      season: "autumn",
      parcel: "A",
      en: { title: "Counting husks before the shaker arrives", body: "Three weeks before harvest we walk every fifth row and count husks on a sample branch. It is slow, slightly absurd work that tells us within a kilo or two what a parcel will bring. Parcel A looks like a good year: the crown is heavy on the south side and the husks are already showing the first cracks." },
      de: { title: "Schalen zählen, bevor der Schüttler kommt", body: "Drei Wochen vor der Ernte gehen wir jede fünfte Reihe ab und zählen die Früchte an einem Musterast. Langsame, leicht absurde Arbeit — die uns aber auf ein, zwei Kilo genau sagt, was eine Parzelle bringt. Parzelle A sieht nach einem guten Jahr aus: Die Krone trägt auf der Südseite schwer und die Schalen zeigen erste Risse." },
    },
    {
      id: "j-2026-07",
      date: "2026-07-19",
      year: 2026,
      season: "summer",
      parcel: "D",
      en: { title: "Twenty-one days without rain", body: "The moisture sensors in parcel D dropped faster than anywhere else — the gravel sits closer to the surface there. We moved to five night cycles a week and mulched the young rows. By the end of the month the leaves had lost their dull look." },
      de: { title: "Einundzwanzig Tage ohne Regen", body: "Die Feuchtesensoren in Parzelle D fielen schneller als überall sonst — der Schotter liegt dort näher an der Oberfläche. Wir sind auf fünf Nachtzyklen pro Woche gegangen und haben die jungen Reihen gemulcht. Zum Monatsende hatten die Blätter ihren stumpfen Ton verloren." },
    },
    {
      id: "j-2026-05",
      date: "2026-05-06",
      year: 2026,
      season: "spring",
      parcel: "all",
      en: { title: "Ten days that decide the year", body: "Pollination in a walnut orchard is a matter of timing, not effort. The catkins have to shed while the female flowers are receptive. This year the overlap was almost perfect in parcels A, B and C, and a little short in F, where the young Franquettes opened late." },
      de: { title: "Zehn Tage, die das Jahr entscheiden", body: "Bestäubung in einer Nussanlage ist eine Frage des Zeitpunkts, nicht des Aufwands. Die Kätzchen müssen stäuben, während die weiblichen Blüten empfängnisbereit sind. Heuer passte die Überschneidung in A, B und C fast perfekt und war in F etwas knapp, wo die jungen Franquettes spät öffneten." },
    },
    {
      id: "j-2026-02",
      date: "2026-02-11",
      year: 2026,
      season: "winter",
      parcel: "C",
      en: { title: "Pruning is a conversation with a tree", body: "Every winter we take out what shades the inside of the crown. A walnut fills its kernels with light, and a crowded crown produces small, half-empty nuts. Thomas needs about six minutes per mature tree and can tell you the last three years of a tree by the wood he cuts." },
      de: { title: "Schneiden ist ein Gespräch mit dem Baum", body: "Jeden Winter nehmen wir heraus, was das Kroneninnere beschattet. Eine Walnuss füllt ihre Kerne mit Licht; eine dichte Krone bringt kleine, halbleere Nüsse. Thomas braucht rund sechs Minuten je ausgewachsenem Baum — und liest an dem Holz, das er schneidet, die letzten drei Jahre ab." },
    },
    {
      id: "j-2025-10",
      date: "2025-10-12",
      year: 2025,
      season: "autumn",
      parcel: "B",
      en: { title: "Eleven days on the drying floor", body: "Harvest 2025 came in at 21.4 kg per mature tree. Every crate carries a tree number from the field to the scale, which is why your figure is your tree's figure and not an orchard average. The drying floor ran at 32 °C for eleven days." },
      de: { title: "Elf Tage auf der Trocknung", body: "Die Ernte 2025 lag bei 21,4 kg je ertragsfähigem Baum. Jede Kiste trägt vom Feld bis zur Waage eine Baumnummer — deshalb ist Ihre Zahl die Ihres Baumes und kein Durchschnitt der Anlage. Die Trocknung lief elf Tage bei 32 °C." },
    },
    {
      id: "j-2025-06",
      date: "2025-06-21",
      year: 2025,
      season: "summer",
      parcel: "E",
      en: { title: "The cover crop is not decoration", body: "Between the rows we keep clover, vetch and phacelia. They feed pollinators in May, hold the soil in a July storm and give the ground something to eat when they are mown. Parcel E, our sandiest, has gained half a percent of organic matter in six years." },
      de: { title: "Die Begrünung ist keine Dekoration", body: "Zwischen den Reihen stehen Klee, Wicke und Phacelia. Sie ernähren im Mai die Bestäuber, halten im Julisturm den Boden und geben ihm beim Mähen etwas zu fressen. Parzelle E, unsere sandigste, hat in sechs Jahren ein halbes Prozent Humus gewonnen." },
    },
    {
      id: "j-2024-09",
      date: "2024-09-28",
      year: 2024,
      season: "autumn",
      parcel: "all",
      en: { title: "The best harvest since planting", body: "24.9 kg per mature tree. Warm nights in August filled the kernels and the September dry spell let us shake three days earlier than planned. We wrote it down carefully — a year like this is a reference point, not a promise." },
      de: { title: "Die beste Ernte seit der Pflanzung", body: "24,9 kg je ertragsfähigem Baum. Warme Augustnächte füllten die Kerne, und die Trockenheit im September ließ uns drei Tage früher schütteln als geplant. Wir haben es sorgfältig notiert — so ein Jahr ist ein Bezugspunkt, kein Versprechen." },
    },
    {
      id: "j-2024-04",
      date: "2024-04-18",
      year: 2024,
      season: "spring",
      parcel: "F",
      en: { title: "Replanting the last gaps in F", body: "Twelve trees in parcel F never recovered from the wet spring of 2021. They were taken out and replaced with two-year-old Franquettes on the same numbers, so the record of each position continues without a break." },
      de: { title: "Die letzten Lücken in F nachgepflanzt", body: "Zwölf Bäume in Parzelle F haben sich vom nassen Frühjahr 2021 nie erholt. Sie wurden entfernt und durch zweijährige Franquettes auf denselben Nummern ersetzt, damit die Akte jeder Position ohne Bruch weiterläuft." },
    },
    {
      id: "j-2023-05",
      date: "2023-05-02",
      year: 2023,
      season: "spring",
      parcel: "all",
      en: { title: "The frost year", body: "On 24 April the temperature fell to −3.8 °C for four hours. The blossom was out. We lost roughly two thirds of the crop across the orchard, more in the lower rows of D. We are writing this down as plainly as we wrote about 2024: some years the weather simply wins." },
      de: { title: "Das Frostjahr", body: "Am 24. April fiel die Temperatur vier Stunden lang auf −3,8 °C. Die Blüte stand offen. Wir haben rund zwei Drittel der Ernte verloren, in den unteren Reihen von D mehr. Wir schreiben das genauso nüchtern auf wie 2024: Manchmal gewinnt schlicht das Wetter." },
    },
  ];
  const themeFor: Record<string, string> = { autumn: "harvest", summer: "fruit", spring: "spring", winter: "winter" };
  return raw.map((e, i) => ({
    ...e,
    photo: journalPhoto(themeFor[e.season] || "orchard", i),
    gallery: [journalPhoto("orchard", i + 2), journalPhoto(themeFor[e.season] || "tree", i + 5), journalPhoto("landscape", i + 8)],
  }));
}

function buildReports(): SeasonReport[] {
  return [
    {
      id: "r-2025-autumn",
      year: 2025,
      season: "autumn",
      en: { title: "Harvest report 2025", body: "Orchard average 21.4 kg per mature tree (2024: 24.9 kg). Harvest ran from 23 September to 4 October. Kernel quality was high, with 46% light kernels. Drying capacity was the limiting factor in the first week; a second drying unit is planned for 2026." },
      de: { title: "Erntebericht 2025", body: "Durchschnitt der Anlage 21,4 kg je ertragsfähigem Baum (2024: 24,9 kg). Geerntet wurde vom 23. September bis 4. Oktober. Die Kernqualität war hoch, 46 % helle Kerne. In der ersten Woche war die Trocknungskapazität der Engpass; eine zweite Einheit ist für 2026 geplant." },
    },
    {
      id: "r-2026-spring",
      year: 2026,
      season: "spring",
      en: { title: "Spring report 2026", body: "Bud break between 18 and 29 April, four days later than the ten-year average — welcome, given two frost nights at the end of the month. Pollination overlap was good in five of six parcels. Fruit set counts point to an average to good year." },
      de: { title: "Frühjahrsbericht 2026", body: "Austrieb zwischen 18. und 29. April, vier Tage später als im Zehnjahresmittel — angesichts zweier Frostnächte zum Monatsende willkommen. Die Bestäubungsüberschneidung passte in fünf von sechs Parzellen. Die Ansatzzählungen deuten auf ein durchschnittliches bis gutes Jahr." },
    },
    {
      id: "r-2026-summer",
      year: 2026,
      season: "summer",
      en: { title: "Summer report 2026", body: "A dry July (21 days without rain) was managed with night irrigation; leaf analysis in August showed no stress markers. Husk fly pressure stayed under threshold in all parcels, so no treatment was applied after 12 June." },
      de: { title: "Sommerbericht 2026", body: "Ein trockener Juli (21 Tage ohne Regen) wurde mit Nachtbewässerung abgefangen; die Blattanalyse im August zeigte keine Stressmarker. Der Befallsdruck durch die Fruchtfliege blieb in allen Parzellen unter der Schwelle, daher gab es nach dem 12. Juni keine Behandlung." },
    },
    {
      id: "r-2024-autumn",
      year: 2024,
      season: "autumn",
      en: { title: "Harvest report 2024", body: "The strongest season on record: 24.9 kg per mature tree. Warm August nights and a dry September gave full kernels and an early, clean harvest. Parcels A and C carried the highest single-tree weights, up to 38 kg." },
      de: { title: "Erntebericht 2024", body: "Die stärkste Saison seit Beginn der Aufzeichnungen: 24,9 kg je ertragsfähigem Baum. Warme Augustnächte und ein trockener September brachten volle Kerne und eine frühe, saubere Ernte. Die höchsten Einzelbaumgewichte lagen in A und C bei bis zu 38 kg." },
    },
  ];
}
