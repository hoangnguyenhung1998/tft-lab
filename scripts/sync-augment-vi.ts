/**
 * Synchronize Vietnamese augment names and descriptions from the Riot client
 * localization mirrored by CommunityDragon, keyed by stable apiName.
 * English source remains unmodified so game-rule matching keeps working.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { renderDesc } from "../lib/text";
import type { CurrentSet, SetData } from "../lib/types";
import { extractAugmentLocale } from "../lib/augment-locale";

const root = process.cwd();
const output = path.join(root, "data", "generated");
const strict = process.argv.includes("--strict") || process.env.TFT_REQUIRE_VI_LOCALE === "1";
const current = JSON.parse(fs.readFileSync(path.join(output, "current.json"), "utf8")) as CurrentSet;
const data = JSON.parse(fs.readFileSync(path.join(output, "set-" + current.setNumber + ".json"), "utf8")) as SetData;
const url = "https://raw.communitydragon.org/latest/cdragon/tft/vi_vn.json";
const schema = z.object({
  items: z.array(z.object({
    apiName: z.string(), name: z.string().nullable(), desc: z.string().nullable(),
    isAugment: z.boolean(), effects: z.record(z.string(), z.number().nullable()).optional(),
  }).loose()),
  setData: z.array(z.object({
    number: z.number(), mutator: z.string(), augments: z.array(z.string()),
  }).loose()),
}).loose();

async function main() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "tft-lab-vi localization sync" },
    });
    if (!response.ok) throw new Error("CommunityDragon vi_vn HTTP " + response.status);
    const raw = schema.parse(await response.json());
    const entry = raw.setData.find((s) => s.number === current.setNumber && s.mutator === current.mutator)
      ?? raw.setData.find((s) => s.number === current.setNumber);
    if (!entry) throw new Error("Set " + current.setNumber + " absent from vi_vn");
    const allowed = new Set(entry.augments);
    const translated = raw.items
      .filter((item) => item.isAugment && allowed.has(item.apiName))
      .map((item) => ({
        apiName: item.apiName, name: item.name,
        desc: item.desc ? renderDesc(item.desc, item.effects ?? {}) : "",
      }));
    const entries = extractAugmentLocale(data.augments, translated);
    const count = Object.keys(entries).length;
    const ratio = data.augments.length ? count / data.augments.length : 0;
    if (ratio < 0.7) throw new Error("Localized coverage too low: " + count + "/" + data.augments.length);
    fs.writeFileSync(path.join(output, "augment-vi-" + current.setNumber + ".json"), JSON.stringify({
      setNumber: current.setNumber,
      patch: current.patch,
      syncedAt: new Date().toISOString(),
      source: "communitydragon/vi_vn",
      entries,
    }, null, 2) + "\n");
    console.log("✓ Augments vi_VN: " + count + "/" + data.augments.length + " (" + Math.round(ratio * 100) + "%); patch " + current.patch);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (strict) {
      console.error("✖ Could not synchronize Vietnamese augments: " + message);
      process.exitCode = 1;
    } else {
      console.warn("! Vietnamese augments unavailable; retaining explicit English fallback: " + message);
    }
  } finally {
    clearTimeout(timeout);
  }
}

void main();
