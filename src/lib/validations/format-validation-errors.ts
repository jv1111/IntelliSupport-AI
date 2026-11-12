import type { ZodError } from "zod";

export function formatValidationErrors(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}
