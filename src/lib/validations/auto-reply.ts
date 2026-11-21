import { z } from "zod";

const autoReplyIdSchema = z
  .string()
  .trim()
  .min(1, "Auto Reply ID is required.");

export const createAutoReplySchema = z.object({
  productId: autoReplyIdSchema,
  parentId: autoReplyIdSchema
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  question: z.string().trim().min(1, "Question is required."),
  answer: z.string().trim().min(1, "Answer is required."),
});

export const updateAutoReplySchema = z.object({
  question: z.string().trim().min(1, "Question is required."),
  answer: z.string().trim().min(1, "Answer is required."),
});

export type CreateAutoReplyInput = z.infer<typeof createAutoReplySchema>;
