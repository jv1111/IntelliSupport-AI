"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  ChartPie,
  FlaskConical,
  Headset,
  MessagesSquare,
  Package,
  Ticket,
  X,
  type LucideIcon,
} from "lucide-react";
import { AccountMenu } from "@/components/layout/account-menu";
import { Button } from "@/components/ui/button";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

interface AppSidebarProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

const navigationGroups: NavigationGroup[] = [
  {
    label: "Main Menu",
    items: [
      { label: "Dashboard", href: "/", icon: ChartPie },
      {
        label: "Conversations",
        href: "/conversations",
        icon: MessagesSquare,
      },
      { label: "Support Tickets", href: "/tickets", icon: Ticket },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Products", href: "/products", icon: Package },
      {
        label: "Knowledge Base",
        href: "/knowledge-base",
        icon: BookOpen,
      },
      { label: "Bot Manager", href: "/bot-manager", icon: Bot },
      { label: "Playground", href: "/playground", icon: FlaskConical },
    ],
  },
];

export function AppSidebar({ username, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const initial = username.charAt(0).toUpperCase() || "U";

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-secondary text-primary-foreground shadow-md shadow-primary/20">
              <Headset className="size-5" aria-hidden="true" />
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground">
                IntelliSupport
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-primary uppercase">
                Support Portal
              </p>
            </div>
          </div>

          <Button
            variant="icon-surface"
            aria-label="Close navigation"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-6 overflow-y-auto px-4 py-6"
        >
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="mb-2 px-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-150 ${
                      isActive
                        ? "bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/20"
                        : "font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-border bg-surface-muted/50 p-4">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                {initial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {username}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Signed in
                </p>
              </div>
            </div>

            <AccountMenu username={username} onNavigate={onClose} />
          </div>
        </div>
      </aside>
    </>
  );
}
