import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const __dirname = dirname(fileURLToPath(import.meta.url));
const resourceDir = join(__dirname, "resources");
const outputDir = join(__dirname, "..", "src", "data");

interface Character {
  name: string;
  asset: string;
  stats?: {
    zukan_index?: number;
    element_type1?: string;
    element_type2?: string;
    [key: string]: unknown;
  };
}

interface CharactersData {
  pals: Character[];
}

interface BreedingData {
  pal_info: Record<string, unknown>;
}

interface Manifest {
  commit: string;
  downloadedAt: string;
  files: { path: string; size: number; sha256: string }[];
}

interface CanonicalPal {
  internalName: string;
  displayName: string;
  wikiName: string;
  wikiSlug: string;
  paldex: number;
  paldexSuffix: string;
  elements: string[];
}

interface FilteredEntry {
  assetName: string;
  reason: string;
}

interface NamingRuleInference {
  assetName: string;
  canonicalInternalName: string;
  normalizedName: string;
}

interface SubspeciesSuffixInference {
  baseAsset: string;
  variantAsset: string;
  paldex: number;
}

interface GenerationReport {
  resourceVersion: string;
  generatedAt: string;
  sourceFiles: string[];
  totalCharacters: number;
  canonicalSpeciesCount: number;
  aliasCount: number;
  filteredEntries: FilteredEntry[];
  ambiguousEntries: string[];
  namingRuleInferences: NamingRuleInference[];
  subspeciesSuffixInferences: SubspeciesSuffixInference[];
  warnings: string[];
}

const prefixes = [
  "BOSS_",
  "GYM_",
  "ALPHA_",
  "RAID_",
  "EVENT_",
  "SUMMON_",
  "MINIBOSS_",
  "BETA_",
  "PREDATOR_",
];
const suffixes = [
  "_Oilrig",
  "_MAX",
  "_Otomo",
  "_Avatar",
  "_2",
  "_Quest",
  "_Variant",
  "_Unique",
  "_Boss",
  "_Raid",
  "_Predator",
];

const lower = (value: string): string => value.toLocaleLowerCase("en-US");

