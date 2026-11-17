import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/settings/account-settings";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <AccountSettings username={user.username} createdAt={user.createdAt} />
  );
}
