interface VerificationEmailContentInput {
  verificationCode: string;
}

interface VerificationEmailContent {
  subject: string;
  textContent: string;
  htmlContent: string;
}

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

export function createVerificationEmailContent({
  verificationCode,
}: VerificationEmailContentInput): VerificationEmailContent {
  const safeVerificationCode = escapeHtml(verificationCode);

  const textContent = [
    "IntelliSupport",
    "",
    "Verify your email address",
    "",
    "Use the verification code below to complete adding your email address.",
    "",
    verificationCode,
    "",
    "This code expires in 15 minutes.",
    "",
    "If you did not request this code, you can safely ignore this email.",
  ].join("\n");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email address</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f8fc; color: #172b4d; font-family: Arial, Helvetica, sans-serif;">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="background-color: #f5f8fc;"
        >
          <tr>
            <td align="center" style="padding: 48px 24px;">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="max-width: 560px;"
              >
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
                      Email verification
                    </p>
                    <h1 style="margin: 0 0 16px; color: #172b4d; font-size: 28px; line-height: 1.3; font-weight: 700;">
                      Verify your email address
                    </h1>
                    <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.7;">
                      Use the verification code below to complete adding your email address to your IntelliSupport account.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding: 32px 0 24px;">
                    <p style="margin: 0 0 10px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                      Your verification code
                    </p>
                    <p style="margin: 0; color: #2563eb; font-size: 36px; line-height: 1.4; font-weight: 700; letter-spacing: 9px;">
                      ${safeVerificationCode}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 32px; border-bottom: 1px solid #dce5ef;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.7;">
                      This code expires in <strong style="color: #172b4d;">15 minutes</strong>. For your security, do not share this code with anyone.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 24px;">
                    <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.7;">
                      If you did not request this verification, you can safely ignore this email.
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
    subject: "Verify your email address",
    textContent,
    htmlContent,
  };
}
