import { getPalDisplayName } from "@/utils/palLookup";

interface PalCardProps {
  internalName: string;
}

export function PalCard({ internalName }: PalCardProps) {
  const displayName = getPalDisplayName(internalName);
  
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 hover:border-neutral-600 hover:bg-neutral-800/50 transition-all duration-150 cursor-pointer">
      <div className="flex items-center justify-center w-10 h-10 mb-2 mx-auto rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition-colors duration-150">
        <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-neutral-100 text-sm font-medium text-center truncate">{displayName}</p>
    </div>
  );
}
