import { graphqlRequest } from "@/lib/graphql/client";

interface LogoutResponse {
  logout: boolean;
}

const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`;

export async function logoutUser(): Promise<void> {
  const result = await graphqlRequest<LogoutResponse>(LOGOUT_MUTATION);

  if (!result.logout) {
    throw new Error("Unable to log out.");
  }
}
