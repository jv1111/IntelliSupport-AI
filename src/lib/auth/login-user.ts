import { graphqlRequest } from "@/lib/graphql/client";

export interface LoginUserInput {
  username: string;
  password: string;
}

export interface LoggedInUser {
  id: string;
  username: string;
  createdAt: string;
}

interface LoginUserResponse {
  login: LoggedInUser;
}

const LOGIN_USER_MUTATION = `
  mutation LoginUser($input: LoginInput!) {
    login(input: $input) {
      id
      username
      createdAt
    }
  }
`;

export async function loginUser(input: LoginUserInput): Promise<LoggedInUser> {
  const result = await graphqlRequest<
    LoginUserResponse,
    { input: LoginUserInput }
  >(LOGIN_USER_MUTATION, { input });

  return result.login;
}
