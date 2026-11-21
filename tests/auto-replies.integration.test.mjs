import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";

const endpoint = process.env.GRAPHQL_URL ?? "http://localhost:3000/api/graphql";

const username = process.env.PRODUCT_TEST_USERNAME;
const password = process.env.PRODUCT_TEST_PASSWORD;
const secondaryPassword = process.env.PRODUCT_TEST_SECONDARY_PASSWORD;

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

async function login(username, password) {
  const result = await graphql(
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

  assertSuccess(result);

  return getSessionCookie(result.response);
}

async function logout(cookie) {
  const result = await graphql(
    `
      mutation Logout {
        logout
      }
    `,
    {},
    cookie,
  );

  assertSuccess(result);
  assert.equal(result.payload.data.logout, true);
}

async function createProduct(name, cookie) {
  const result = await graphql(
    `
      mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
          id
          name
        }
      }
    `,
    { input: { name } },
    cookie,
  );

  assertSuccess(result);
  return result.payload.data.createProduct;
}

async function archiveAndDeleteProduct(productId, cookie) {
  for (const status of ["published", "archived"]) {
    const result = await graphql(
      `
        mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
          updateProduct(id: $id, input: $input) {
            id
            status
          }
        }
      `,
      { id: productId, input: { status } },
      cookie,
    );

    assertSuccess(result);
    assert.equal(result.payload.data.updateProduct.status, status);
  }

  const result = await graphql(
    `
      mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
      }
    `,
    { id: productId },
    cookie,
  );

  assertSuccess(result);
  assert.equal(result.payload.data.deleteProduct, true);
}

const createAutoReplyMutation = `
  mutation CreateAutoReply($input: CreateAutoReplyInput!) {
    createAutoReply(input: $input) {
      id
      productId
      parentId
      question
      answer
      position
      createdAt
      updatedAt
    }
  }
`;

const updateAutoReplyMutation = `
  mutation UpdateAutoReply($id: ID!, $input: UpdateAutoReplyInput!) {
    updateAutoReply(id: $id, input: $input) {
      id
      productId
      parentId
      question
      answer
      position
      createdAt
      updatedAt
    }
  }
`;

const deleteAutoReplyMutation = `
  mutation DeleteAutoReply($id: ID!) {
    deleteAutoReply(id: $id)
  }
`;

const autoRepliesQuery = `
  query AutoReplies($productId: ID) {
    autoReplies(productId: $productId) {
      id
      productId
      parentId
      question
      answer
      position
    }
  }
`;

test("unauthenticated users cannot access or create Auto Replies", async () => {
  const list = await graphql(`
    query AutoReplies {
      autoReplies {
        id
      }
    }
  `);

  assertError(list, "UNAUTHENTICATED");

  const create = await graphql(createAutoReplyMutation, {
    input: {
      productId: "unauthorized-product",
      question: "Unauthorized question",
      answer: "Unauthorized answer",
    },
  });

  assertError(create, "UNAUTHENTICATED");

  const update = await graphql(updateAutoReplyMutation, {
    id: "unauthorized-reply",
    input: {
      question: "Unauthorized question",
      answer: "Unauthorized answer",
    },
  });

  assertError(update, "UNAUTHENTICATED");

  const deleteReply = await graphql(deleteAutoReplyMutation, {
    id: "unauthorized-reply",
  });

  assertError(deleteReply, "UNAUTHENTICATED");
});

test("users can create and retrieve private product Auto Replies", async (t) => {
  assert.ok(username, "PRODUCT_TEST_USERNAME is required.");
  assert.ok(password, "PRODUCT_TEST_PASSWORD is required.");
  assert.ok(secondaryPassword, "PRODUCT_TEST_SECONDARY_PASSWORD is required.");

  let ownerCookie;
  let otherCookie;
  const productIds = [];

  t.after(async () => {
    try {
      for (const productId of productIds) {
        await archiveAndDeleteProduct(productId, ownerCookie);
      }
    } finally {
      for (const cookie of [otherCookie, ownerCookie]) {
        if (cookie) {
          await logout(cookie);
        }
      }
    }
  });

  ownerCookie = await login(username, password);

  const secondaryUsername = `auto-reply-test-${createHash("sha256")
    .update(username)
    .digest("hex")
    .slice(0, 16)}`;

  const registration = await graphql(
    `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          id
          username
        }
      }
    `,
    {
      input: {
        username: secondaryUsername,
        password: secondaryPassword,
      },
    },
  );

  if (registration.payload.errors?.[0]?.extensions?.code !== "USERNAME_TAKEN") {
    assertSuccess(registration);
  }

  otherCookie = await login(secondaryUsername, secondaryPassword);

  const token = randomUUID();
  const firstProduct = await createProduct(
    `Auto Reply Integration ${token} A`,
    ownerCookie,
  );
  const secondProduct = await createProduct(
    `Auto Reply Integration ${token} B`,
    ownerCookie,
  );

  productIds.push(firstProduct.id, secondProduct.id);

  const created = await graphql(
    createAutoReplyMutation,
    {
      input: {
        productId: firstProduct.id,
        question: "  How do I reset the device?  ",
        answer: "  Hold the reset button for ten seconds.  ",
      },
    },
    ownerCookie,
  );

  assertSuccess(created);

  const firstReply = created.payload.data.createAutoReply;

  assert.ok(firstReply.id);
  assert.equal(firstReply.productId, firstProduct.id);
  assert.equal(firstReply.parentId, null);
  assert.equal(firstReply.question, "How do I reset the device?");
  assert.equal(firstReply.answer, "Hold the reset button for ten seconds.");
  assert.equal(firstReply.position, 0);

  const updated = await graphql(
    updateAutoReplyMutation,
    {
      id: firstReply.id,
      input: {
        question: "  Updated reset question?  ",
        answer: "  Press and hold the power button.  ",
      },
    },
    ownerCookie,
  );

  assertSuccess(updated);

  const updatedReply = updated.payload.data.updateAutoReply;

  assert.equal(updatedReply.id, firstReply.id);
  assert.equal(updatedReply.productId, firstProduct.id);
  assert.equal(updatedReply.parentId, null);
  assert.equal(updatedReply.question, "Updated reset question?");
  assert.equal(updatedReply.answer, "Press and hold the power button.");
  assert.equal(updatedReply.position, 0);

  const invalidUpdate = await graphql(
    updateAutoReplyMutation,
    {
      id: firstReply.id,
      input: {
        question: "   ",
        answer: "Updated answer",
      },
    },
    ownerCookie,
  );

  assertError(invalidUpdate, "INVALID_INPUT");

  const emptyQuestion = await graphql(
    createAutoReplyMutation,
    {
      input: {
        productId: firstProduct.id,
        question: "   ",
        answer: "Answer",
      },
    },
    ownerCookie,
  );

  assertError(emptyQuestion, "INVALID_INPUT");

  const secondReply = await graphql(
    createAutoReplyMutation,
    {
      input: {
        productId: firstProduct.id,
        question: "How do I reconnect the device?",
        answer: "Restart the device and reconnect it.",
      },
    },
    ownerCookie,
  );

  assertSuccess(secondReply);
  assert.equal(secondReply.payload.data.createAutoReply.position, 1);

  const thirdReply = await graphql(
    createAutoReplyMutation,
    {
      input: {
        productId: firstProduct.id,
        question: "Where can I get support?",
        answer: "Contact customer support.",
      },
    },
    ownerCookie,
  );

  assertSuccess(thirdReply);
  assert.equal(thirdReply.payload.data.createAutoReply.position, 2);

  const fourthReply = await graphql(
    createAutoReplyMutation,
    {
      input: {
        productId: firstProduct.id,
        question: "Additional question",
        answer: "Additional answer",
      },
    },
    ownerCookie,
  );

  assertError(fourthReply, "LIMIT_REACHED");

  const followUp = await graphql(
    createAutoReplyMutation,
    {
      input: {
        productId: firstProduct.id,
        parentId: firstReply.id,
        question: "What if the reset does not work?",
        answer: "Disconnect the power for thirty seconds.",
      },
    },
    ownerCookie,
  );

  assertSuccess(followUp);
  assert.equal(followUp.payload.data.createAutoReply.parentId, firstReply.id);
  assert.equal(followUp.payload.data.createAutoReply.position, 0);

  const invalidParent = await graphql(
    createAutoReplyMutation,
    {
      input: {
        productId: secondProduct.id,
        parentId: firstReply.id,
        question: "Cross-product follow-up",
        answer: "This should not be saved.",
      },
    },
    ownerCookie,
  );

  assertError(invalidParent, "NOT_FOUND");

  const replies = await graphql(
    autoRepliesQuery,
    { productId: firstProduct.id },
    ownerCookie,
  );

  assertSuccess(replies);

  const savedReplies = replies.payload.data.autoReplies;

  assert.equal(savedReplies.length, 4);

  const rootReplies = savedReplies.filter((reply) => reply.parentId === null);

  assert.equal(rootReplies.length, 3);
  assert.deepEqual(
    rootReplies.map((reply) => reply.position),
    [0, 1, 2],
  );

  const savedFollowUp = savedReplies.find(
    (reply) => reply.parentId === firstReply.id,
  );

  assert.ok(savedFollowUp);
  assert.equal(savedFollowUp.question, "What if the reset does not work?");

  const savedUpdatedReply = savedReplies.find(
    (reply) => reply.id === firstReply.id,
  );

  assert.ok(savedUpdatedReply);
  assert.equal(savedUpdatedReply.question, "Updated reset question?");
  assert.equal(
    savedUpdatedReply.answer,
    "Press and hold the power button.",
  );

  const unauthorizedRead = await graphql(
    autoRepliesQuery,
    { productId: firstProduct.id },
    otherCookie,
  );

  assertError(unauthorizedRead, "NOT_FOUND");

  const unauthorizedCreate = await graphql(
    createAutoReplyMutation,
    {
      input: {
        productId: firstProduct.id,
        question: "Unauthorized question",
        answer: "Unauthorized answer",
      },
    },
    otherCookie,
  );

  assertError(unauthorizedCreate, "NOT_FOUND");

  const unauthorizedUpdate = await graphql(
    updateAutoReplyMutation,
    {
      id: firstReply.id,
      input: {
        question: "Unauthorized update",
        answer: "Unauthorized update",
      },
    },
    otherCookie,
  );

  assertError(unauthorizedUpdate, "NOT_FOUND");

  const unauthorizedDelete = await graphql(
    deleteAutoReplyMutation,
    { id: firstReply.id },
    otherCookie,
  );

  assertError(unauthorizedDelete, "NOT_FOUND");

  const deleted = await graphql(
    deleteAutoReplyMutation,
    { id: firstReply.id },
    ownerCookie,
  );

  assertSuccess(deleted);
  assert.equal(deleted.payload.data.deleteAutoReply, true);

  const repliesAfterDeletion = await graphql(
    autoRepliesQuery,
    { productId: firstProduct.id },
    ownerCookie,
  );

  assertSuccess(repliesAfterDeletion);
  assert.equal(repliesAfterDeletion.payload.data.autoReplies.length, 2);
  assert.equal(
    repliesAfterDeletion.payload.data.autoReplies.some(
      (reply) => reply.id === firstReply.id || reply.parentId === firstReply.id,
    ),
    false,
  );

  const otherUserReplies = await graphql(
    `
      query AutoReplies {
        autoReplies {
          id
        }
      }
    `,
    {},
    otherCookie,
  );

  assertSuccess(otherUserReplies);
  assert.deepEqual(otherUserReplies.payload.data.autoReplies, []);
});
