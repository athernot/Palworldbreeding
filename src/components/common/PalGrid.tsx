import { PalCard } from "@/components/cards/PalCard";

interface PalGridProps {
  pals: string[];
}

export function PalGrid({ pals }: PalGridProps) {
  if (pals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-neutral-500 text-sm">No pals found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-3">
      {pals.map((pal, index) => (
        <PalCard key={index} internalName={pal} />
      ))}
    </div>
  );
}
