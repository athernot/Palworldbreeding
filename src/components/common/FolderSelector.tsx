interface FolderSelectorProps {
  folderPath: string | null;
  onSelectFolder: () => void;
}

export function FolderSelector({ folderPath, onSelectFolder }: FolderSelectorProps) {
  return (
    <div className="mb-8">
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700">
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-neutral-100">Save Folder</h2>
            <p className="text-sm text-neutral-500">Select your Palworld save directory</p>
          </div>
        </div>
        
        <div className="bg-neutral-950/50 rounded-xl p-3 mb-4 border border-neutral-800">
          {folderPath ? (
            <p className="text-neutral-400 font-mono text-sm truncate">
              {folderPath}
            </p>
          ) : (
            <p className="text-neutral-600 text-sm">No folder selected</p>
          )}
        </div>
        
        <button
          onClick={onSelectFolder}
          aria-label={folderPath ? "Change folder" : "Browse folder"}
          className="w-full py-3 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-neutral-100 text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:ring-offset-2 focus:ring-offset-neutral-950"
        >
          <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          {folderPath ? "Change Folder" : "Browse Folder"}
        </button>
      </div>
    </div>
  );
}
