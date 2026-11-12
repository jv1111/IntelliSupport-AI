"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";

interface AppShellProps {
  children: ReactNode;
  username: string;
}

export function AppShell({ children, username }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="min-h-dvh bg-background md:flex">
      <AppSidebar
        username={username}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface px-4 sm:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setIsSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground md:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">
              IntelliSupport
            </p>
            <p className="text-xs text-muted-foreground">Seller workspace</p>
          </div>
        </header>

        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
