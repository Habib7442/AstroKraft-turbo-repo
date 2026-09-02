export function PageLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-surface-border" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-gold" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Loading</p>
      </div>
    </div>
  );
}
