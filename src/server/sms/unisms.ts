import "server-only";

const UNISMS_API_URL = "https://unismsapi.com/api/sms";

interface SendVerificationSmsInput {
  recipientPhone: string;
  verificationCode: string;
}

function getUniSmsConfig() {
  const apiKey = process.env.UNISMS_API_KEY;
  const senderId = process.env.UNISMS_SENDER_ID;

  const missingVariables = [
    ["UNISMS_API_KEY", apiKey],
    ["UNISMS_SENDER_ID", senderId],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing UniSMS configuration: ${missingVariables.join(", ")}.`,
    );
  }

  return {
    apiKey: apiKey!,
    senderId: senderId!,
  };
}

export async function sendVerificationSms({
  recipientPhone,
  verificationCode,
}: SendVerificationSmsInput): Promise<void> {
  const { apiKey, senderId } = getUniSmsConfig();
  const authorization = Buffer.from(`${apiKey}:`).toString("base64");

  const response = await fetch(UNISMS_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Basic ${authorization}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      recipient: recipientPhone,
      content: `Your IntelliSupport verification code is ${verificationCode}. It expires in 15 minutes. Do not share this code.`,
      sender_id: senderId,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`UniSMS request failed with status ${response.status}.`);
  }
}
