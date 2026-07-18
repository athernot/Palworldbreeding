import palDatabase from "../data/palDatabase.json";

interface PalEntry {
  internalName: string;
  displayName: string;
  wikiName: string;
}

const PREFIXES = [
  "BOSS_",
  "GYM_",
  "ALPHA_",
  "RAID_",
  "EVENT_",
  "SUMMON_",
  "MINIBOSS_",
] as const;

// Build a lookup map for O(1) access
const palLookupMap = new Map<string, string>();
palDatabase.forEach((entry: PalEntry) => {
  palLookupMap.set(entry.internalName, entry.displayName);
});

// Track logged unknown identifiers to avoid spam
const loggedUnknownIdentifiers = new Set<string>();

/**
 * Gets the official display name for a Pal from its internal name.
 * 
 * Lookup strategy:
 * 1. Exact match in database
 * 2. If not found, strip known prefixes and try again
 * 3. If still not found, return original internal name
 * 
 * @param internalName - The raw internal name from the save file
 * @returns The official display name from the Palworld Wiki
 */
export function getPalDisplayName(internalName: string): string {
  // Try exact match first
  const exactMatch = palLookupMap.get(internalName);
  if (exactMatch) {
    return exactMatch;
  }

  // Try prefix normalization
  for (const prefix of PREFIXES) {
    if (internalName.startsWith(prefix)) {
      const strippedName = internalName.slice(prefix.length);
      const strippedMatch = palLookupMap.get(strippedName);
      if (strippedMatch) {
        return strippedMatch;
      }
    }
  }

  // Log unknown identifier once (development only)
  if (import.meta.env.DEV && !loggedUnknownIdentifiers.has(internalName)) {
    console.warn(`Unknown Pal identifier: ${internalName}`);
    loggedUnknownIdentifiers.add(internalName);
  }

  // Return original if not found
  return internalName;
}
