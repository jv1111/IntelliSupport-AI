"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/conversations": "Conversations",
  "/tickets": "Support Tickets",
  "/products": "Products",
  "/knowledge-base": "Knowledge Base",
  "/bot-manager": "Bot Manager",
  "/playground": "Playground",
  "/billing": "Bills",
  "/settings/account": "My Account",
  "/settings/stores": "Linked Store",
};

interface AppHeaderProps {
  onMenuClick: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "IntelliSupport";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface px-4 sm:px-6">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onMenuClick}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div>
        <p className="text-lg font-bold tracking-tight text-foreground">
          {pageTitle}
        </p>
        <p className="text-xs text-muted-foreground">Seller workspace</p>
      </div>
    </header>
  );
}
