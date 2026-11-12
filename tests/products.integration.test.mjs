import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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

test("unauthenticated users cannot read or mutate products", async () => {
  const products = await graphql(`
    query Products {
      products {
        totalCount
      }
    }
  `);

  assertError(products, "UNAUTHENTICATED");

  const product = await graphql(
    `
      query Product($id: ID!) {
        product(id: $id) {
          id
        }
      }
    `,
    { id: "unauthorized-product-id" },
  );

  assertError(product, "UNAUTHENTICATED");

  const create = await graphql(
    `
      mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
          id
        }
      }
    `,
    {
      input: {
        name: "Unauthorized Integration Test",
      },
    },
  );

  assertError(create, "UNAUTHENTICATED");

  const update = await graphql(
    `
      mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
        updateProduct(id: $id, input: $input) {
          id
        }
      }
    `,
    {
      id: "unauthorized-product-id",
      input: {
        name: "Unauthorized Update",
      },
    },
  );

  assertError(update, "UNAUTHENTICATED");

  const deleteProduct = await graphql(
    `
      mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
      }
    `,
    {
      id: "unauthorized-product-id",
    },
  );

  assertError(deleteProduct, "UNAUTHENTICATED");
});

test("authenticated users can create, update, and delete products", async (t) => {
  assert.ok(username, "PRODUCT_TEST_USERNAME is required.");
  assert.ok(password, "PRODUCT_TEST_PASSWORD is required.");

  let cookie;
  let productId;
  const listingProductIds = [];

  t.after(async () => {
    try {
      for (const listingProductId of listingProductIds) {
        const cleanup = await graphql(
          `
            mutation DeleteProduct($id: ID!) {
              deleteProduct(id: $id)
            }
          `,
          { id: listingProductId },
          cookie,
        );

        assertSuccess(cleanup);
      }

      if (productId && cookie) {
        const cleanup = await graphql(
          `
            mutation DeleteProduct($id: ID!) {
              deleteProduct(id: $id)
            }
          `,
          { id: productId },
          cookie,
        );

        assertSuccess(cleanup);
        productId = null;
      }
    } finally {
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
        assert.equal(logout.payload.data.logout, true);
      }
    }
  });

  const login = await graphql(
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

  assertSuccess(login);

  const cookies = login.response.headers.getSetCookie?.() ?? [
    login.response.headers.get("set-cookie") ?? "",
  ];

  const sessionCookie = cookies.find((value) =>
    value.startsWith("intellisupport_session="),
  );

  assert.ok(sessionCookie, "Session cookie was not returned.");

  cookie = sessionCookie.split(";")[0];

  const productName = `Integration Test ${randomUUID()}`;

  const created = await graphql(
    `
      mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
          id
          name
          sku
          status
          imageUrl
          description
          createdAt
          updatedAt
        }
      }
    `,
    {
      input: {
        name: productName,
      },
    },
    cookie,
  );

  assertSuccess(created);

  const product = created.payload.data.createProduct;

  productId = product.id;

  assert.ok(productId);
  assert.equal(product.name, productName);
  assert.equal(product.sku, "Not specified");
  assert.equal(product.status, "draft");
  assert.equal(product.imageUrl, null);
  assert.equal(product.description, "No description provided.");
  assert.ok(product.createdAt);
  assert.ok(product.updatedAt);

  const draftArchiveAttempt = await graphql(
    `
      mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
        updateProduct(id: $id, input: $input) {
          id
          status
        }
      }
    `,
    {
      id: productId,
      input: { status: "archived" },
    },
    cookie,
  );

  assertError(draftArchiveAttempt, "INVALID_STATUS_TRANSITION");

  const fetchedProduct = await graphql(
    `
      query Product($id: ID!) {
        product(id: $id) {
          id
          name
          sku
          status
          imageUrl
          description
        }
      }
    `,
    { id: productId },
    cookie,
  );

  assertSuccess(fetchedProduct);
  assert.deepEqual(fetchedProduct.payload.data.product, {
    id: product.id,
    name: product.name,
    sku: product.sku,
    status: product.status,
    imageUrl: product.imageUrl,
    description: product.description,
  });

  const emptyUpdate = await graphql(
    `
      mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
        updateProduct(id: $id, input: $input) {
          id
        }
      }
    `,
    {
      id: productId,
      input: {},
    },
    cookie,
  );

  assertError(emptyUpdate, "INVALID_INPUT");

  const updated = await graphql(
    `
      mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
        updateProduct(id: $id, input: $input) {
          id
          name
          sku
          status
          imageUrl
          description
          updatedAt
        }
      }
    `,
    {
      id: productId,
      input: {
        name: "Updated Integration Test Product",
        status: "published",
        description: "Integration test update.",
      },
    },
    cookie,
  );

  assertSuccess(updated);

  const updatedProduct = updated.payload.data.updateProduct;

  assert.equal(updatedProduct.id, productId);
  assert.equal(updatedProduct.name, "Updated Integration Test Product");
  assert.equal(updatedProduct.sku, "Not specified");
  assert.equal(updatedProduct.status, "published");
  assert.equal(updatedProduct.description, "Integration test update.");

  const archived = await graphql(
    `
      mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
        updateProduct(id: $id, input: $input) {
          id
          status
        }
      }
    `,
    {
      id: productId,
      input: { status: "archived" },
    },
    cookie,
  );

  assertSuccess(archived);
  assert.equal(archived.payload.data.updateProduct.status, "archived");

  const deleted = await graphql(
    `
      mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
      }
    `,
    {
      id: productId,
    },
    cookie,
  );

  assertSuccess(deleted);
  assert.equal(deleted.payload.data.deleteProduct, true);

  const fetchedDeletedProduct = await graphql(
    `
      query Product($id: ID!) {
        product(id: $id) {
          id
        }
      }
    `,
    { id: productId },
    cookie,
  );

  assertError(fetchedDeletedProduct, "NOT_FOUND");

  productId = null;

  const deleteAgain = await graphql(
    `
      mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
      }
    `,
    {
      id: created.payload.data.createProduct.id,
    },
    cookie,
  );

  assertError(deleteAgain, "NOT_FOUND");

  const searchToken = randomUUID().slice(0, 8);
  const listingProductNames = [
    `Catalog Search ${searchToken} Alpha`,
    `Catalog Search ${searchToken} Beta`,
    `Catalog Search ${searchToken} Gamma`,
  ];

  for (const name of listingProductNames) {
    const createdListingProduct = await graphql(
      `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            name
          }
        }
      `,
      {
        input: { name },
      },
      cookie,
    );

    assertSuccess(createdListingProduct);

    const listingProduct = createdListingProduct.payload.data.createProduct;

    listingProductIds.push(listingProduct.id);
    assert.equal(listingProduct.name, name);
  }

  const productsQuery = `
    query Products($page: Int!, $limit: Int!, $search: String) {
      products(page: $page, limit: $limit, search: $search) {
        items {
          id
          name
        }
        totalCount
        totalPages
        currentPage
        hasNextPage
        hasPreviousPage
      }
    }
  `;

  const search = `CATALOG SEARCH ${searchToken}`;

  const firstPageResult = await graphql(
    productsQuery,
    {
      page: 1,
      limit: 2,
      search,
    },
    cookie,
  );

  assertSuccess(firstPageResult);

  const firstPage = firstPageResult.payload.data.products;

  assert.equal(firstPage.items.length, 2);
  assert.equal(firstPage.totalCount, 3);
  assert.equal(firstPage.totalPages, 2);
  assert.equal(firstPage.currentPage, 1);
  assert.equal(firstPage.hasNextPage, true);
  assert.equal(firstPage.hasPreviousPage, false);

  const secondPageResult = await graphql(
    productsQuery,
    {
      page: 2,
      limit: 2,
      search,
    },
    cookie,
  );

  assertSuccess(secondPageResult);

  const secondPage = secondPageResult.payload.data.products;

  assert.equal(secondPage.items.length, 1);
  assert.equal(secondPage.totalCount, 3);
  assert.equal(secondPage.totalPages, 2);
  assert.equal(secondPage.currentPage, 2);
  assert.equal(secondPage.hasNextPage, false);
  assert.equal(secondPage.hasPreviousPage, true);

  const returnedNames = [...firstPage.items, ...secondPage.items]
    .map((product) => product.name)
    .sort();

  assert.deepEqual(returnedNames, [...listingProductNames].sort());

  const invalidPage = await graphql(
    productsQuery,
    {
      page: 0,
      limit: 2,
      search,
    },
    cookie,
  );

  assertError(invalidPage, "INVALID_INPUT");

  const invalidLimit = await graphql(
    productsQuery,
    {
      page: 1,
      limit: 11,
      search,
    },
    cookie,
  );

  assertError(invalidLimit, "INVALID_INPUT");
});
