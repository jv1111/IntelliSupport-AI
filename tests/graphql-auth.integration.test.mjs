import assert from "node:assert/strict";
import test from "node:test";

const endpoint = process.env.GRAPHQL_URL ?? "http://localhost:3000/api/graphql";

const username = process.env.PRODUCT_TEST_USERNAME;
const password = process.env.PRODUCT_TEST_PASSWORD;

const SESSION_COOKIE_NAME = "intellisupport_session";

const CHANGE_PASSWORD_MUTATION = `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

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
  assert.equal(
    result.response.ok,
    true,
    `HTTP request failed: ${result.response.status}`,
  );

  assert.equal(
    result.payload.errors,
    undefined,
    JSON.stringify(result.payload.errors),
  );
}

function assertGraphQLError(result, code) {
  assert.ok(
    result.payload.errors?.length,
    `Expected GraphQL error ${code}, but no errors were returned.`,
  );

  assert.equal(
    result.payload.errors[0].extensions?.code,
    code,
    JSON.stringify(result.payload.errors),
  );
}

function getSetCookieHeaders(response) {
  const cookies = response.headers.getSetCookie?.();

  if (cookies?.length) {
    return cookies;
  }

  const cookie = response.headers.get("set-cookie");
  return cookie ? [cookie] : [];
}

function getSessionCookie(response) {
  const cookieHeader = getSetCookieHeaders(response).find((cookie) =>
    cookie.startsWith(`${SESSION_COOKIE_NAME}=`),
  );

  assert.ok(cookieHeader, "Session cookie was not returned.");
  assert.match(cookieHeader, /HttpOnly/i);

  return cookieHeader.split(";")[0];
}

test("GraphQL authentication session lifecycle", async (t) => {
  assert.ok(username, "PRODUCT_TEST_USERNAME is required.");
  assert.ok(password, "PRODUCT_TEST_PASSWORD is required.");

  let cookie;
  let secondSessionCookie;
  let changedPasswordSessionCookie;
  let restoredPasswordSessionCookie;
  let activeTestPassword = password;

  t.after(async () => {
    if (activeTestPassword !== password) {
      const recoveryLogin = await graphql(
        `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              id
              username
              createdAt
            }
          }
        `,
        {
          input: {
            username,
            password: activeTestPassword,
          },
        },
      );

      assertSuccess(recoveryLogin);

      const recoveryCookie = getSessionCookie(recoveryLogin.response);
      const restorePassword = await graphql(
        CHANGE_PASSWORD_MUTATION,
        {
          input: {
            currentPassword: activeTestPassword,
            newPassword: password,
            confirmPassword: password,
          },
        },
        recoveryCookie,
      );

      assertSuccess(restorePassword);
      activeTestPassword = password;
    }

    for (const sessionCookie of [
      cookie,
      secondSessionCookie,
      changedPasswordSessionCookie,
      restoredPasswordSessionCookie,
    ]) {
      if (!sessionCookie) {
        continue;
      }

      const cleanup = await graphql(
        `
          mutation Logout {
            logout
          }
        `,
        {},
        sessionCookie,
      );

      assertSuccess(cleanup);
    }
  });

  // An unauthenticated user should have no current session.
  const anonymousMe = await graphql(`
    query Me {
      me {
        id
        username
      }
    }
  `);

  assertSuccess(anonymousMe);
  assert.equal(anonymousMe.payload.data.me, null);

  // Login should create a session and return an HTTP-only cookie.
  const login = await graphql(
    `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          id
          username
          createdAt
        }
      }
    `,
    {
      input: {
        username,
        password,
      },
    },
  );

  assertSuccess(login);

  const user = login.payload.data.login;

  assert.ok(user.id);
  assert.equal(user.username, username);
  assert.ok(user.createdAt);

  cookie = getSessionCookie(login.response);

  // The session cookie should authenticate subsequent requests.
  const authenticatedMe = await graphql(
    `
      query Me {
        me {
          id
          username
        }
      }
    `,
    {},
    cookie,
  );

  assertSuccess(authenticatedMe);

  assert.deepEqual(authenticatedMe.payload.data.me, {
    id: user.id,
    username: user.username,
  });

  // A second login should create another independent active session.
  const secondLogin = await graphql(
    `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          id
          username
          createdAt
        }
      }
    `,
    {
      input: {
        username,
        password,
      },
    },
  );

  assertSuccess(secondLogin);
  secondSessionCookie = getSessionCookie(secondLogin.response);

  // Password changes must reject unauthenticated requests.
  const temporaryPassword = `Temporary-${Date.now()}A1`;

  const anonymousPasswordChange = await graphql(CHANGE_PASSWORD_MUTATION, {
    input: {
      currentPassword: password,
      newPassword: temporaryPassword,
      confirmPassword: temporaryPassword,
    },
  });

  assertGraphQLError(anonymousPasswordChange, "UNAUTHENTICATED");

  // An authenticated user must provide the correct current password.
  const incorrectCurrentPassword = await graphql(
    CHANGE_PASSWORD_MUTATION,
    {
      input: {
        currentPassword: "Incorrect-Current1A",
        newPassword: temporaryPassword,
        confirmPassword: temporaryPassword,
      },
    },
    cookie,
  );

  assertGraphQLError(incorrectCurrentPassword, "INVALID_CURRENT_PASSWORD");

  // A valid password change should update the stored password hash.
  const passwordChange = await graphql(
    CHANGE_PASSWORD_MUTATION,
    {
      input: {
        currentPassword: password,
        newPassword: temporaryPassword,
        confirmPassword: temporaryPassword,
      },
    },
    cookie,
  );

  assertSuccess(passwordChange);
  assert.equal(passwordChange.payload.data.changePassword, true);
  activeTestPassword = temporaryPassword;

  const clearedPasswordChangeCookie = getSetCookieHeaders(
    passwordChange.response,
  ).find((value) => value.startsWith(`${SESSION_COOKIE_NAME}=`));

  assert.ok(
    clearedPasswordChangeCookie,
    "Password change did not return a cleared session cookie.",
  );
  assert.match(clearedPasswordChangeCookie, /Max-Age=0/i);

  // Password changes must revoke the current and other active sessions.
  for (const sessionCookie of [cookie, secondSessionCookie]) {
    const revokedSession = await graphql(
      `
        query Me {
          me {
            id
            username
          }
        }
      `,
      {},
      sessionCookie,
    );

    assertSuccess(revokedSession);
    assert.equal(revokedSession.payload.data.me, null);
  }

  // The previous password should no longer authenticate the account.
  const previousPasswordLogin = await graphql(
    `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          id
          username
          createdAt
        }
      }
    `,
    {
      input: {
        username,
        password,
      },
    },
  );

  assertGraphQLError(previousPasswordLogin, "INVALID_CREDENTIALS");

  // The replacement password should authenticate the account.
  const changedPasswordLogin = await graphql(
    `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          id
          username
          createdAt
        }
      }
    `,
    {
      input: {
        username,
        password: temporaryPassword,
      },
    },
  );

  assertSuccess(changedPasswordLogin);
  changedPasswordSessionCookie = getSessionCookie(
    changedPasswordLogin.response,
  );

  // Restore the original test account password.
  const restorePassword = await graphql(
    CHANGE_PASSWORD_MUTATION,
    {
      input: {
        currentPassword: temporaryPassword,
        newPassword: password,
        confirmPassword: password,
      },
    },
    changedPasswordSessionCookie,
  );

  assertSuccess(restorePassword);
  assert.equal(restorePassword.payload.data.changePassword, true);
  activeTestPassword = password;

  const clearedRestoreCookie = getSetCookieHeaders(
    restorePassword.response,
  ).find((value) => value.startsWith(`${SESSION_COOKIE_NAME}=`));

  assert.ok(
    clearedRestoreCookie,
    "Password restoration did not clear its session cookie.",
  );
  assert.match(clearedRestoreCookie, /Max-Age=0/i);

  // The session used to restore the password must also be revoked.
  const revokedChangedPasswordSession = await graphql(
    `
      query Me {
        me {
          id
          username
        }
      }
    `,
    {},
    changedPasswordSessionCookie,
  );

  assertSuccess(revokedChangedPasswordSession);
  assert.equal(revokedChangedPasswordSession.payload.data.me, null);

  // The original password should work again after restoration.
  const restoredPasswordLogin = await graphql(
    `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          id
          username
          createdAt
        }
      }
    `,
    {
      input: {
        username,
        password,
      },
    },
  );

  assertSuccess(restoredPasswordLogin);
  restoredPasswordSessionCookie = getSessionCookie(
    restoredPasswordLogin.response,
  );

  // Logout should revoke the newly restored session.
  const logout = await graphql(
    `
      mutation Logout {
        logout
      }
    `,
    {},
    restoredPasswordSessionCookie,
  );

  assertSuccess(logout);
  assert.equal(logout.payload.data.logout, true);

  const clearedCookie = getSetCookieHeaders(logout.response).find((value) =>
    value.startsWith(`${SESSION_COOKIE_NAME}=`),
  );

  assert.ok(clearedCookie, "Logout did not return a session cookie.");
  assert.match(clearedCookie, /Max-Age=0/i);

  // The logged-out session must no longer authenticate the user.
  const revokedMe = await graphql(
    `
      query Me {
        me {
          id
          username
        }
      }
    `,
    {},
    restoredPasswordSessionCookie,
  );

  assertSuccess(revokedMe);
  assert.equal(revokedMe.payload.data.me, null);
});
