export function HeroSection() {
  return (
    <div className="text-center mb-16">
      <div className="inline-flex items-center justify-center w-16 h-16 mb-8 rounded-xl bg-neutral-800/50 border border-neutral-700/50">
        <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h1 className="text-4xl font-semibold text-neutral-100 mb-3 tracking-tight">
        Palworld Save Extractor
      </h1>
      <p className="text-base text-neutral-400">
        Extract and view your owned pals from save files
      </p>
    </div>
  );
}
