export type TreeStatus = "available" | "reserved" | "sold";
export type Phase = "dormant" | "blooming" | "growing" | "ripening" | "harvested";
export type Health = "excellent" | "good" | "fair" | "attention";
export type Cultivar = "Franquette" | "Chandler" | "Lara" | "Geisenheim 26";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Role = "owner" | "worker" | "admin";

export interface TreePhoto {
  src: string;
  year: number;
  season: Season;
  /** Short caption, already localised on the client via season + year. */
  label?: string;
  credit?: string;
  creditUrl?: string;
  license?: string;
}

/**
 * Short clip or time-lapse for a tree or a journal entry. Drop the files into
 * `public/videos/` and reference them here — nothing else needs changing.
 */
export interface Clip {
  src: string;
  poster?: string;
  year: number;
  season: Season;
  labelEn?: string;
  labelDe?: string;
}

export interface TreeUpdate {
  id: string;
  date: string;
  author: string;
  en: string;
  de: string;
  phase?: Phase;
  health?: Health;
  photo?: string;
  yieldKg?: number;
}

export interface Harvest {
  year: number;
  kg: number;
}

export interface Tree {
  n: number;
  code: string;
  parcel: string;
  row: number;
  col: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  cultivar: Cultivar;
  planted: number;
  status: TreeStatus;
  ownerId?: string;
  soldAt?: string;
  reservedUntil?: string;
  health: Health;
  phase: Phase;
  photos: TreePhoto[];
  clips?: Clip[];
  harvests: Harvest[];
  estimateKg: number;
  lastInspection: string;
  updates: TreeUpdate[];
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  country: string;
  city?: string;
  since: string;
  lastLogin?: string;
  giftFrom?: string;
  newsletter?: boolean;
}

export interface OrderItem {
  code: string;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  ownerId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  zip?: string;
  city?: string;
  country?: string;
  items: OrderItem[];
  total: number;
  method: "card" | "paypal" | "applepay" | "googlepay" | "transfer";
  status: "paid" | "pending" | "refunded";
  gift?: { name: string; message?: string };
  demo: boolean;
  locale: "en" | "de";
}

export interface Announcement {
  id: string;
  date: string;
  en: { title: string; body: string };
  de: { title: string; body: string };
}

export interface JournalEntry {
  id: string;
  date: string;
  year: number;
  season: Season;
  parcel: string | "all";
  photo: string;
  gallery?: string[];
  clip?: Clip;
  en: { title: string; body: string };
  de: { title: string; body: string };
}

export interface SeasonReport {
  id: string;
  year: number;
  season: Season;
  en: { title: string; body: string };
  de: { title: string; body: string };
}

export interface Message {
  id: string;
  date: string;
  kind: "contact" | "visit" | "newsletter";
  name?: string;
  email: string;
  phone?: string;
  subject?: string;
  body?: string;
  date_requested?: string;
  guests?: number;
  locale: string;
}

export interface Session {
  token: string;
  ownerId: string;
  created: string;
  expires: string;
}

export interface Database {
  seededAt: string;
  trees: Tree[];
  owners: Owner[];
  orders: Order[];
  announcements: Announcement[];
  journal: JournalEntry[];
  reports: SeasonReport[];
  messages: Message[];
  sessions: Session[];
}

export const CULTIVARS: Cultivar[] = ["Franquette", "Chandler", "Lara", "Geisenheim 26"];
export const PARCELS = ["A", "B", "C", "D", "E", "F"] as const;
export const PHASES: Phase[] = ["dormant", "blooming", "growing", "ripening", "harvested"];
export const HEALTHS: Health[] = ["excellent", "good", "fair", "attention"];
