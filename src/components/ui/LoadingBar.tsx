export function LoadingBar() {
  return (
    <div className="w-full space-y-3">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-0 flex">
          <div className="h-full w-1/3 animate-loading-bar bg-gradient-to-r from-transparent via-primary to-transparent opacity-75" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary delay-75" />
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary delay-150" />
      </div>
      <p className="text-center text-xs text-muted-foreground animate-pulse">
        Parsing save data...
      </p>
    </div>
  );
}
