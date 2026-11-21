import assert from "node:assert/strict";
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

const botSettingsQuery = `
  query BotSettings {
    botSettings {
      aiEnabled
      autoRepliesEnabled
    }
  }
`;

const updateBotSettingsMutation = `
  mutation UpdateBotSettings($input: UpdateBotSettingsInput!) {
    updateBotSettings(input: $input) {
      aiEnabled
      autoRepliesEnabled
    }
  }
`;

test("unauthenticated users cannot access or update Bot Settings", async () => {
  const query = await graphql(botSettingsQuery);
  assertError(query, "UNAUTHENTICATED");

  const mutation = await graphql(updateBotSettingsMutation, {
    input: { aiEnabled: false },
  });
  assertError(mutation, "UNAUTHENTICATED");
});

test("authenticated users can retrieve and update their Bot Settings", async (t) => {
  assert.ok(username, "PRODUCT_TEST_USERNAME is required.");
  assert.ok(password, "PRODUCT_TEST_PASSWORD is required.");

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

  const cookie = getSessionCookie(login.response);
  let originalSettings = null;

  t.after(async () => {
    try {
      if (originalSettings) {
        const restore = await graphql(
          updateBotSettingsMutation,
          { input: originalSettings },
          cookie,
        );

        assertSuccess(restore);
      }
    } finally {
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
  });

  const initial = await graphql(botSettingsQuery, {}, cookie);
  assertSuccess(initial);

  originalSettings = initial.payload.data.botSettings;

  assert.equal(typeof originalSettings.aiEnabled, "boolean");
  assert.equal(typeof originalSettings.autoRepliesEnabled, "boolean");

  const updatedAiSetting = await graphql(
    updateBotSettingsMutation,
    {
      input: {
        aiEnabled: !originalSettings.aiEnabled,
      },
    },
    cookie,
  );

  assertSuccess(updatedAiSetting);
  assert.equal(
    updatedAiSetting.payload.data.updateBotSettings.aiEnabled,
    !originalSettings.aiEnabled,
  );
  assert.equal(
    updatedAiSetting.payload.data.updateBotSettings.autoRepliesEnabled,
    originalSettings.autoRepliesEnabled,
  );

  const updatedAutoRepliesSetting = await graphql(
    updateBotSettingsMutation,
    {
      input: {
        autoRepliesEnabled: !originalSettings.autoRepliesEnabled,
      },
    },
    cookie,
  );

  assertSuccess(updatedAutoRepliesSetting);
  assert.equal(
    updatedAutoRepliesSetting.payload.data.updateBotSettings.aiEnabled,
    !originalSettings.aiEnabled,
  );
  assert.equal(
    updatedAutoRepliesSetting.payload.data.updateBotSettings.autoRepliesEnabled,
    !originalSettings.autoRepliesEnabled,
  );

  const persisted = await graphql(botSettingsQuery, {}, cookie);
  assertSuccess(persisted);
  assert.deepEqual(persisted.payload.data.botSettings, {
    aiEnabled: !originalSettings.aiEnabled,
    autoRepliesEnabled: !originalSettings.autoRepliesEnabled,
  });

  const emptyUpdate = await graphql(
    updateBotSettingsMutation,
    { input: {} },
    cookie,
  );

  assertError(emptyUpdate, "INVALID_INPUT");
});
