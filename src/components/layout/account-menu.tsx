"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/auth/logout-user";
import {
  EllipsisVertical,
  LogOut,
  ReceiptText,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react";

interface AccountMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface AccountMenuProps {
  username: string;
  onNavigate: () => void;
}

const accountMenuItems: AccountMenuItem[] = [
  {
    label: "My Account",
    href: "/settings/account",
    icon: UserRound,
  },
  {
    label: "Linked Store",
    href: "/settings/stores",
    icon: Store,
  },
  {
    label: "Bills",
    href: "/billing",
    icon: ReceiptText,
  },
];

export function AccountMenu({ username, onNavigate }: AccountMenuProps) {
  const router = useRouter();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && !accountMenuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function openLogoutDialog() {
    setIsOpen(false);
    setLogoutError(null);
    setIsLogoutDialogOpen(true);
  }

  function closeLogoutDialog() {
    if (isLoggingOut) {
      return;
    }

    setIsLogoutDialogOpen(false);
    setLogoutError(null);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logoutUser();

      setIsOpen(false);
      setIsLogoutDialogOpen(false);
      setIsLoggingOut(false);
      setLogoutError(null);

      router.replace("/auth");
    } catch {
      setLogoutError("Unable to log out. Please try again.");
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <div ref={accountMenuRef} className="relative shrink-0">
        <Button
          variant="icon-surface"
          aria-label="Account options"
          aria-expanded={isOpen}
          aria-controls={isOpen ? "account-options-panel" : undefined}
          onClick={() => setIsOpen((open) => !open)}
        >
          <EllipsisVertical className="size-5" aria-hidden="true" />
        </Button>

        {isOpen ? (
          <div
            id="account-options-panel"
            className="absolute right-0 bottom-full z-60 mb-2 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl shadow-foreground/10"
          >
            <div className="border-b border-border bg-surface-muted/50 px-3 py-2.5">
              <p className="truncate text-xs font-semibold text-foreground">
                {username}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Signed in
              </p>
            </div>

            <nav aria-label="Account navigation" className="p-1.5">
              <div className="space-y-0.5">
                {accountMenuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate();
                      }}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
                    >
                      <Icon
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-border p-1.5">
              <button
                type="button"
                onClick={openLogoutDialog}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmationDialog
        open={isLogoutDialogOpen}
        title="Logout?"
        description="You will be signed out of your IntelliSupport account. You will need to log in again to access your workspace."
        confirmLabel="Logout"
        pendingLabel="Logging out..."
        variant="danger"
        icon={LogOut}
        isPending={isLoggingOut}
        error={logoutError}
        onConfirm={handleLogout}
        onCancel={closeLogoutDialog}
      />
    </>
  );
}
