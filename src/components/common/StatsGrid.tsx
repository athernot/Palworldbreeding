interface StatsGridProps {
  worldName: string;
  characterName: string;
  totalPals: number;
}

export function StatsGrid({ worldName, characterName, totalPals }: StatsGridProps) {
  const stats = [
    {
      label: "World",
      value: worldName || "Unknown",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Character",
      value: characterName || "Unknown",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: "Total Pals",
      value: totalPals?.toString() || "0",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 hover:border-neutral-600 hover:bg-neutral-800/50 transition-all duration-150"
        >
          <div className="flex items-center justify-center w-8 h-8 mb-3 rounded-lg bg-neutral-800 border border-neutral-700">
            <div className="text-neutral-400">{stat.icon}</div>
          </div>
          <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">{stat.label}</p>
          <p className="text-base font-medium text-neutral-100 truncate">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
