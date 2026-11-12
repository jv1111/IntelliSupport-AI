"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

interface PageHeaderContent {
  title: string;
  description: string;
}

const pageHeaders: Record<string, PageHeaderContent> = {
  "/": {
    title: "Seller Dashboard",
    description:
      "Monitor customer inquiries, resolve open tickets, and curate AI KB resources.",
  },
  "/conversations": {
    title: "Customer Conversations",
    description: "Real-time multi-channel customer inquiry threads.",
  },
  "/tickets": {
    title: "Support Tickets",
    description: "Unresolved customer issue queues.",
  },
  "/products": {
    title: "Products Catalog",
    description: "Manage published store items and drafts.",
  },
  "/knowledge-base": {
    title: "Knowledge Base & AI Resources",
    description: "AI resolution prompt knowledge articles.",
  },
  "/bot-manager": {
    title: "Bot Manager",
    description: "Enable AI support and set instant automatic replies.",
  },
  "/playground": {
    title: "Playground",
    description: "Test how your bot replies to customers.",
  },
  "/billing": {
    title: "Billing",
    description: "Manage your plan, payment options, and linked cards.",
  },
  "/settings/account": {
    title: "Account Settings",
    description:
      "Profile details, email/phone verification, and security credentials.",
  },
  "/settings/stores": {
    title: "Linked Storefronts",
    description: "Connected e-commerce marketplace integrations.",
  },
};

const defaultPageHeader: PageHeaderContent = {
  title: "IntelliSupport",
  description: "Seller workspace",
};

interface AppHeaderProps {
  onMenuClick: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const pathname = usePathname();
  const pageHeader = pageHeaders[pathname] ?? defaultPageHeader;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Button
          variant="icon-surface"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-foreground">
            {pageHeader.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {pageHeader.description}
          </p>
        </div>
      </div>

      <div
        role="img"
        aria-label="Notifications"
        className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground"
      >
        <Bell className="size-4" aria-hidden="true" />
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 size-2 rounded-full bg-danger ring-2 ring-surface"
        />
      </div>
    </header>
  );
}
