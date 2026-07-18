import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const resourceDir = join(__dirname, "resources");
const repository = "deafdudecomputers/PalworldSaveTools";
const sourceFiles = [
  "resources/game_data/characters.json",
  "resources/game_data/breedingdata.json",
] as const;

interface CommitResponse {
  sha?: string;
}

interface ManifestFile {
  path: string;
  size: number;
  sha256: string;
}

interface Manifest {
  commit: string;
  downloadedAt: string;
  files: ManifestFile[];
}

async function fetchBytes(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Palworldbreeding-resource-downloader" },
  });
  if (!response.ok) {
    throw new Error(
      `Download failed (${response.status} ${response.statusText}): ${url}`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

async function main(): Promise<void> {
  const commitResponse = await fetch(
    `https://api.github.com/repos/${repository}/commits/main`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Palworldbreeding-resource-downloader",
      },
    },
  );
  if (!commitResponse.ok) {
    throw new Error(
      `Unable to resolve the current main commit (${commitResponse.status} ${commitResponse.statusText}).`,
    );
  }
  const commit = (await commitResponse.json()) as CommitResponse;
  if (!commit.sha) {
    throw new Error("GitHub API response did not contain a commit SHA.");
  }

  await mkdir(resourceDir, { recursive: true });
  const files: ManifestFile[] = [];
  for (const sourceFile of sourceFiles) {
    const bytes = await fetchBytes(
      `https://raw.githubusercontent.com/${repository}/${commit.sha}/${sourceFile}`,
    );
    const destination = join(resourceDir, sourceFile.split("/").at(-1)!);
    await writeFile(destination, bytes);
    files.push({
      path: sourceFile,
      size: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }

  const manifest: Manifest = {
    commit: commit.sha,
    downloadedAt: new Date().toISOString(),
    files,
  };
  await writeFile(
    join(resourceDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`Downloaded ${files.length} resources at ${commit.sha}.`);
}

main().catch((error: unknown) => {
  console.error(
    `Resource download failed: ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
});
