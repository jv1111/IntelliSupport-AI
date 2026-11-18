import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import test from "node:test";

const endpoint = process.env.GRAPHQL_URL ?? "http://localhost:3000/api/graphql";
const username = process.env.PRODUCT_TEST_USERNAME;
const password = process.env.PRODUCT_TEST_PASSWORD;

async function graphql(query, variables = {}, cookie) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();

  return { response, payload };
}

function assertSuccess(result) {
  assert.equal(result.response.ok, true);
  assert.equal(
    result.payload.errors,
    undefined,
    JSON.stringify(result.payload.errors),
  );
}

function assertError(result, expectedCode) {
  assert.equal(
    result.payload.errors?.[0]?.extensions?.code,
    expectedCode,
    JSON.stringify(result.payload.errors),
  );
}

function getSessionCookie(response) {
  const cookies = response.headers.getSetCookie?.() ?? [
    response.headers.get("set-cookie") ?? "",
  ];

  const cookie = cookies.find((value) =>
    value.startsWith("intellisupport_session="),
  );

  assert.ok(cookie, "Session cookie was not returned.");

  return cookie.split(";")[0];
}

test("email verification lifecycle", async (t) => {
  assert.ok(username, "PRODUCT_TEST_USERNAME is required.");
  assert.ok(password, "PRODUCT_TEST_PASSWORD is required.");
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required.");

  const database = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await database.connect();

  const testEmails = [];
  let cookie;

  t.after(async () => {
    try {
      if (testEmails.length) {
        await database.query(
          'DELETE FROM "unverified_emails" WHERE email = ANY($1::varchar[])',
          [testEmails],
        );

        await database.query(
          'DELETE FROM "user_emails" WHERE email = ANY($1::varchar[])',
          [testEmails],
        );
      }

      if (cookie) {
        const logout = await graphql(
          `
            mutation Logout {
              logout
            }
          `,
          {},
          cookie,
        );

        assertSuccess(logout);
      }
    } finally {
      await database.end();
    }
  });

  const anonymousEmails = await graphql(`
    query AccountEmails {
      accountEmails {
        id
      }
    }
  `);

  assertError(anonymousEmails, "UNAUTHENTICATED");

  const anonymousAdd = await graphql(
    `
      mutation AddEmail($email: String!) {
        addEmail(email: $email) {
          id
        }
      }
    `,
    { email: "anonymous@example.com" },
  );

  assertError(anonymousAdd, "UNAUTHENTICATED");

  const login = await graphql(
    `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          id
          username
        }
      }
    `,
    { input: { username, password } },
  );

  assertSuccess(login);
  cookie = getSessionCookie(login.response);

  const email = `email-verification-${randomUUID()}@example.com`;
  testEmails.push(email);

  const added = await graphql(
    `
      mutation AddEmail($email: String!) {
        addEmail(email: $email) {
          id
          email
          status
          verifiedAt
          expiresAt
          verificationCode
        }
      }
    `,
    { email: email.toUpperCase() },
    cookie,
  );

  assertSuccess(added);

  const pending = added.payload.data.addEmail;

  assert.ok(pending.id);
  assert.equal(pending.email, email);
  assert.equal(pending.status, "UNVERIFIED");
  assert.equal(pending.verifiedAt, null);
  assert.match(pending.verificationCode, /^\d{6}$/);
  assert.ok(pending.expiresAt);

  const remainingTime = new Date(pending.expiresAt).getTime() - Date.now();

  assert.ok(remainingTime > 14 * 60 * 1000);
  assert.ok(remainingTime <= 15 * 60 * 1000);

  const pendingRecord = await database.query(
    'SELECT "verificationCodeHash" FROM "unverified_emails" WHERE email = $1',
    [email],
  );

  assert.equal(pendingRecord.rowCount, 1);
  assert.notEqual(
    pendingRecord.rows[0].verificationCodeHash,
    pending.verificationCode,
  );
  assert.ok(pendingRecord.rows[0].verificationCodeHash.length > 64);

  const listedPending = await graphql(
    `
      query AccountEmails {
        accountEmails {
          email
          status
          verifiedAt
          expiresAt
        }
      }
    `,
    {},
    cookie,
  );

  assertSuccess(listedPending);

  assert.ok(
    listedPending.payload.data.accountEmails.some(
      (item) => item.email === email && item.status === "UNVERIFIED",
    ),
  );

  const wrongCode = pending.verificationCode === "000000" ? "000001" : "000000";

  const invalidVerification = await graphql(
    `
      mutation VerifyEmail($email: String!, $code: String!) {
        verifyEmail(email: $email, code: $code) {
          id
        }
      }
    `,
    { email, code: wrongCode },
    cookie,
  );

  assertError(invalidVerification, "INVALID_VERIFICATION_CODE");

  const verified = await graphql(
    `
      mutation VerifyEmail($email: String!, $code: String!) {
        verifyEmail(email: $email, code: $code) {
          id
          email
          status
          verifiedAt
          expiresAt
        }
      }
    `,
    { email, code: pending.verificationCode },
    cookie,
  );

  assertSuccess(verified);

  const verifiedEmail = verified.payload.data.verifyEmail;

  assert.ok(verifiedEmail.id);
  assert.equal(verifiedEmail.email, email);
  assert.equal(verifiedEmail.status, "VERIFIED");
  assert.ok(verifiedEmail.verifiedAt);
  assert.equal(verifiedEmail.expiresAt, null);

  const databaseState = await database.query(
    `
      SELECT
        (SELECT COUNT(*) FROM "user_emails" WHERE email = $1)::int AS verified_count,
        (SELECT COUNT(*) FROM "unverified_emails" WHERE email = $1)::int AS pending_count
    `,
    [email],
  );

  assert.equal(databaseState.rows[0].verified_count, 1);
  assert.equal(databaseState.rows[0].pending_count, 0);

  const duplicate = await graphql(
    `
      mutation AddEmail($email: String!) {
        addEmail(email: $email) {
          id
        }
      }
    `,
    { email },
    cookie,
  );

  assertError(duplicate, "EMAIL_ALREADY_VERIFIED");

  const expiredEmail = `email-expired-${randomUUID()}@example.com`;
  testEmails.push(expiredEmail);

  const expiredAdd = await graphql(
    `
      mutation AddEmail($email: String!) {
        addEmail(email: $email) {
          id
          verificationCode
        }
      }
    `,
    { email: expiredEmail },
    cookie,
  );

  assertSuccess(expiredAdd);

  const expiredCode = expiredAdd.payload.data.addEmail.verificationCode;

  await database.query(
    `
      UPDATE "unverified_emails"
      SET "expiresAt" = NOW() - INTERVAL '1 minute'
      WHERE email = $1
    `,
    [expiredEmail],
  );

  const expiredVerification = await graphql(
    `
      mutation VerifyEmail($email: String!, $code: String!) {
        verifyEmail(email: $email, code: $code) {
          id
        }
      }
    `,
    { email: expiredEmail, code: expiredCode },
    cookie,
  );

  assertError(expiredVerification, "VERIFICATION_CODE_EXPIRED");

  const expiredRecord = await database.query(
    'SELECT id FROM "unverified_emails" WHERE email = $1',
    [expiredEmail],
  );

  assert.equal(expiredRecord.rowCount, 0);
});

