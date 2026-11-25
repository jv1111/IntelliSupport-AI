import { describe, expect, it } from "vitest";
import { createVerificationCodeEmailContent } from "@/server/email/templates/verification-code-email";

describe("createVerificationCodeEmailContent", () => {
  describe("email verification", () => {
    it("creates email verification content", () => {
      const result = createVerificationCodeEmailContent({
        verificationCode: "123456",
        purpose: "email-verification",
      });

      expect(result.subject).toBe("Verify your email address");
      expect(result.textContent).toContain("Verify your email address");
      expect(result.textContent).toContain(
        "complete adding this email address",
      );
      expect(result.textContent).toContain("123456");
      expect(result.textContent).toContain("15 minutes");

      expect(result.htmlContent).toContain("Email verification");
      expect(result.htmlContent).toContain("Verify your email address");
      expect(result.htmlContent).toContain("123456");
      expect(result.htmlContent).toContain("15 minutes");
    });
  });

  describe("password reset", () => {
    it("creates password reset content", () => {
      const result = createVerificationCodeEmailContent({
        verificationCode: "654321",
        purpose: "password-reset",
      });

      expect(result.subject).toBe("Reset your password");
      expect(result.textContent).toContain("Reset your password");
      expect(result.textContent).toContain("continue resetting the password");
      expect(result.textContent).toContain("Your password reset code");
      expect(result.textContent).toContain("654321");
      expect(result.textContent).toContain(
        "If you did not request a password reset",
      );

      expect(result.htmlContent).toContain("Password reset");
      expect(result.htmlContent).toContain("Reset your password");
      expect(result.htmlContent).toContain("Your password reset code");
      expect(result.htmlContent).toContain("654321");
      expect(result.htmlContent).not.toContain(
        "complete adding this email address",
      );
    });
  });

  describe("HTML escaping", () => {
    it("escapes the verification code in HTML without changing plain text", () => {
      const verificationCode = `<img src=x onerror="alert('x')">&`;

      const result = createVerificationCodeEmailContent({
        verificationCode,
        purpose: "email-verification",
      });

      expect(result.htmlContent).toContain(
        "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;",
      );

      expect(result.htmlContent).not.toContain(verificationCode);
      expect(result.textContent).toContain(verificationCode);
    });
  });
});
