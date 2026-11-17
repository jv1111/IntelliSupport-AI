import { graphqlRequest } from "@/lib/graphql/client";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordResponse {
  changePassword: boolean;
}

const CHANGE_PASSWORD_MUTATION = `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  const result = await graphqlRequest<
    ChangePasswordResponse,
    { input: ChangePasswordInput }
  >(CHANGE_PASSWORD_MUTATION, { input });

  if (!result.changePassword) {
    throw new Error("Unable to change password. Please try again.");
  }
}
