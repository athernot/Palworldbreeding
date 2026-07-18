interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
}

export function SearchBar({ value, onChange, totalCount }: SearchBarProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search pals..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search pals"
          className="w-full py-2.5 pl-10 pr-4 bg-neutral-900/50 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all duration-150"
        />
        {value && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <span className="text-xs text-neutral-500">{totalCount} found</span>
          </div>
        )}
      </div>
    </div>
  );
}
