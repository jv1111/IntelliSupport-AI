import { graphqlRequest } from "@/lib/graphql/client";

export interface ForgotPasswordVerification {
  method: "email" | "phone";
  destination: string;
}

export interface ForgotPasswordCodeVerification {
  resetToken: string;
}

const SEND_FORGOT_PASSWORD_VERIFICATION_MUTATION = `
  mutation SendForgotPasswordVerification($identifier: String!) {
    sendForgotPasswordVerification(identifier: $identifier) {
      method
      destination
    }
  }
`;

const VERIFY_FORGOT_PASSWORD_CODE_MUTATION = `
  mutation VerifyForgotPasswordCode($destination: String!, $code: String!) {
    verifyForgotPasswordCode(destination: $destination, code: $code) {
      resetToken
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

export interface ResetPasswordInput {
  newPassword: string;
  confirmPassword: string;
}

const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($resetToken: String!, $input: ResetPasswordInput!) {
    resetPassword(resetToken: $resetToken, input: $input)
  }
`;

export async function resetPassword(
  resetToken: string,
  input: ResetPasswordInput,
): Promise<boolean> {
  const result = await graphqlRequest<
    { resetPassword: boolean },
    { resetToken: string; input: ResetPasswordInput }
  >(RESET_PASSWORD_MUTATION, { resetToken, input });

  return result.resetPassword;
}

export async function verifyForgotPasswordCode(
  destination: string,
  code: string,
): Promise<ForgotPasswordCodeVerification> {
  const result = await graphqlRequest<
    {
      verifyForgotPasswordCode: ForgotPasswordCodeVerification;
    },
    { destination: string; code: string }
  >(VERIFY_FORGOT_PASSWORD_CODE_MUTATION, {
    destination,
    code,
  });

  return result.verifyForgotPasswordCode;
}
