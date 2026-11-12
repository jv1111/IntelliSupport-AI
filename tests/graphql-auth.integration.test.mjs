import assert from "node:assert/strict";
import test from "node:test";

const endpoint = process.env.GRAPHQL_URL ?? "http://localhost:3000/api/graphql";

const username = process.env.PRODUCT_TEST_USERNAME;
const password = process.env.PRODUCT_TEST_PASSWORD;

const SESSION_COOKIE_NAME = "intellisupport_session";

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
  let sessionActive = false;

  t.after(async () => {
    if (!cookie || !sessionActive) {
      return;
    }

    const cleanup = await graphql(
      `
        mutation Logout {
          logout
        }
      `,
      {},
      cookie,
    );

    assertSuccess(cleanup);
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
  sessionActive = true;

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

  // Logout should revoke the server-side session.
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
  assert.equal(logout.payload.data.logout, true);

  const clearedCookie = getSetCookieHeaders(logout.response).find((value) =>
    value.startsWith(`${SESSION_COOKIE_NAME}=`),
  );

  assert.ok(clearedCookie, "Logout did not return a session cookie.");
  assert.match(clearedCookie, /Max-Age=0/i);

  sessionActive = false;

  // The previous cookie must no longer authenticate the user.
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
    cookie,
  );

  assertSuccess(revokedMe);
  assert.equal(revokedMe.payload.data.me, null);
});
