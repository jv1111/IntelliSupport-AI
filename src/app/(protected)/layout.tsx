import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/server/auth/current-user";

export const instant = false;

function ProtectedLayoutFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <p
        role="status"
        className="text-xs font-medium text-muted-foreground"
      >
        Loading workspace...
      </p>
    </div>
  );
}

async function ProtectedLayoutContent({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return <AppShell username={user.username}>{children}</AppShell>;
}

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Suspense fallback={<ProtectedLayoutFallback />}>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </Suspense>
  );
}
