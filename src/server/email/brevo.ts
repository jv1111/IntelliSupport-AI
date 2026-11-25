import "server-only";

import {
  createVerificationCodeEmailContent,
  type VerificationCodeEmailPurpose,
} from "@/server/email/templates/verification-code-email";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendEmailInput {
  recipientEmail: string;
  verificationCode: string;
}

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  const missingVariables = [
    ["BREVO_API_KEY", apiKey],
    ["BREVO_SENDER_EMAIL", senderEmail],
    ["BREVO_SENDER_NAME", senderName],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing Brevo configuration: ${missingVariables.join(", ")}.`,
    );
  }

  return {
    apiKey: apiKey!,
    senderEmail: senderEmail!,
    senderName: senderName!,
  };
}

async function sendEmailWithCode(
  input: SendEmailInput,
  purpose: VerificationCodeEmailPurpose,
): Promise<void> {
  const { apiKey, senderEmail, senderName } = getBrevoConfig();

  const emailContent = createVerificationCodeEmailContent({
    verificationCode: input.verificationCode,
    purpose,
  });

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: input.recipientEmail }],
      subject: emailContent.subject,
      textContent: emailContent.textContent,
      htmlContent: emailContent.htmlContent,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `Brevo email request failed with status ${response.status}: ${
        responseBody || response.statusText || "No response body returned."
      }`,
    );
  }
}

export function sendVerificationEmail(input: SendEmailInput): Promise<void> {
  return sendEmailWithCode(input, "email-verification");
}

export function sendPasswordResetEmail(input: SendEmailInput): Promise<void> {
  return sendEmailWithCode(input, "password-reset");
}