async function readJson<T>(path: string): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Missing ${path}. Run "npm run download-pal-resources" before generating the database.`,
      );
    }
    throw error;
  }
}

function elementsFor(character: Character): string[] {
  return [character.stats?.element_type1, character.stats?.element_type2].filter(
    (element): element is string => Boolean(element) && element !== "None",
  );
}

function stripKnownDecorations(value: string): string[] {
  const values = new Set([value]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const current of [...values]) {
      for (const prefix of prefixes) {
        if (lower(current).startsWith(lower(prefix))) {
          const stripped = current.slice(prefix.length);
          if (!values.has(stripped)) {
            values.add(stripped);
            changed = true;
          }
        }
      }
      for (const suffix of suffixes) {
        if (lower(current).endsWith(lower(suffix))) {
          const stripped = current.slice(0, -suffix.length);
          if (stripped && !values.has(stripped)) {
            values.add(stripped);
            changed = true;
          }
        }
      }
    }
  }
  return [...values];
}

function wikiSlug(displayName: string): string {
  return displayName.replace(/\s+/g, "_");
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, await format(JSON.stringify(value), { parser: "json" }));
}

async function main(): Promise<void> {
  const manifest = await readJson<Manifest>(join(resourceDir, "manifest.json"));
  const charactersData = await readJson<CharactersData>(
    join(resourceDir, "characters.json"),
  );
  const breedingData = await readJson<BreedingData>(
    join(resourceDir, "breedingdata.json"),
  );
  const breedingByAsset = new Map(
    Object.keys(breedingData.pal_info).map((asset) => [lower(asset), true]),
  );
  const characters = charactersData.pals;
  const canonicalCandidates = characters.filter(
    (character) =>
      (character.stats?.zukan_index ?? 0) > 0 &&
      breedingByAsset.has(lower(character.asset)),
  );
  const canonicalByAsset = new Map<string, Character>();
  for (const character of canonicalCandidates) {
    const key = lower(character.asset);
    if (canonicalByAsset.has(key)) {
      throw new Error(`Duplicate canonical ID (case-insensitive): ${character.asset}`);
    }
    canonicalByAsset.set(key, character);
  }

  const byPaldex = new Map<number, Character[]>();
  for (const character of canonicalCandidates) {
    const paldex = character.stats!.zukan_index!;
    const group = byPaldex.get(paldex) ?? [];
    group.push(character);
    byPaldex.set(paldex, group);
  }
  const ambiguousEntries: string[] = [];
  const subspeciesSuffixInferences: SubspeciesSuffixInference[] = [];
  const suffixByAsset = new Map<string, string>();
  for (const [paldex, group] of byPaldex) {
    if (group.length > 2) {
      ambiguousEntries.push(
        `paldex ${paldex}: ${group.map((entry) => entry.asset).join(", ")}`,
      );
      continue;
    }
    if (group.length === 1) {
      suffixByAsset.set(lower(group[0].asset), "");
      continue;
    }
    const [first, second] = group;
    const firstIsBase = lower(second.asset).startsWith(`${lower(first.asset)}_`);
    const secondIsBase = lower(first.asset).startsWith(`${lower(second.asset)}_`);
    if (firstIsBase === secondIsBase) {
      ambiguousEntries.push(
        `paldex ${paldex}: ${group.map((entry) => entry.asset).join(", ")}`,
      );
      continue;
    }
    const base = firstIsBase ? first : second;
    const variant = firstIsBase ? second : first;
    suffixByAsset.set(lower(base.asset), "");
    suffixByAsset.set(lower(variant.asset), "B");
    subspeciesSuffixInferences.push({
      baseAsset: base.asset,
      variantAsset: variant.asset,
      paldex,
    });
  }
  if (ambiguousEntries.length > 0) {
    throw new Error(
      `Unable to resolve canonical paldex groups: ${ambiguousEntries.join("; ")}`,
    );
  }

  const canonicalPals: CanonicalPal[] = canonicalCandidates.map((character) => ({
    internalName: character.asset,
    displayName: character.name,
    wikiName: character.name,
    wikiSlug: wikiSlug(character.name),
    paldex: character.stats!.zukan_index!,
    paldexSuffix: suffixByAsset.get(lower(character.asset))!,
    elements: elementsFor(character),
  }));
  const displayNames = new Set<string>();
  const duplicateDisplayNames = new Set<string>();
  const ids = new Set<string>();
  const paldexIds = new Set<string>();
  for (const pal of canonicalPals) {
    if (ids.has(lower(pal.internalName))) {
      throw new Error(`Duplicate canonical ID (case-insensitive): ${pal.internalName}`);
    }
    ids.add(lower(pal.internalName));
    const paldexId = `${pal.paldex}${pal.paldexSuffix}`;
    if (paldexIds.has(paldexId)) {
      throw new Error(`Duplicate canonical paldex ID: ${paldexId}`);
    }
    paldexIds.add(paldexId);
    if (displayNames.has(pal.displayName)) duplicateDisplayNames.add(pal.displayName);
    displayNames.add(pal.displayName);
  }
  if (duplicateDisplayNames.size > 0) {
    throw new Error(
      `Duplicate canonical display names: ${[...duplicateDisplayNames].join(", ")}`,
    );
  }
  canonicalPals.sort(
    (a, b) => a.paldex - b.paldex || a.paldexSuffix.localeCompare(b.paldexSuffix),
  );

  const filteredEntries: FilteredEntry[] = [];
  const namingRuleInferences: NamingRuleInference[] = [];
  const ambiguousAliases: string[] = [];
  const aliases: Record<string, string> = {};
  const canonicalByPaldex = new Map<number, Character[]>();
  for (const character of canonicalCandidates) {
    const group = canonicalByPaldex.get(character.stats!.zukan_index!) ?? [];
    group.push(character);
    canonicalByPaldex.set(character.stats!.zukan_index!, group);
  }
  for (const character of characters) {
    if (canonicalByAsset.has(lower(character.asset))) continue;
    const paldex = character.stats?.zukan_index ?? 0;
    const matchingMetadata = (canonicalByPaldex.get(paldex) ?? []).filter(
      (candidate) =>
        JSON.stringify(elementsFor(candidate)) === JSON.stringify(elementsFor(character)),
    );
    let matches = matchingMetadata;
    let inferred = false;
    let normalizedName = character.asset;
    if (matches.length === 0) {
      const candidates = stripKnownDecorations(character.asset)
        .map((candidate) => canonicalByAsset.get(lower(candidate)))
        .filter((candidate): candidate is Character => Boolean(candidate));
      matches = [
        ...new Map(
          candidates.map((candidate) => [lower(candidate.asset), candidate]),
        ).values(),
      ];
      inferred = matches.length > 0;
      normalizedName =
        stripKnownDecorations(character.asset).find((candidate) =>
          canonicalByAsset.has(lower(candidate)),
        ) ?? character.asset;
    }
    if (matches.length > 1) {
      ambiguousAliases.push(
        `${character.asset}: ${matches.map((match) => match.asset).join(", ")}`,
      );
      continue;
    }
    if (matches.length === 1) {
      aliases[character.asset] = matches[0].asset;
      if (inferred) {
        namingRuleInferences.push({
          assetName: character.asset,
          canonicalInternalName: matches[0].asset,
          normalizedName,
        });
      }
    } else {
      filteredEntries.push({
        assetName: character.asset,
        reason:
          paldex > 0 ? "not resolvable to a canonical species" : "no canonical paldex",
      });
    }
  }
  if (ambiguousAliases.length > 0) {
    throw new Error(`Ambiguous aliases: ${ambiguousAliases.join("; ")}`);
  }
  const report: GenerationReport = {
    resourceVersion: manifest.commit,
    generatedAt: new Date().toISOString(),
    sourceFiles: manifest.files.map((file) => file.path),
    totalCharacters: characters.length,
    canonicalSpeciesCount: canonicalPals.length,
    aliasCount: Object.keys(aliases).length,
    filteredEntries,
    ambiguousEntries,
    namingRuleInferences,
    subspeciesSuffixInferences,
    warnings: [],
  };
  await writeJson(join(outputDir, "palDatabase.json"), canonicalPals);
  await writeJson(join(outputDir, "palAliases.json"), aliases);
  await writeJson(join(outputDir, "generation-report.json"), report);
  console.log(
    `Generated ${canonicalPals.length} canonical species and ${Object.keys(aliases).length} aliases.`,
  );
}

main().catch((error: unknown) => {
  console.error(`Generation failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
