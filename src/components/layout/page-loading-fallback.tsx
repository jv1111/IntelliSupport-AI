interface PageLoadingFallbackProps {
  message: string;
}

export function PageLoadingFallback({ message }: PageLoadingFallbackProps) {
  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-6">
      <section className="flex min-h-0 flex-1 flex-col gap-6">
        <div
          className="flex min-h-64 flex-1 items-center justify-center text-xs font-medium text-muted-foreground"
          role="status"
        >
          {message}
        </div>
      </section>
    </main>
  );
}
