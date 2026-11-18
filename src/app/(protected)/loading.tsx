export default function ProtectedLoading() {
  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <p role="status" className="text-xs font-medium text-muted-foreground">
        Loading page...
      </p>
    </main>
  );
}
