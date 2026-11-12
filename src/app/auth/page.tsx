import { BookOpen, Headset, MessageCircle, Ticket } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthSwitcher } from "@/components/auth/auth-switcher";
import { AppFooter } from "@/components/layout/app-footer";
import { getCurrentUser } from "@/server/auth/current-user";

const featureHighlights = [
  {
    icon: MessageCircle,
    text: "Get instant answers to your product questions",
  },
  {
    icon: Ticket,
    text: "Track every request from open to resolved",
  },
  {
    icon: BookOpen,
    text: "Resolve common issues with helpful guides",
  },
] as const;

export const instant = false;

export default async function AuthPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-cyan-950 px-14 py-14 text-white lg:flex xl:px-20">
          <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-300 shadow-inner backdrop-blur-md">
              <Headset className="size-5" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              IntelliSupport
            </span>
          </div>

          <div className="relative z-10 my-auto max-w-lg py-12">
            <h1 className="mb-6 text-4xl leading-[1.15] font-extrabold tracking-tight xl:text-5xl">
              Get answers and resolutions,{" "}
              <span className="bg-linear-to-r from-blue-300 via-cyan-200 to-sky-300 bg-clip-text text-transparent">
                fast.
              </span>
            </h1>

            <p className="mb-10 text-base leading-relaxed text-blue-100/80">
              Whatever the product or question, chat with our support assistant,
              follow your request until it&apos;s resolved, and find answers on
              your own without waiting on hold.
            </p>

            <ul className="space-y-4">
              {featureHighlights.map((feature) => (
                <li
                  key={feature.text}
                  className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm text-blue-100/90 backdrop-blur-sm transition-colors hover:border-white/20"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/20 text-cyan-300">
                    <feature.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="font-medium">{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex items-center justify-center bg-background px-6 py-10 sm:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-linear-to-tr from-primary to-accent text-white shadow-lg shadow-primary/25">
                <Headset className="size-7" aria-hidden="true" />
              </div>
              <h1 className="brand-gradient-text text-2xl font-extrabold tracking-tight">
                IntelliSupport
              </h1>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Customer Support &amp; Product Hub
              </p>
            </div>

            <AuthSwitcher />
          </div>
        </section>
      </div>
      <AppFooter />
    </div>
  );
}
