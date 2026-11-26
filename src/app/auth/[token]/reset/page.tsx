import { Headset } from "lucide-react";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AppFooter } from "@/components/layout/app-footer";
import { hasValidPasswordResetToken } from "@/server/services/forgot-password";

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { token } = await params;
  const isValidToken = await hasValidPasswordResetToken(token);

  if (!isValidToken) {
    notFound();
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-accent/10 blur-3xl" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-linear-to-tr from-primary to-accent text-white shadow-lg shadow-primary/25">
              <Headset className="size-6" aria-hidden="true" />
            </div>
            <p className="brand-gradient-text text-xl font-extrabold tracking-tight">
              IntelliSupport
            </p>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
