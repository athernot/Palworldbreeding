import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CanonicalPal {
  internalName: string;
  displayName: string;
  wikiSlug: string;
  paldex: number;
  elements: string[];
}

interface GitHubCharacter {
  name: string;
  asset: string;
  elements: Record<string, any>;
  stats: {
    zukan_index: number;
    element_type1: string;
    element_type2: string;
  };
}

interface GitHubCharactersData {
  pals: GitHubCharacter[];
}

const GITHUB_CHARACTERS_URL = "https://raw.githubusercontent.com/deafdudecomputers/PalworldSaveTools/main/resources/game_data/characters.json";

// Alias prefixes that map to canonical names
const ALIAS_PREFIXES = ["BOSS_", "GYM_", "ALPHA_", "RAID_", "EVENT_", "SUMMON_", "MINIBOSS_", "BETA_"];

async function fetchGitHubCharacters(): Promise<GitHubCharactersData> {
  const response = await fetch(GITHUB_CHARACTERS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch characters.json: ${response.statusText}`);
  }
  return await response.json();
}

function parseElements(character: GitHubCharacter): string[] {
  const elements: string[] = [];
  const element1 = character.stats.element_type1;
  const element2 = character.stats.element_type2;
  
  if (element1 && element1 !== "None") {
    elements.push(element1);
  }
  if (element2 && element2 !== "None") {
    elements.push(element2);
  }
  
  return elements;
}

function convertToCanonicalPal(character: GitHubCharacter): CanonicalPal {
  const elements = parseElements(character);
  const displayName = character.name;
  const internalName = character.asset;
  const wikiSlug = displayName.replace(/\s+/g, "_");
  const paldex = character.stats.zukan_index || 0;
  
  return {
    internalName,
    displayName,
    wikiSlug,
    paldex,
    elements
  };
}

function generatePalAliases(canonicalPals: CanonicalPal[]): Record<string, string> {
  const aliases: Record<string, string> = {};

  for (const pal of canonicalPals) {
    for (const prefix of ALIAS_PREFIXES) {
      const aliasName = `${prefix}${pal.internalName}`;
      aliases[aliasName] = pal.displayName;
    }
  }

  return aliases;
}

async function generateDatabase() {
  console.log("Fetching Pal data from GitHub...");
  const githubData = await fetchGitHubCharacters();
  
  const canonicalPals: CanonicalPal[] = [];
  const unknownIdentifiers: string[] = [];
  
  for (const character of githubData.pals) {
    try {
      const canonicalPal = convertToCanonicalPal(character);
      canonicalPals.push(canonicalPal);
    } catch (error) {
      unknownIdentifiers.push(character.asset);
    }
  }
  
  // Sort by paldex
  canonicalPals.sort((a, b) => a.paldex - b.paldex);
  
  const outputDir = join(__dirname, "..", "src", "data");
  
  // Generate canonical database
  const canonicalDbPath = join(outputDir, "palDatabase.json");
  const canonicalDbJson = JSON.stringify(canonicalPals, null, 2);
  writeFileSync(canonicalDbPath, canonicalDbJson, "utf-8");
  
  // Generate aliases
  const aliases = generatePalAliases(canonicalPals);
  const aliasesPath = join(outputDir, "palAliases.json");
  const aliasesJson = JSON.stringify(aliases, null, 2);
  writeFileSync(aliasesPath, aliasesJson, "utf-8");

  // Generate report
  console.log("================================================");
  console.log("PAL DATABASE GENERATION REPORT");
  console.log("================================================");
  console.log(`Source file: ${GITHUB_CHARACTERS_URL}`);
  console.log(`Total canonical pals: ${canonicalPals.length}`);
  console.log(`Total aliases: ${Object.keys(aliases).length}`);
  console.log(`Unknown identifiers: ${unknownIdentifiers.length}`);
  if (unknownIdentifiers.length > 0) {
    console.log(`Unknown identifiers: ${unknownIdentifiers.join(", ")}`);
  }
  console.log(`Generation completed`);
  console.log("================================================");
  console.log(`Output files:`);
  console.log(`  - ${canonicalDbPath}`);
  console.log(`  - ${aliasesPath}`);
  console.log("================================================");
}

generateDatabase().catch((error) => {
  console.error("Generation failed:", error);
  process.exit(1);
});
