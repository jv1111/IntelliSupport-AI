import { z } from "zod";

export const signUpSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required."),
    password: z
      .string()
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8}$/,
        "Password must be exactly 8 characters and contain at least one letter and one number.",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export function validateSignUp(
  values: SignUpFormValues,
): Partial<Record<keyof SignUpFormValues, string>> {
  const result = signUpSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<
    Partial<Record<keyof SignUpFormValues, string>>
  >((errors, issue) => {
    const field = issue.path[0];

    if (
      (field === "username" ||
        field === "password" ||
        field === "confirmPassword") &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}
