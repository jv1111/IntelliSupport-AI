import { config } from "dotenv";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

config({ path: ".env.test.local" });
config({ path: ".env" });

import { GeminiError, sendGeminiMessage } from "@/server/services/gemini";

const shouldRunLiveTest = process.env.RUN_GEMINI_LIVE_TEST === "1";

describe("Gemini Service - Live Sending", () => {
  it.skipIf(!shouldRunLiveTest)(
    "sends a message to Gemini or receives an expected rate limit response",
    async () => {
      let result: Awaited<ReturnType<typeof sendGeminiMessage>>;

      try {
        result = await sendGeminiMessage({
          message:
            "Reply with exactly this text and nothing else: GEMINI_CONNECTION_OK",
        });
      } catch (error) {
        if (error instanceof GeminiError && error.code === "RATE_LIMITED") {
          expect(error.message).toBe("Gemini rate limit exceeded.");
          return;
        }

        throw error;
      }

      expect(result.text).toContain("GEMINI_CONNECTION_OK");
      expect(result.model).toBe(
        process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash",
      );
    },
    60_000,
  );
});
