"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchBotSettings,
  updateBotSettings as updateBotSettingsRequest,
} from "@/lib/bot-settings";
import type { BotSettings, UpdateBotSettingsInput } from "@/lib/bot-settings";

export function useBotSettings() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(
    () => new Set<keyof BotSettings>(),
  );
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchBotSettings();

        if (!cancelled) {
          setSettings(result);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load bot settings. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const updateSettings = useCallback(
    async (input: UpdateBotSettingsInput): Promise<boolean> => {
      const settingKeys = (["aiEnabled", "autoRepliesEnabled"] as const).filter(
        (key) => input[key] !== undefined,
      );

      if (
        !settings ||
        settingKeys.length === 0 ||
        settingKeys.some((key) => savingSettings.has(key))
      ) {
        return false;
      }

      setSavingSettings((current) => new Set([...current, ...settingKeys]));
      setError(null);

      try {
        const updatedSettings = await updateBotSettingsRequest(input);

        setSettings((current) =>
          current ? { ...current, ...input } : updatedSettings,
        );

        return true;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to update bot settings. Please try again.",
        );

        return false;
      } finally {
        setSavingSettings((current) => {
          const next = new Set(current);
          settingKeys.forEach((key) => next.delete(key));
          return next;
        });
      }
    },
    [savingSettings, settings],
  );

  const retry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return {
    settings,
    isLoading,
    isSavingSettings: savingSettings.size > 0,
    isSavingAiEnabled: savingSettings.has("aiEnabled"),
    isSavingAutoRepliesEnabled: savingSettings.has("autoRepliesEnabled"),
    error,
    updateSettings,
    retry,
  };
}
