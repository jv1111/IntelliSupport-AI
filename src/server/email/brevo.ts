import "server-only";

import { createVerificationEmailContent } from "@/server/email/templates/verification-email";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendVerificationEmailInput {
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

export async function sendVerificationEmail({
  recipientEmail,
  verificationCode,
}: SendVerificationEmailInput): Promise<void> {
  const { apiKey, senderEmail, senderName } = getBrevoConfig();
  const emailContent = createVerificationEmailContent({ verificationCode });

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
      to: [{ email: recipientEmail }],
      subject: emailContent.subject,
      textContent: emailContent.textContent,
      htmlContent: emailContent.htmlContent,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Brevo email request failed with status ${response.status}.`,
    );
  }
}
