import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";

const sendGeminiMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(10000, "Message must not exceed 10000 characters."),
  systemInstruction: z
    .string()
    .trim()
    .min(1, "System instruction is required."),
});

export class GeminiError extends Error {
  constructor(
    public readonly code:
      | "INVALID_INPUT"
      | "NOT_CONFIGURED"
      | "EMPTY_RESPONSE"
      | "PROVIDER_ERROR"
      | "RATE_LIMITED",
    message: string,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function sendGeminiMessage(input: unknown) {
  const validationResult = sendGeminiMessageSchema.safeParse(input);

  if (!validationResult.success) {
    throw new GeminiError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new GeminiError(
      "NOT_CONFIGURED",
      "Gemini API key is not configured.",
    );
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

  try {
    const ai = new GoogleGenAI({ apiKey });

    const interaction = await ai.interactions.create({
      model,
      input: validationResult.data.message,
      system_instruction: validationResult.data.systemInstruction,
    });

    const text = interaction.output_text?.trim();

    if (!text) {
      throw new GeminiError(
        "EMPTY_RESPONSE",
        "Gemini returned an empty response.",
      );
    }

    return {
      text,
      model,
    };
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }

    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined;

    if (status === 429) {
      throw new GeminiError("RATE_LIMITED", "Gemini rate limit exceeded.");
    }

    throw new GeminiError("PROVIDER_ERROR", "Gemini request failed.");
  }
}
