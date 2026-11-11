import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(1, "Username is required.")
  .max(50, "Username cannot exceed 50 characters.")
  .transform((value) => value.toLowerCase());

export const registerCredentialsSchema = z.object({
  username: usernameSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password cannot exceed 128 characters.")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)[\s\S]+$/,
      "Password must contain at least one letter and one number.",
    ),
});

export const loginCredentialsSchema = z.object({
  username: usernameSchema,
  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password cannot exceed 128 characters."),
});

export const signUpSchema = registerCredentialsSchema
  .extend({
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

export type LoginFormValues = z.infer<typeof loginCredentialsSchema>;

export function validateLogin(
  values: LoginFormValues,
): Partial<Record<keyof LoginFormValues, string>> {
  const result = loginCredentialsSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<
    Partial<Record<keyof LoginFormValues, string>>
  >((errors, issue) => {
    const field = issue.path[0];

    if ((field === "username" || field === "password") && !errors[field]) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}
