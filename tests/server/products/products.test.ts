import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "@/server/services/products";
import { productResolvers } from "@/server/graphql/modules/products/resolvers";

const {
  transactionMock,
  countMock,
  createMock,
  deleteManyMock,
  findFirstMock,
  findManyMock,
  updateManyAndReturnMock,
  verifyProductImageMock,
  createProductImageReadUrlMock,
} = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  countMock: vi.fn(),
  createMock: vi.fn(),
  deleteManyMock: vi.fn(),
  findFirstMock: vi.fn(),
  findManyMock: vi.fn(),
  updateManyAndReturnMock: vi.fn(),
  verifyProductImageMock: vi.fn(),
  createProductImageReadUrlMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    product: {
      count: countMock,
      create: createMock,
      deleteMany: deleteManyMock,
      findFirst: findFirstMock,
      findMany: findManyMock,
      updateManyAndReturn: updateManyAndReturnMock,
    },
  },
}));

vi.mock("@/server/storage/google-cloud-storage", () => ({
  verifyProductImage: verifyProductImageMock,
  createProductImageReadUrl: createProductImageReadUrlMock,
  ProductImageStorageError: class ProductImageStorageError extends Error {},
}));

const userAId = "user-a-id";
const userBId = "user-b-id";

const productA = {
  id: "product-a-id",
  name: "Product A",
  sku: "SKU-A",
  status: "draft" as const,
  imageUrl: null,
  description: "Product A description",
  userId: userAId,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const productB = {
  ...productA,
  id: "product-b-id",
  name: "Product B",
  userId: userBId,
};

const authenticatedContext = {
  sessionUser: {
    id: userAId,
    username: "usera",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  sessionToken: null,
  sessionCookieChange: null,
};

const unauthenticatedContext = {
  sessionUser: null,
  sessionToken: null,
  sessionCookieChange: null,
};

beforeEach(() => {
  vi.resetAllMocks();
});

async function expectUnauthenticated(
  action: () => Promise<unknown>,
): Promise<void> {
  await expect(action()).rejects.toMatchObject({
    extensions: {
      code: "UNAUTHENTICATED",
    },
  });
}

describe("Product Service - Authenticated User", () => {
  it("retrieves only products belonging to the authenticated user", async () => {
    transactionMock.mockResolvedValue([[productA], 1]);

    const result = await getProducts(userAId, {
      page: 1,
      limit: 10,
    });

    expect(transactionMock).toHaveBeenCalledOnce();

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: userAId,
        },
      }),
    );

    expect(countMock).toHaveBeenCalledWith({
      where: {
        userId: userAId,
      },
    });

    expect(result.items).toEqual([productA]);
    expect(result.totalCount).toBe(1);
  });

  it("retrieves a product belonging to the authenticated user", async () => {
    findFirstMock.mockResolvedValue(productA);

    const result = await getProduct(userAId, productA.id);

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: productA.id,
          userId: userAId,
        },
      }),
    );

    expect(result).toEqual(productA);
  });

  it("creates a product owned by the authenticated user", async () => {
    createMock.mockResolvedValue(productA);

    const result = await createProduct(userAId, {
      name: "Product A",
      sku: "SKU-A",
      status: "draft",
      description: "Product A description",
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Product A",
          sku: "SKU-A",
          status: "draft",
          description: "Product A description",
          imageUrl: null,
          user: {
            connect: {
              id: userAId,
            },
          },
        }),
      }),
    );

    expect(result).toEqual(productA);
  });

  it("updates a product belonging to the authenticated user", async () => {
    const updatedProduct = {
      ...productA,
      name: "Updated Product A",
    };

    updateManyAndReturnMock.mockResolvedValue([updatedProduct]);

    const result = await updateProduct(userAId, productA.id, {
      name: "Updated Product A",
    });

    expect(updateManyAndReturnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: productA.id,
          userId: userAId,
        },
        data: expect.objectContaining({
          name: "Updated Product A",
        }),
      }),
    );

    expect(result).toEqual(updatedProduct);
  });

  it("deletes an archived product belonging to the authenticated user", async () => {
    deleteManyMock.mockResolvedValue({
      count: 1,
    });

    const result = await deleteProduct(userAId, productA.id);

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        id: productA.id,
        userId: userAId,
        status: "archived",
      },
    });

    expect(result).toBe(true);
  });
});

