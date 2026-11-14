import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";

const endpoint = process.env.GRAPHQL_URL ?? "http://localhost:3000/api/graphql";

const username = process.env.PRODUCT_TEST_USERNAME;
const password = process.env.PRODUCT_TEST_PASSWORD;
const secondaryPassword = process.env.PRODUCT_TEST_SECONDARY_PASSWORD;

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
    value.startsWith(`${SESSION_COOKIE_NAME}=`),
  );

  assert.ok(cookie, "Session cookie was not returned.");
  assert.match(cookie, /HttpOnly/i);

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
    {
      input: {
        username,
        password,
      },
    },
  );

  assertSuccess(result);

  return {
    user: result.payload.data.login,
    cookie: getSessionCookie(result.response),
  };
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

async function updateArticleStatus(id, status, cookie) {
  const result = await graphql(
    `
      mutation UpdateKnowledgeBaseArticle(
        $id: ID!
        $input: UpdateKnowledgeBaseArticleInput!
      ) {
        updateKnowledgeBaseArticle(id: $id, input: $input) {
          id
          status
        }
      }
    `,
    { id, input: { status } },
    cookie,
  );

  assertSuccess(result);
  return result.payload.data.updateKnowledgeBaseArticle;
}

test("unauthenticated users cannot access Knowledge Base articles", async () => {
  const list = await graphql(`
    query KnowledgeBaseArticles {
      knowledgeBaseArticles {
        totalCount
      }
    }
  `);

  assertError(list, "UNAUTHENTICATED");

  const article = await graphql(
    `
      query KnowledgeBaseArticle($id: ID!) {
        knowledgeBaseArticle(id: $id) {
          id
        }
      }
    `,
    { id: "unauthorized-article-id" },
  );

  assertError(article, "UNAUTHENTICATED");

  const create = await graphql(
    `
      mutation CreateKnowledgeBaseArticle(
        $input: CreateKnowledgeBaseArticleInput!
      ) {
        createKnowledgeBaseArticle(input: $input) {
          id
        }
      }
    `,
    {
      input: {
        scope: "generic",
        categoryTag: "troubleshooting",
        title: "Unauthorized Article",
        context: "Unauthorized context.",
      },
    },
  );

  assertError(create, "UNAUTHENTICATED");

  const update = await graphql(
    `
      mutation UpdateKnowledgeBaseArticle(
        $id: ID!
        $input: UpdateKnowledgeBaseArticleInput!
      ) {
        updateKnowledgeBaseArticle(id: $id, input: $input) {
          id
        }
      }
    `,
    {
      id: "unauthorized-article-id",
      input: {
        title: "Unauthorized Update",
      },
    },
  );

  assertError(update, "UNAUTHENTICATED");

  const deleteArticle = await graphql(
    `
      mutation DeleteKnowledgeBaseArticle($id: ID!) {
        deleteKnowledgeBaseArticle(id: $id)
      }
    `,
    {
      id: "unauthorized-article-id",
    },
  );

  assertError(deleteArticle, "UNAUTHENTICATED");
});

