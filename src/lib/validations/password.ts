import { z } from "zod";

export const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password cannot exceed 128 characters.")
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)[\s\S]+$/,
    "Password must contain at least one letter and one number.",
  );

export const loginPasswordSchema = z
  .string()
  .min(1, "Password is required.")
  .max(128, "Password cannot exceed 128 characters.");

export const confirmPasswordSchema = z
  .string()
  .min(1, "Please confirm your password.");
