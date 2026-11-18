import { graphqlRequest } from "@/lib/graphql/client";

export type AccountEmailStatus = "VERIFIED" | "UNVERIFIED";

export interface AccountEmail {
  id: string;
  email: string;
  status: AccountEmailStatus;
  verifiedAt: string | null;
  expiresAt: string | null;
}

const ACCOUNT_EMAILS_QUERY = `
  query AccountEmails {
    accountEmails {
      id
      email
      status
      verifiedAt
      expiresAt
    }
  }
`;

const ADD_EMAIL_MUTATION = `
  mutation AddEmail($email: String!) {
    addEmail(email: $email) {
      id
      email
      status
      verifiedAt
      expiresAt
    }
  }
`;

const VERIFY_EMAIL_MUTATION = `
  mutation VerifyEmail($email: String!, $code: String!) {
    verifyEmail(email: $email, code: $code) {
      id
      email
      status
      verifiedAt
      expiresAt
    }
  }
`;

export async function fetchAccountEmails(): Promise<AccountEmail[]> {
  const result = await graphqlRequest<{
    accountEmails: AccountEmail[];
  }>(ACCOUNT_EMAILS_QUERY);

  return result.accountEmails;
}

export async function addAccountEmail(email: string): Promise<AccountEmail> {
  const result = await graphqlRequest<
    { addEmail: AccountEmail },
    { email: string }
  >(ADD_EMAIL_MUTATION, { email });

  return result.addEmail;
}

export async function verifyAccountEmail(
  email: string,
  code: string,
): Promise<AccountEmail> {
  const result = await graphqlRequest<
    { verifyEmail: AccountEmail },
    { email: string; code: string }
  >(VERIFY_EMAIL_MUTATION, { email, code });

  return result.verifyEmail;
}

export async function deleteAccountEmail(id: string): Promise<boolean> {
  const result = await graphqlRequest<
    { deleteAccountEmail: boolean },
    { id: string }
  >(
    `
      mutation DeleteAccountEmail($id: ID!) {
        deleteAccountEmail(id: $id)
      }
    `,
    { id },
  );

  return result.deleteAccountEmail;
}
