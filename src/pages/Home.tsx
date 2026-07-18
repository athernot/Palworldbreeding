import { useState } from "react";
import { extractSave } from "@/ipc";
import { getPalDisplayName } from "@/utils/palLookup";
import { HeroSection } from "@/components/sections/HeroSection";
import { FolderSelector } from "@/components/common/FolderSelector";
import { StatsGrid } from "@/components/common/StatsGrid";
import { SearchBar } from "@/components/common/SearchBar";
import { PalGrid } from "@/components/common/PalGrid";
import { BottomToolbar } from "@/components/common/BottomToolbar";
import { LoadingOverlay } from "@/components/common/LoadingOverlay";

type ExtractData = {
  worldName: string;
  characterName: string;
  ownedPals: string[];
};

type Status = "idle" | "loading" | "done" | "error";

export const Home = () => {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [data, setData] = useState<ExtractData | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectFolder = async () => {
    const selected = await window.electronAPI.selectFolder();
    if (selected) setFolderPath(selected);
  };

  const handleProcessSave = async () => {
    if (!folderPath) return;
    setData(null);
    setSearchQuery("");
    setStatus("loading");
    setErrorMessage("");
    try {
      const result = await extractSave(folderPath);
      
      if (!result.success) {
        setStatus("error");
        setErrorMessage(result.error);
        return;
      }
      
      setData(result.data as ExtractData);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const filteredPals = (data?.ownedPals ?? []).filter((pal) =>
    getPalDisplayName(pal).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCopy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.ownedPals.join("\n"));
  };

  const handleExportTxt = () => {
    if (!data) return;
    const text = data.ownedPals.join("\n");
    downloadBlob(text, "owned_pals.txt", "text/plain");
  };

  const handleExportCsv = () => {
    if (!data) return;
    const text = "Name\n" + data.ownedPals.join("\n");
    downloadBlob(text, "owned_pals.csv", "text/csv");
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[800px]">
          <HeroSection />
          
          <FolderSelector 
            folderPath={folderPath} 
            onSelectFolder={handleSelectFolder} 
          />
          
          {folderPath && (
            <button
              onClick={handleProcessSave}
              disabled={status === "loading"}
              className="w-full mb-8 py-3 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-neutral-100 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:ring-offset-2 focus:ring-offset-neutral-950"
            >
              {status === "loading" ? "Processing..." : "Process Save"}
            </button>
          )}

          {status === "error" && (
            <div className="mb-8 bg-neutral-900/50 border border-red-900/50 rounded-xl p-4" role="alert" aria-live="assertive">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-neutral-300 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {status === "done" && data && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <StatsGrid
                worldName={data.worldName}
                characterName={data.characterName}
                totalPals={data.ownedPals.length}
              />
              
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                totalCount={filteredPals.length}
              />
              
              <PalGrid pals={filteredPals} />
              
              <BottomToolbar
                onCopy={handleCopy}
                onExportTxt={handleExportTxt}
                onExportCsv={handleExportCsv}
              />
            </div>
          )}
        </div>
      </div>
      
      {status === "loading" && <LoadingOverlay />}
    </div>
  );
}

function downloadBlob(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
