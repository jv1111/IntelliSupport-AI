import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";
import { AccountSettings } from "@/components/settings/account-settings";
import { getCurrentUser } from "@/server/auth/current-user";

async function AccountSettingsContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <AccountSettings username={user.username} createdAt={user.createdAt} />
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading account settings..." />}
    >
      <AccountSettingsContent />
    </Suspense>
  );
}
