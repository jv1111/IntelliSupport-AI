import type { ReactNode } from "react";
import { BotManagerProvider } from "@/components/bot-manager/bot-manager-provider";

export default function BotManagerLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <BotManagerProvider>{children}</BotManagerProvider>;
}
