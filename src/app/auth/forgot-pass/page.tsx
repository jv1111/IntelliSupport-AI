import { Headset, Lock, Mail, ShieldCheck } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AppFooter } from "@/components/layout/app-footer";

const steps = [
  {
    icon: Mail,
    title: "Enter your email",
    text: "Use the contact linked to your account.",
  },
  {
    icon: ShieldCheck,
    title: "Verify it's you",
    text: "We send a 6-digit code to confirm.",
  },
  {
    icon: Lock,
    title: "Set a new password",
    text: "Choose a new password and sign back in.",
  },
] as const;

export default function ForgotPasswordPage() {
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

          <ForgotPasswordForm />
        </div>

        <ul className="mt-12 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-surface/70 p-3.5 backdrop-blur-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <AppFooter />
    </div>
  );
}