describe("Product Service - Cross-User Read Access", () => {
  it("prevents User A from reading User B's product", async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(getProduct(userAId, productB.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Product not found.",
    });

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: productB.id,
          userId: userAId,
        },
      }),
    );
  });
});

describe("Product Service - Cross-User Update Access", () => {
  it("prevents User A from updating User B's product", async () => {
    updateManyAndReturnMock.mockResolvedValue([]);

    await expect(
      updateProduct(userAId, productB.id, {
        name: "Unauthorized Update",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Product not found.",
    });

    expect(updateManyAndReturnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: productB.id,
          userId: userAId,
        },
      }),
    );

    expect(findFirstMock).not.toHaveBeenCalled();
  });
});

describe("Product Service - Cross-User Delete Access", () => {
  it("prevents User A from deleting User B's product", async () => {
    deleteManyMock.mockResolvedValue({
      count: 0,
    });

    findFirstMock.mockResolvedValue(null);

    await expect(deleteProduct(userAId, productB.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Product not found.",
    });

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        id: productB.id,
        userId: userAId,
        status: "archived",
      },
    });

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: productB.id,
          userId: userAId,
        },
      }),
    );
  });
});

describe("Product Resolvers - Unauthenticated User", () => {
  it("rejects an unauthenticated request to read a product", async () => {
    await expectUnauthenticated(() =>
      productResolvers.Query.product(
        null,
        { id: productA.id },
        unauthenticatedContext,
      ),
    );

    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to list products", async () => {
    await expectUnauthenticated(() =>
      productResolvers.Query.products(
        null,
        { page: 1, limit: 10 },
        unauthenticatedContext,
      ),
    );

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to create a product", async () => {
    await expectUnauthenticated(() =>
      productResolvers.Mutation.createProduct(
        null,
        {
          input: {
            name: "Unauthorized Product",
          },
        },
        unauthenticatedContext,
      ),
    );

    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to update a product", async () => {
    await expectUnauthenticated(() =>
      productResolvers.Mutation.updateProduct(
        null,
        {
          id: productA.id,
          input: {
            name: "Unauthorized Update",
          },
        },
        unauthenticatedContext,
      ),
    );

    expect(updateManyAndReturnMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to delete a product", async () => {
    await expectUnauthenticated(() =>
      productResolvers.Mutation.deleteProduct(
        null,
        {
          id: productA.id,
        },
        unauthenticatedContext,
      ),
    );

    expect(deleteManyMock).not.toHaveBeenCalled();
  });
});

describe("Product Resolvers - Authenticated User", () => {
  it("allows an authenticated user to read a product", async () => {
    findFirstMock.mockResolvedValue(productA);

    const result = await productResolvers.Query.product(
      null,
      { id: productA.id },
      authenticatedContext,
    );

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: productA.id,
          userId: userAId,
        },
      }),
    );

    expect(result).toEqual(productA);
  });

  it("allows an authenticated user to list products", async () => {
    const input = {
      page: 1,
      limit: 10,
    };

    transactionMock.mockResolvedValue([[productA], 1]);

    const result = await productResolvers.Query.products(
      null,
      input,
      authenticatedContext,
    );

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: userAId,
        },
      }),
    );

    expect(result.items).toEqual([productA]);
    expect(result.totalCount).toBe(1);
  });

  it("allows an authenticated user to create a product", async () => {
    const input = {
      name: "Product A",
    };

    createMock.mockResolvedValue(productA);

    const result = await productResolvers.Mutation.createProduct(
      null,
      { input },
      authenticatedContext,
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user: {
            connect: {
              id: userAId,
            },
          },
        }),
      }),
    );

    expect(result).toEqual(productA);
  });

  it("allows an authenticated user to update a product", async () => {
    const input = {
      name: "Updated Product A",
    };

    updateManyAndReturnMock.mockResolvedValue([productA]);

    const result = await productResolvers.Mutation.updateProduct(
      null,
      {
        id: productA.id,
        input,
      },
      authenticatedContext,
    );

    expect(updateManyAndReturnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: productA.id,
          userId: userAId,
        },
      }),
    );

    expect(result).toEqual(productA);
  });

  it("allows an authenticated user to delete a product", async () => {
    deleteManyMock.mockResolvedValue({
      count: 1,
    });

    const result = await productResolvers.Mutation.deleteProduct(
      null,
      {
        id: productA.id,
      },
      authenticatedContext,
    );

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        id: productA.id,
        userId: userAId,
        status: "archived",
      },
    });

    expect(result).toBe(true);
  });
});
