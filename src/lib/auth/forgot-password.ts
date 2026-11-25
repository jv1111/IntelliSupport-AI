import { graphqlRequest } from "@/lib/graphql/client";

export interface ForgotPasswordVerification {
  method: "email" | "phone";
  destination: string;
}

const SEND_FORGOT_PASSWORD_VERIFICATION_MUTATION = `
  mutation SendForgotPasswordVerification($identifier: String!) {
    sendForgotPasswordVerification(identifier: $identifier) {
      method
      destination
    }
  }
`;

export async function sendForgotPasswordVerification(
  identifier: string,
): Promise<ForgotPasswordVerification> {
  const result = await graphqlRequest<
    {
      sendForgotPasswordVerification: ForgotPasswordVerification;
    },
    { identifier: string }
  >(SEND_FORGOT_PASSWORD_VERIFICATION_MUTATION, { identifier });

  return result.sendForgotPasswordVerification;
}
