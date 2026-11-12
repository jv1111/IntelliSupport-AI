"use client";

import { useState, type ReactNode } from "react";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

interface AppShellProps {
  children: ReactNode;
  username: string;
}

export function AppShell({ children, username }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function openSidebar() {
    setIsSidebarOpen(true);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="h-dvh overflow-hidden bg-background md:flex">
      <AppSidebar
        username={username}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col md:pl-64">
        <AppHeader onMenuClick={openSidebar} />

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <AppFooter />
      </div>
    </div>
  );
}
