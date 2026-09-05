import type { Dict } from "./i18n";
import { credit } from "./photos";
import type { Health, Phase, Tree } from "./model";
import type { TreeCardData } from "@/components/tree/TreeCard";

export function healthLabel(dict: Dict, health: Health) {
  return dict.health[health];
}

export function phaseLabel(dict: Dict, phase: Phase) {
  return dict.phases[phase];
}

export function latestPhoto(tree: Tree): string {
  return tree.photos[tree.photos.length - 1]?.src ?? "/photos/tree-017.webp";
}

export function toCardData(tree: Tree, dict: Dict): TreeCardData {
  const photo = latestPhoto(tree);
  return {
    code: tree.code,
    parcel: tree.parcel,
    row: tree.row,
    cultivar: tree.cultivar,
    planted: tree.planted,
    status: tree.status,
    health: healthLabel(dict, tree.health),
    photo,
    blur: credit(photo)?.blur,
    estimateKg: tree.estimateKg,
    lastYield: tree.harvests[tree.harvests.length - 1]?.kg,
  };
}

export function averageYield(tree: Tree): number {
  const recent = tree.harvests.slice(-3);
  if (!recent.length) return 0;
  return Math.round((recent.reduce((s, h) => s + h.kg, 0) / recent.length) * 10) / 10;
}
