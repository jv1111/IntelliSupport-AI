export type VerificationCodeEmailPurpose =
  "email-verification" | "password-reset";

interface VerificationCodeEmailContentInput {
  verificationCode: string;
  purpose: VerificationCodeEmailPurpose;
}

interface VerificationCodeEmailContent {
  subject: string;
  textContent: string;
  htmlContent: string;
}

interface EmailCopy {
  subject: string;
  eyebrow: string;
  title: string;
  description: string;
  codeLabel: string;
  securityNotice: string;
  footerNotice: string;
}

const emailCopy: Record<VerificationCodeEmailPurpose, EmailCopy> = {
  "email-verification": {
    subject: "Verify your email address",
    eyebrow: "Email verification",
    title: "Verify your email address",
    description:
      "Use the verification code below to complete adding this email address to your IntelliSupport account.",
    codeLabel: "Your verification code",
    securityNotice:
      "This code expires in 15 minutes. For your security, do not share this code with anyone.",
    footerNotice:
      "If you did not request this verification, you can safely ignore this email.",
  },
  "password-reset": {
    subject: "Reset your password",
    eyebrow: "Password reset",
    title: "Reset your password",
    description:
      "Use the code below to continue resetting the password for your IntelliSupport account.",
    codeLabel: "Your password reset code",
    securityNotice:
      "For your security, do not share this password reset code with anyone.",
    footerNotice:
      "If you did not request a password reset, you can safely ignore this email.",
  },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export function createVerificationCodeEmailContent({
  verificationCode,
  purpose,
}: VerificationCodeEmailContentInput): VerificationCodeEmailContent {
  const copy = emailCopy[purpose];
  const safeVerificationCode = escapeHtml(verificationCode);

  const textContent = [
    "IntelliSupport",
    "",
    copy.title,
    "",
    copy.description,
    "",
    copy.codeLabel,
    verificationCode,
    "",
    copy.securityNotice,
    "",
    copy.footerNotice,
  ].join("\n");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(copy.subject)}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f8fc; color: #172b4d; font-family: Arial, Helvetica, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f8fc;">
          <tr>
            <td align="center" style="padding: 48px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px;">
                <tr>
                  <td style="padding-bottom: 28px; border-bottom: 1px solid #dce5ef;">
                    <p style="margin: 0; color: #2563eb; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
                      IntelliSupport
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 36px;">
                    <p style="margin: 0 0 12px; color: #0369a1; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                      ${escapeHtml(copy.eyebrow)}
                    </p>
                    <h1 style="margin: 0 0 16px; color: #172b4d; font-size: 28px; line-height: 1.3; font-weight: 700;">
                      ${escapeHtml(copy.title)}
                    </h1>
                    <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.7;">
                      ${escapeHtml(copy.description)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding: 32px 0 24px;">
                    <p style="margin: 0 0 10px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                      ${escapeHtml(copy.codeLabel)}
                    </p>
                    <p style="margin: 0; color: #2563eb; font-size: 36px; line-height: 1.4; font-weight: 700; letter-spacing: 9px;">
                      ${safeVerificationCode}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 32px; border-bottom: 1px solid #dce5ef;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.7;">
                      ${escapeHtml(copy.securityNotice)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 24px;">
                    <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.7;">
                      ${escapeHtml(copy.footerNotice)}
                    </p>
                    <p style="margin: 16px 0 0; color: #64748b; font-size: 12px;">
                      © IntelliSupport
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return {
    subject: copy.subject,
    textContent,
    htmlContent,
  };
}