test("authenticated users can delete their verified and pending email addresses", async (t) => {
  assert.ok(username, "PRODUCT_TEST_USERNAME is required.");
  assert.ok(password, "PRODUCT_TEST_PASSWORD is required.");
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required.");

  const database = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await database.connect();

  const testEmails = [];
  const testUserIds = [];
  let cookie;

  t.after(async () => {
    try {
      if (testEmails.length) {
        await database.query(
          'DELETE FROM "unverified_emails" WHERE email = ANY($1::varchar[])',
          [testEmails],
        );

        await database.query(
          'DELETE FROM "user_emails" WHERE email = ANY($1::varchar[])',
          [testEmails],
        );
      }

      if (testUserIds.length) {
        await database.query('DELETE FROM "users" WHERE id = ANY($1::text[])', [
          testUserIds,
        ]);
      }

      if (cookie) {
        const logout = await graphql(
          `
            mutation Logout {
              logout
            }
          `,
          {},
          cookie,
        );

        assertSuccess(logout);
      }
    } finally {
      await database.end();
    }
  });

  const anonymousDelete = await graphql(
    `
      mutation DeleteAccountEmail($id: ID!) {
        deleteAccountEmail(id: $id)
      }
    `,
    { id: randomUUID() },
  );

  assertError(anonymousDelete, "UNAUTHENTICATED");

  const login = await graphql(
    `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          id
          username
        }
      }
    `,
    { input: { username, password } },
  );

  assertSuccess(login);
  cookie = getSessionCookie(login.response);

  const userId = login.payload.data.login.id;
  const verifiedId = randomUUID();
  const pendingId = randomUUID();
  const foreignId = randomUUID();
  const foreignUserId = randomUUID();

  const verifiedEmail = `email-delete-verified-${randomUUID()}@example.com`;
  const pendingEmail = `email-delete-pending-${randomUUID()}@example.com`;
  const foreignEmail = `email-delete-foreign-${randomUUID()}@example.com`;

  testEmails.push(verifiedEmail, pendingEmail, foreignEmail);
  testUserIds.push(foreignUserId);

  await database.query(
    `
      INSERT INTO "users" (
        "id",
        "username",
        "passwordHash",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, NOW(), NOW())
    `,
    [
      foreignUserId,
      `email-delete-${randomUUID()}`,
      "unused-integration-test-hash",
    ],
  );

  await database.query(
    `
      INSERT INTO "user_emails" ("id", "email", "userId")
      VALUES ($1, $2, $3), ($4, $5, $6)
    `,
    [verifiedId, verifiedEmail, userId, foreignId, foreignEmail, foreignUserId],
  );

  await database.query(
    `
      INSERT INTO "unverified_emails" (
        "id",
        "email",
        "verificationCodeHash",
        "expiresAt",
        "userId"
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      pendingId,
      pendingEmail,
      "unused-integration-test-hash",
      new Date(Date.now() + 15 * 60 * 1000),
      userId,
    ],
  );

  const foreignDelete = await graphql(
    `
      mutation DeleteAccountEmail($id: ID!) {
        deleteAccountEmail(id: $id)
      }
    `,
    { id: foreignId },
    cookie,
  );

  assertError(foreignDelete, "EMAIL_NOT_FOUND");

  const foreignRecord = await database.query(
    'SELECT id FROM "user_emails" WHERE id = $1',
    [foreignId],
  );

  assert.equal(foreignRecord.rowCount, 1);

  for (const id of [verifiedId, pendingId]) {
    const deleted = await graphql(
      `
        mutation DeleteAccountEmail($id: ID!) {
          deleteAccountEmail(id: $id)
        }
      `,
      { id },
      cookie,
    );

    assertSuccess(deleted);
    assert.equal(deleted.payload.data.deleteAccountEmail, true);
  }

  const remainingRecords = await database.query(
    `
      SELECT
        (SELECT COUNT(*) FROM "user_emails" WHERE id = $1)::int AS verified_count,
        (SELECT COUNT(*) FROM "unverified_emails" WHERE id = $2)::int AS pending_count
    `,
    [verifiedId, pendingId],
  );

  assert.equal(remainingRecords.rows[0].verified_count, 0);
  assert.equal(remainingRecords.rows[0].pending_count, 0);

  const deleteAgain = await graphql(
    `
      mutation DeleteAccountEmail($id: ID!) {
        deleteAccountEmail(id: $id)
      }
    `,
    { id: verifiedId },
    cookie,
  );

  assertError(deleteAgain, "EMAIL_NOT_FOUND");
});
