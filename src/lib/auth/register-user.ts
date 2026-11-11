import { graphqlRequest } from "@/lib/graphql/client";

export interface RegisterUserInput {
  username: string;
  password: string;
}

export interface RegisteredUser {
  id: string;
  username: string;
  createdAt: string;
}

interface RegisterUserResponse {
  register: RegisteredUser;
}

const REGISTER_USER_MUTATION = `
  mutation RegisterUser($input: RegisterInput!) {
    register(input: $input) {
      id
      username
      createdAt
    }
  }
`;

export async function registerUser(
  input: RegisterUserInput,
): Promise<RegisteredUser> {
  const result = await graphqlRequest<
    RegisterUserResponse,
    { input: RegisterUserInput }
  >(REGISTER_USER_MUTATION, { input });

  return result.register;
}
