import { graphqlRequest } from "@/lib/graphql/client";

export type AccountPhoneStatus = "VERIFIED" | "UNVERIFIED";

export interface AccountPhone {
  id: string;
  phone: string;
  status: AccountPhoneStatus;
  verifiedAt: string | null;
  expiresAt: string | null;
}

const ACCOUNT_PHONES_QUERY = `
  query AccountPhones {
    accountPhones {
      id
      phone
      status
      verifiedAt
      expiresAt
    }
  }
`;

const ADD_PHONE_MUTATION = `
  mutation AddPhone($phone: String!) {
    addPhone(phone: $phone) {
      id
      phone
      status
      verifiedAt
      expiresAt
    }
  }
`;

const VERIFY_PHONE_MUTATION = `
  mutation VerifyPhone($phone: String!, $code: String!) {
    verifyPhone(phone: $phone, code: $code) {
      id
      phone
      status
      verifiedAt
      expiresAt
    }
  }
`;

export async function fetchAccountPhones(): Promise<AccountPhone[]> {
  const result = await graphqlRequest<{
    accountPhones: AccountPhone[];
  }>(ACCOUNT_PHONES_QUERY);

  return result.accountPhones;
}

export async function addAccountPhone(phone: string): Promise<AccountPhone> {
  const result = await graphqlRequest<
    { addPhone: AccountPhone },
    { phone: string }
  >(ADD_PHONE_MUTATION, { phone });

  return result.addPhone;
}

export async function verifyAccountPhone(
  phone: string,
  code: string,
): Promise<AccountPhone> {
  const result = await graphqlRequest<
    { verifyPhone: AccountPhone },
    { phone: string; code: string }
  >(VERIFY_PHONE_MUTATION, { phone, code });

  return result.verifyPhone;
}

export async function deleteAccountPhone(id: string): Promise<boolean> {
  const result = await graphqlRequest<
    { deleteAccountPhone: boolean },
    { id: string }
  >(
    `
      mutation DeleteAccountPhone($id: ID!) {
        deleteAccountPhone(id: $id)
      }
    `,
    { id },
  );

  return result.deleteAccountPhone;
}
