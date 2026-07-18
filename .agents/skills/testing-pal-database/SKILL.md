---
name: testing-pal-database
description: Test the Palworld save extractor UI and the pal database generation pipeline end-to-end. Use when verifying changes to tools/generate-pal-db.ts, tools/download-pal-resources.ts, src/data/palDatabase.json, palAliases.json, or the pal name lookup UI.
---

# Testing the pal database pipeline and UI

## Key facts
- The app is Electron + React (Vite). `npm run dev` starts Vite AND spawns an Electron window (via vite-plugin-electron); killing the Electron process also kills the Vite server.
- Real save decoding requires a Palworld save folder plus a Windows Oodle DLL (`oo2core_*.dll`), which are usually unavailable on Linux test VMs — decoding might fail there. Workaround: test the UI in a plain browser with a stubbed IPC boundary (below).
- `src/utils/palLookup.ts` builds its map ONLY from `palDatabase.json` (exact match + one prefix strip). It does not consume `palAliases.json` (as of Milestone 1.4) — alias-only identifiers display as raw IDs; this might change in later milestones.

## Browser-based UI testing (no Electron, no save file)
1. Temporarily guard the electron plugin in `vite.config.ts`: `process.env.BROWSER_TEST ? undefined : electron({...})`, then run `BROWSER_TEST=1 npx vite`.
2. Temporarily stub `window.electronAPI` in `src/main.tsx` (before render) with `selectFolder` returning a fake path and `invokeExtractSave` returning `{ success: true, data: { worldName, characterName, ownedPals: [...] } }` using REAL internal identifiers (e.g. `Alpaca`, `Blueplatypus`, `BluePlatypus_Fire`, `BOSS_Baphomet_Dark`, `SheepBall`).
3. Open http://localhost:5173, click Browse Folder → Process Save, verify resolved display names in the pal grid and the search counter.
4. REVERT both temporary edits before finishing (`git checkout -- src/main.tsx vite.config.ts`).

## Good adversarial assertions
- Subspecies pair resolves distinctly: `Blueplatypus`→Fuack and `BluePlatypus_Fire`→Fuack Ignis (shared paldex 5, suffixes ""/"B").
- Prefix strip: `BOSS_Baphomet_Dark`→Incineram Noct.
- Non-canonical entities (e.g. `GYM_ElecPanda_Otomo`) must NOT resolve to canonical species names.

## Generator pipeline tests (shell only, don't record)
- `npm run generate-pal-db` must succeed offline using committed `tools/resources/` files (expect ~288 species / ~381 aliases; counts change with game updates).
- Fail conditions: duplicate a canonical asset or display name in a temp-modified `tools/resources/characters.json` → expect exit 1 with a "Duplicate ..." message. Restore from backup afterwards and re-run to confirm clean regeneration (only `generatedAt` should differ in `src/data/generation-report.json`).
- Missing `tools/resources/manifest.json` → expect exit 1 telling you to run `npm run download-pal-resources`.
- `npm run download-pal-resources` hits the GitHub API to resolve the PalworldSaveTools main SHA; it might fail with 403 rate limiting on shared IPs — retry later or fetch pinned raw URLs manually.

## Useful commands
- Lint: `npm run lint`; typecheck/build: `npx tsc -b`, `npm run build`; format: `npm run format:check` (whole-repo check might fail on pre-existing files — use focused checks).

## Devin Secrets Needed
- None (public repos, no credentials required).
