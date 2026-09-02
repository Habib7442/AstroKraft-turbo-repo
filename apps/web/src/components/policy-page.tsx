interface PolicyPageProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export function PolicyPage({ title, updatedAt, children }: PolicyPageProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Last updated: {updatedAt}</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-body [&_h2]:mt-2 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </div>
    </main>
  );
}