test("authenticated users can manage private Knowledge Base articles", async (t) => {
  assert.ok(username, "PRODUCT_TEST_USERNAME is required.");
  assert.ok(password, "PRODUCT_TEST_PASSWORD is required.");
  assert.ok(secondaryPassword, "PRODUCT_TEST_SECONDARY_PASSWORD is required.");

  let ownerCookie;
  let otherCookie;

  const trackedArticles = [];

  t.after(async () => {
    try {
      for (const article of trackedArticles) {
        if (!article.active) {
          continue;
        }

        await updateArticleStatus(article.id, "published", article.cookie);
        await updateArticleStatus(article.id, "archived", article.cookie);

        const cleanup = await graphql(
          `
            mutation DeleteKnowledgeBaseArticle($id: ID!) {
              deleteKnowledgeBaseArticle(id: $id)
            }
          `,
          { id: article.id },
          article.cookie,
        );

        assertSuccess(cleanup);
      }
    } finally {
      for (const cookie of [otherCookie, ownerCookie]) {
        if (cookie) {
          await logout(cookie);
        }
      }
    }
  });

  const ownerSession = await login(username, password);
  ownerCookie = ownerSession.cookie;

  const secondaryUsername = `knowledge-base-test-${createHash("sha256")
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

  const otherSession = await login(secondaryUsername, secondaryPassword);
  otherCookie = otherSession.cookie;

  assert.notEqual(ownerSession.user.id, otherSession.user.id);

  async function createArticle(input, cookie) {
    const result = await graphql(
      `
        mutation CreateKnowledgeBaseArticle(
          $input: CreateKnowledgeBaseArticleInput!
        ) {
          createKnowledgeBaseArticle(input: $input) {
            id
            scope
            categoryTag
            status
            title
            context
            createdAt
            updatedAt
          }
        }
      `,
      { input },
      cookie,
    );

    assertSuccess(result);

    const article = result.payload.data.createKnowledgeBaseArticle;

    assert.ok(article.id);

    trackedArticles.push({
      id: article.id,
      cookie,
      active: true,
    });

    return article;
  }

  async function getArticle(id, cookie) {
    return graphql(
      `
        query KnowledgeBaseArticle($id: ID!) {
          knowledgeBaseArticle(id: $id) {
            id
            scope
            categoryTag
            status
            title
            context
            createdAt
            updatedAt
          }
        }
      `,
      { id },
      cookie,
    );
  }

  const searchToken = randomUUID();

  const ownerInputs = [
    {
      scope: "generic",
      categoryTag: "troubleshooting",
      title: `Knowledge Base ${searchToken} Alpha`,
      context: "Troubleshooting article context.",
    },
    {
      scope: "specific",
      categoryTag: "installation_setup",
      status: "published",
      title: `Knowledge Base ${searchToken} Beta`,
      context: "Installation article context.",
    },
    {
      scope: "generic",
      categoryTag: "others",
      title: `Knowledge Base ${searchToken} Gamma`,
      context: "General article context.",
    },
  ];

  const ownerArticles = [];

  for (const input of ownerInputs) {
    ownerArticles.push(await createArticle(input, ownerCookie));
  }

  const createdArticle = ownerArticles[0];

  assert.equal(createdArticle.scope, "generic");
  assert.equal(createdArticle.categoryTag, "troubleshooting");
  assert.equal(createdArticle.status, "draft");
  assert.equal(ownerArticles[1].status, "published");
  assert.equal(ownerArticles[2].status, "draft");
  assert.equal(createdArticle.title, ownerInputs[0].title);
  assert.equal(createdArticle.context, ownerInputs[0].context);
  assert.ok(createdArticle.createdAt);
  assert.ok(createdArticle.updatedAt);

  const fetchedArticle = await getArticle(createdArticle.id, ownerCookie);

  assertSuccess(fetchedArticle);

  assert.deepEqual(fetchedArticle.payload.data.knowledgeBaseArticle, {
    id: createdArticle.id,
    scope: createdArticle.scope,
    categoryTag: createdArticle.categoryTag,
    status: createdArticle.status,
    title: createdArticle.title,
    context: createdArticle.context,
    createdAt: createdArticle.createdAt,
    updatedAt: createdArticle.updatedAt,
  });

  const emptyUpdate = await graphql(
    `
      mutation UpdateKnowledgeBaseArticle(
        $id: ID!
        $input: UpdateKnowledgeBaseArticleInput!
      ) {
        updateKnowledgeBaseArticle(id: $id, input: $input) {
          id
        }
      }
    `,
    {
      id: createdArticle.id,
      input: {},
    },
    ownerCookie,
  );

  assertError(emptyUpdate, "INVALID_INPUT");

  const invalidCreate = await graphql(
    `
      mutation CreateKnowledgeBaseArticle(
        $input: CreateKnowledgeBaseArticleInput!
      ) {
        createKnowledgeBaseArticle(input: $input) {
          id
        }
      }
    `,
    {
      input: {
        scope: "generic",
        categoryTag: "troubleshooting",
        title: "   ",
        context: "Valid context.",
      },
    },
    ownerCookie,
  );

  assertError(invalidCreate, "INVALID_INPUT");

  const invalidUpdate = await graphql(
    `
      mutation UpdateKnowledgeBaseArticle(
        $id: ID!
        $input: UpdateKnowledgeBaseArticleInput!
      ) {
        updateKnowledgeBaseArticle(id: $id, input: $input) {
          id
        }
      }
    `,
    {
      id: createdArticle.id,
      input: {
        title: "   ",
      },
    },
    ownerCookie,
  );

  assertError(invalidUpdate, "INVALID_INPUT");

  const updatedTitle = `Knowledge Base ${searchToken} Alpha Updated`;

  const updated = await graphql(
    `
      mutation UpdateKnowledgeBaseArticle(
        $id: ID!
        $input: UpdateKnowledgeBaseArticleInput!
      ) {
        updateKnowledgeBaseArticle(id: $id, input: $input) {
          id
          scope
          categoryTag
          status
          title
          context
          updatedAt
        }
      }
    `,
    {
      id: createdArticle.id,
      input: {
        scope: "specific",
        categoryTag: "installation_setup",
        status: "published",
        title: updatedTitle,
        context: "Updated article context.",
      },
    },
    ownerCookie,
  );

  assertSuccess(updated);

  const updatedArticle = updated.payload.data.updateKnowledgeBaseArticle;

  assert.equal(updatedArticle.id, createdArticle.id);
  assert.equal(updatedArticle.scope, "specific");
  assert.equal(updatedArticle.categoryTag, "installation_setup");
  assert.equal(updatedArticle.status, "published");
  assert.equal(updatedArticle.title, updatedTitle);
  assert.equal(updatedArticle.context, "Updated article context.");
  assert.ok(updatedArticle.updatedAt);

  const listQuery = `
    query KnowledgeBaseArticles(
      $page: Int!
      $limit: Int!
      $search: String
      $scope: ArticleScope
      $categoryTag: ArticleCategoryTag
      $status: ProductStatus
    ) {
      knowledgeBaseArticles(
        page: $page
        limit: $limit
        search: $search
        scope: $scope
        categoryTag: $categoryTag
        status: $status
      ) {
        items {
          id
          scope
          categoryTag
          status
          title
        }
        totalCount
        totalPages
        currentPage
        hasNextPage
        hasPreviousPage
      }
    }
  `;

  const firstPageResult = await graphql(
    listQuery,
    {
      page: 1,
      limit: 2,
      search: searchToken,
      scope: null,
      categoryTag: null,
    },
    ownerCookie,
  );

  assertSuccess(firstPageResult);

  const firstPage = firstPageResult.payload.data.knowledgeBaseArticles;

  assert.equal(firstPage.items.length, 2);
  assert.equal(firstPage.totalCount, 3);
  assert.equal(firstPage.totalPages, 2);
  assert.equal(firstPage.currentPage, 1);
  assert.equal(firstPage.hasNextPage, true);
  assert.equal(firstPage.hasPreviousPage, false);

  const secondPageResult = await graphql(
    listQuery,
    {
      page: 2,
      limit: 2,
      search: searchToken,
      scope: null,
      categoryTag: null,
    },
    ownerCookie,
  );

  assertSuccess(secondPageResult);

  const secondPage = secondPageResult.payload.data.knowledgeBaseArticles;

  assert.equal(secondPage.items.length, 1);
  assert.equal(secondPage.totalCount, 3);
  assert.equal(secondPage.currentPage, 2);
  assert.equal(secondPage.hasNextPage, false);
  assert.equal(secondPage.hasPreviousPage, true);

  const publishedStatusResult = await graphql(
    listQuery,
    {
      page: 1,
      limit: 15,
      search: searchToken,
      scope: null,
      categoryTag: null,
      status: "published",
    },
    ownerCookie,
  );

  assertSuccess(publishedStatusResult);

  const publishedStatusPage =
    publishedStatusResult.payload.data.knowledgeBaseArticles;

  assert.equal(publishedStatusPage.totalCount, 2);
  assert.ok(
    publishedStatusPage.items.every(
      (article) => article.status === "published",
    ),
  );

  const draftStatusResult = await graphql(
    listQuery,
    {
      page: 1,
      limit: 15,
      search: searchToken,
      scope: null,
      categoryTag: null,
      status: "draft",
    },
    ownerCookie,
  );

  assertSuccess(draftStatusResult);

  const draftStatusPage =
    draftStatusResult.payload.data.knowledgeBaseArticles;

  assert.equal(draftStatusPage.totalCount, 1);
  assert.ok(
    draftStatusPage.items.every((article) => article.status === "draft"),
  );

  const filteredResult = await graphql(
    listQuery,
    {
      page: 1,
      limit: 15,
      search: searchToken,
      scope: "generic",
      categoryTag: "others",
    },
    ownerCookie,
  );

  assertSuccess(filteredResult);

  const filteredArticles = filteredResult.payload.data.knowledgeBaseArticles;

  assert.equal(filteredArticles.totalCount, 1);
  assert.equal(filteredArticles.items.length, 1);
  assert.equal(filteredArticles.items[0].categoryTag, "others");
  assert.equal(filteredArticles.items[0].scope, "generic");
  assert.equal(filteredArticles.items[0].status, "draft");

  const invalidPage = await graphql(
    listQuery,
    {
      page: 0,
      limit: 2,
      search: searchToken,
      scope: null,
      categoryTag: null,
    },
    ownerCookie,
  );

  assertError(invalidPage, "INVALID_INPUT");

  const invalidLimit = await graphql(
    listQuery,
    {
      page: 1,
      limit: 16,
      search: searchToken,
      scope: null,
      categoryTag: null,
    },
    ownerCookie,
  );

  assertError(invalidLimit, "INVALID_INPUT");

  const otherArticle = await createArticle(
    {
      scope: "generic",
      categoryTag: "others",
      title: `Private Article ${randomUUID()}`,
      context: "This article belongs to another user.",
    },
    otherCookie,
  );

  const otherUserRead = await getArticle(createdArticle.id, otherCookie);

  assertError(otherUserRead, "NOT_FOUND");

  const ownerReadOtherArticle = await getArticle(otherArticle.id, ownerCookie);

  assertError(ownerReadOtherArticle, "NOT_FOUND");

  const otherUserList = await graphql(
    listQuery,
    {
      page: 1,
      limit: 15,
      search: searchToken,
      scope: null,
      categoryTag: null,
    },
    otherCookie,
  );

  assertSuccess(otherUserList);
  assert.equal(otherUserList.payload.data.knowledgeBaseArticles.totalCount, 0);

  const ownerListOtherArticle = await graphql(
    listQuery,
    {
      page: 1,
      limit: 15,
      search: otherArticle.title,
      scope: null,
      categoryTag: null,
    },
    ownerCookie,
  );

  assertSuccess(ownerListOtherArticle);
  assert.equal(
    ownerListOtherArticle.payload.data.knowledgeBaseArticles.totalCount,
    0,
  );

  const unauthorizedUpdate = await graphql(
    `
      mutation UpdateKnowledgeBaseArticle(
        $id: ID!
        $input: UpdateKnowledgeBaseArticleInput!
      ) {
        updateKnowledgeBaseArticle(id: $id, input: $input) {
          id
        }
      }
    `,
    {
      id: createdArticle.id,
      input: {
        title: "Unauthorized Update",
      },
    },
    otherCookie,
  );

  assertError(unauthorizedUpdate, "NOT_FOUND");

  const unauthorizedDelete = await graphql(
    `
      mutation DeleteKnowledgeBaseArticle($id: ID!) {
        deleteKnowledgeBaseArticle(id: $id)
      }
    `,
    {
      id: createdArticle.id,
    },
    otherCookie,
  );

  assertError(unauthorizedDelete, "NOT_FOUND");

  const unauthorizedOwnershipAssignment = await graphql(
    `
      mutation {
        createKnowledgeBaseArticle(
          input: {
            scope: generic
            categoryTag: others
            title: "Unauthorized Ownership Assignment"
            context: "Ownership must come from the session."
            userId: "another-user"
          }
        ) {
          id
        }
      }
    `,
    {},
    otherCookie,
  );

  assertError(unauthorizedOwnershipAssignment, "GRAPHQL_VALIDATION_FAILED");

  const ownerAfterAttempts = await getArticle(createdArticle.id, ownerCookie);

  assertSuccess(ownerAfterAttempts);
  assert.equal(
    ownerAfterAttempts.payload.data.knowledgeBaseArticle.title,
    updatedTitle,
  );

  const draftArchiveAttempt = await graphql(
    `
      mutation UpdateKnowledgeBaseArticle(
        $id: ID!
        $input: UpdateKnowledgeBaseArticleInput!
      ) {
        updateKnowledgeBaseArticle(id: $id, input: $input) {
          id
          status
        }
      }
    `,
    {
      id: ownerArticles[2].id,
      input: { status: "archived" },
    },
    ownerCookie,
  );

  assertError(draftArchiveAttempt, "INVALID_STATUS_TRANSITION");

  const draftDeleteAttempt = await graphql(
    `
      mutation DeleteKnowledgeBaseArticle($id: ID!) {
        deleteKnowledgeBaseArticle(id: $id)
      }
    `,
    { id: ownerArticles[2].id },
    ownerCookie,
  );

  assertError(draftDeleteAttempt, "INVALID_STATUS_TRANSITION");

  const publishedArticle = await updateArticleStatus(
    ownerArticles[2].id,
    "published",
    ownerCookie,
  );
  assert.equal(publishedArticle.status, "published");

  const archivedArticle = await updateArticleStatus(
    ownerArticles[2].id,
    "archived",
    ownerCookie,
  );
  assert.equal(archivedArticle.status, "archived");

  const restoredArticle = await updateArticleStatus(
    ownerArticles[2].id,
    "draft",
    ownerCookie,
  );
  assert.equal(restoredArticle.status, "draft");

  const republishedArticle = await updateArticleStatus(
    ownerArticles[2].id,
    "published",
    ownerCookie,
  );
  assert.equal(republishedArticle.status, "published");

  const archivedAgain = await updateArticleStatus(
    ownerArticles[2].id,
    "archived",
    ownerCookie,
  );
  assert.equal(archivedAgain.status, "archived");

  const deleteResult = await graphql(
    `
      mutation DeleteKnowledgeBaseArticle($id: ID!) {
        deleteKnowledgeBaseArticle(id: $id)
      }
    `,
    {
      id: ownerArticles[2].id,
    },
    ownerCookie,
  );

  assertSuccess(deleteResult);
  assert.equal(deleteResult.payload.data.deleteKnowledgeBaseArticle, true);

  const deletedArticle = trackedArticles.find(
    (article) => article.id === ownerArticles[2].id,
  );

  deletedArticle.active = false;

  const readDeletedArticle = await getArticle(ownerArticles[2].id, ownerCookie);

  assertError(readDeletedArticle, "NOT_FOUND");

  const deleteAgain = await graphql(
    `
      mutation DeleteKnowledgeBaseArticle($id: ID!) {
        deleteKnowledgeBaseArticle(id: $id)
      }
    `,
    {
      id: ownerArticles[2].id,
    },
    ownerCookie,
  );

  assertError(deleteAgain, "NOT_FOUND");
});
