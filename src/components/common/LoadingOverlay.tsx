export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-150" role="status" aria-live="polite">
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
          <p className="text-neutral-100 text-sm font-medium">Processing save...</p>
          <p className="text-neutral-500 text-xs">This may take a moment</p>
        </div>
      </div>
    </div>
  );
}
