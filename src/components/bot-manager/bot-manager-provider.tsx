"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  initialAutoReplies,
  initialAutoReplyGroups,
} from "@/components/bot-manager/data";
import type { AutoReply, AutoReplyGroup } from "@/components/bot-manager/types";

interface BotManagerContextValue {
  aiEnabled: boolean;
  setAiEnabled: Dispatch<SetStateAction<boolean>>;
  autoRepliesEnabled: boolean;
  setAutoRepliesEnabled: Dispatch<SetStateAction<boolean>>;
  groups: AutoReplyGroup[];
  setGroups: Dispatch<SetStateAction<AutoReplyGroup[]>>;
  replies: AutoReply[];
  setReplies: Dispatch<SetStateAction<AutoReply[]>>;
}

const BotManagerContext = createContext<BotManagerContextValue | null>(null);

export function BotManagerProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoRepliesEnabled, setAutoRepliesEnabled] = useState(true);
  const [groups, setGroups] = useState(initialAutoReplyGroups);
  const [replies, setReplies] = useState(initialAutoReplies);

  return (
    <BotManagerContext.Provider
      value={{
        aiEnabled,
        setAiEnabled,
        autoRepliesEnabled,
        setAutoRepliesEnabled,
        groups,
        setGroups,
        replies,
        setReplies,
      }}
    >
      {children}
    </BotManagerContext.Provider>
  );
}

export function useBotManagerState() {
  const context = useContext(BotManagerContext);

  if (!context) {
    throw new Error(
      "useBotManagerState must be used within BotManagerProvider.",
    );
  }

  return context;
}
