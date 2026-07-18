interface BottomToolbarProps {
  onCopy: () => void;
  onExportTxt: () => void;
  onExportCsv: () => void;
}

export function BottomToolbar({ onCopy, onExportTxt, onExportCsv }: BottomToolbarProps) {
  const buttons = [
    {
      label: "Copy",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      onClick: onCopy,
    },
    {
      label: "Export TXT",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: onExportTxt,
    },
    {
      label: "Export CSV",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: onExportCsv,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mt-6">
      {buttons.map((button) => (
        <button
          key={button.label}
          onClick={button.onClick}
          aria-label={button.label}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-neutral-100 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:ring-offset-2 focus:ring-offset-neutral-950"
        >
          <span className="text-neutral-400">{button.icon}</span>
          {button.label}
        </button>
      ))}
    </div>
  );
}
