interface PagePlaceholderProps {
  title: string;
}

export function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <main className="min-h-full p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
    </main>
  );
}
