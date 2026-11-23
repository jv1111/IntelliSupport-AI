import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createKnowledgeBaseArticle,
  deleteKnowledgeBaseArticle,
  getKnowledgeBaseArticle,
  getKnowledgeBaseArticles,
  updateKnowledgeBaseArticle,
} from "@/server/services/knowledge-base";
import { knowledgeBaseResolvers } from "@/server/graphql/modules/knowledge-base/resolvers";

const {
  transactionMock,
  countMock,
  createMock,
  deleteManyMock,
  findFirstMock,
  findManyMock,
  updateManyAndReturnMock,
} = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  countMock: vi.fn(),
  createMock: vi.fn(),
  deleteManyMock: vi.fn(),
  findFirstMock: vi.fn(),
  findManyMock: vi.fn(),
  updateManyAndReturnMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    knowledgeBaseArticle: {
      count: countMock,
      create: createMock,
      deleteMany: deleteManyMock,
      findFirst: findFirstMock,
      findMany: findManyMock,
      updateManyAndReturn: updateManyAndReturnMock,
    },
  },
}));

const userAId = "user-a-id";

const articleA = {
  id: "article-a-id",
  scope: "generic" as const,
  categoryTag: "troubleshooting" as const,
  status: "published" as const,
  title: "Router Setup",
  context: "Instructions for setting up the router.",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const articleB = {
  ...articleA,
  id: "article-b-id",
  title: "Camera Setup",
};

const createInput = {
  scope: "generic" as const,
  categoryTag: "troubleshooting" as const,
  title: "Router Setup",
  context: "Instructions for setting up the router.",
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

describe("Knowledge Base Service - Read Articles", () => {
  it("retrieves only articles belonging to the authenticated user", async () => {
    transactionMock.mockResolvedValue([[articleA], 1]);

    const result = await getKnowledgeBaseArticles(userAId, {
      page: 1,
      limit: 10,
    });

    expect(transactionMock).toHaveBeenCalledOnce();

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: userAId,
        },
        skip: 0,
        take: 10,
      }),
    );

    expect(countMock).toHaveBeenCalledWith({
      where: {
        userId: userAId,
      },
    });

    expect(result.items).toEqual([articleA]);
    expect(result.totalCount).toBe(1);
  });

  it("filters articles by search, scope, category, and status", async () => {
    transactionMock.mockResolvedValue([[articleA], 1]);

    await getKnowledgeBaseArticles(userAId, {
      page: 1,
      limit: 10,
      search: " Router ",
      scope: "generic",
      categoryTag: "troubleshooting",
      status: "published",
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: userAId,
          scope: "generic",
          categoryTag: "troubleshooting",
          status: "published",
          title: {
            contains: "Router",
            mode: "insensitive",
          },
        },
      }),
    );
  });

  it("rejects an invalid page number", async () => {
    await expect(
      getKnowledgeBaseArticles(userAId, {
        page: 0,
        limit: 10,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid page limit", async () => {
    await expect(
      getKnowledgeBaseArticles(userAId, {
        page: 1,
        limit: 0,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retrieves an article belonging to the authenticated user", async () => {
    findFirstMock.mockResolvedValue(articleA);

    const result = await getKnowledgeBaseArticle(userAId, articleA.id);

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: articleA.id,
          userId: userAId,
        },
      }),
    );

    expect(result).toEqual(articleA);
  });

  it("rejects an empty article ID", async () => {
    await expect(getKnowledgeBaseArticle(userAId, "")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only article ID", async () => {
    await expect(getKnowledgeBaseArticle(userAId, "   ")).rejects.toMatchObject(
      {
        code: "INVALID_INPUT",
      },
    );

    expect(findFirstMock).not.toHaveBeenCalled();
  });
});

describe("Knowledge Base Service - Create Article", () => {
  it("creates an article owned by the authenticated user", async () => {
    createMock.mockResolvedValue(articleA);

    const result = await createKnowledgeBaseArticle(userAId, createInput);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          scope: "generic",
          categoryTag: "troubleshooting",
          title: "Router Setup",
          context: "Instructions for setting up the router.",
          status: "draft",
          user: {
            connect: {
              id: userAId,
            },
          },
        },
      }),
    );

    expect(result).toEqual(articleA);
  });

  it("rejects an empty article title", async () => {
    await expect(
      createKnowledgeBaseArticle(userAId, {
        ...createInput,
        title: "",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only article title", async () => {
    await expect(
      createKnowledgeBaseArticle(userAId, {
        ...createInput,
        title: "   ",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects an empty article context", async () => {
    await expect(
      createKnowledgeBaseArticle(userAId, {
        ...createInput,
        context: "",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid article scope", async () => {
    await expect(
      createKnowledgeBaseArticle(userAId, {
        ...createInput,
        scope: "invalid",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid article category", async () => {
    await expect(
      createKnowledgeBaseArticle(userAId, {
        ...createInput,
        categoryTag: "invalid",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid article status", async () => {
    await expect(
      createKnowledgeBaseArticle(userAId, {
        ...createInput,
        status: "invalid",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(createMock).not.toHaveBeenCalled();
  });
});

describe("Knowledge Base Service - Update Article", () => {
  it("updates an article belonging to the authenticated user", async () => {
    const updatedArticle = {
      ...articleA,
      title: "Updated Router Setup",
    };

    updateManyAndReturnMock.mockResolvedValue([updatedArticle]);

    const result = await updateKnowledgeBaseArticle(userAId, articleA.id, {
      title: "Updated Router Setup",
    });

    expect(updateManyAndReturnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: articleA.id,
          userId: userAId,
        },
        data: {
          title: "Updated Router Setup",
        },
      }),
    );

    expect(result).toEqual(updatedArticle);
  });

  it("rejects an update with no article fields", async () => {
    await expect(
      updateKnowledgeBaseArticle(userAId, articleA.id, {}),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(updateManyAndReturnMock).not.toHaveBeenCalled();
  });

  it("rejects an empty updated article title", async () => {
    await expect(
      updateKnowledgeBaseArticle(userAId, articleA.id, {
        title: "",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(updateManyAndReturnMock).not.toHaveBeenCalled();
  });

  it("rejects an empty updated article context", async () => {
    await expect(
      updateKnowledgeBaseArticle(userAId, articleA.id, {
        context: "",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(updateManyAndReturnMock).not.toHaveBeenCalled();
  });

  it("archives a published article", async () => {
    const archivedArticle = {
      ...articleA,
      status: "archived" as const,
    };

    updateManyAndReturnMock.mockResolvedValue([archivedArticle]);

    const result = await updateKnowledgeBaseArticle(userAId, articleA.id, {
      status: "archived",
    });

    expect(updateManyAndReturnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: articleA.id,
          userId: userAId,
          status: "published",
        },
        data: {
          status: "archived",
        },
      }),
    );

    expect(result).toEqual(archivedArticle);
  });

  it("rejects archiving a draft article", async () => {
    updateManyAndReturnMock.mockResolvedValue([]);
    findFirstMock.mockResolvedValue({
      status: "draft",
    });

    await expect(
      updateKnowledgeBaseArticle(userAId, articleA.id, {
        status: "archived",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
      message: "Only published articles can be archived.",
    });

    expect(findFirstMock).toHaveBeenCalledOnce();
  });

  it("rejects updating an article that does not exist", async () => {
    updateManyAndReturnMock.mockResolvedValue([]);
    findFirstMock.mockResolvedValue(null);

    await expect(
      updateKnowledgeBaseArticle(userAId, articleB.id, {
        title: "Unauthorized Update",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Knowledge Base article not found.",
    });

    expect(updateManyAndReturnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: articleB.id,
          userId: userAId,
        },
      }),
    );
  });

  it("prevents one user from updating another user's article", async () => {
    updateManyAndReturnMock.mockResolvedValue([]);
    findFirstMock.mockResolvedValue(null);

    await expect(
      updateKnowledgeBaseArticle(userAId, articleB.id, {
        title: "Unauthorized Update",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(updateManyAndReturnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: articleB.id,
          userId: userAId,
        },
      }),
    );
  });
});

describe("Knowledge Base Service - Delete Article", () => {
  it("deletes an archived article belonging to the authenticated user", async () => {
    deleteManyMock.mockResolvedValue({
      count: 1,
    });

    const result = await deleteKnowledgeBaseArticle(userAId, articleA.id);

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        id: articleA.id,
        userId: userAId,
        status: "archived",
      },
    });

    expect(result).toBe(true);
  });

  it("rejects deleting an article that is not archived", async () => {
    deleteManyMock.mockResolvedValue({
      count: 0,
    });

    findFirstMock.mockResolvedValue({
      id: articleA.id,
    });

    await expect(
      deleteKnowledgeBaseArticle(userAId, articleA.id),
    ).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
      message: "Only archived articles can be deleted.",
    });
  });

  it("rejects deleting an article that does not exist", async () => {
    deleteManyMock.mockResolvedValue({
      count: 0,
    });

    findFirstMock.mockResolvedValue(null);

    await expect(
      deleteKnowledgeBaseArticle(userAId, articleB.id),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Knowledge Base article not found.",
    });

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        id: articleB.id,
        userId: userAId,
        status: "archived",
      },
    });
  });

  it("prevents one user from deleting another user's article", async () => {
    deleteManyMock.mockResolvedValue({
      count: 0,
    });

    findFirstMock.mockResolvedValue(null);

    await expect(
      deleteKnowledgeBaseArticle(userAId, articleB.id),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        id: articleB.id,
        userId: userAId,
        status: "archived",
      },
    });
  });
});

describe("Knowledge Base Resolvers - Unauthenticated User", () => {
  it("rejects an unauthenticated request to retrieve an article", async () => {
    await expectUnauthenticated(() =>
      knowledgeBaseResolvers.Query.knowledgeBaseArticle(
        null,
        { id: articleA.id },
        unauthenticatedContext,
      ),
    );

    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to list articles", async () => {
    await expectUnauthenticated(() =>
      knowledgeBaseResolvers.Query.knowledgeBaseArticles(
        null,
        { page: 1, limit: 10 },
        unauthenticatedContext,
      ),
    );

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to create an article", async () => {
    await expectUnauthenticated(() =>
      knowledgeBaseResolvers.Mutation.createKnowledgeBaseArticle(
        null,
        { input: createInput },
        unauthenticatedContext,
      ),
    );

    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to update an article", async () => {
    await expectUnauthenticated(() =>
      knowledgeBaseResolvers.Mutation.updateKnowledgeBaseArticle(
        null,
        {
          id: articleA.id,
          input: {
            title: "Unauthorized Update",
          },
        },
        unauthenticatedContext,
      ),
    );

    expect(updateManyAndReturnMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to delete an article", async () => {
    await expectUnauthenticated(() =>
      knowledgeBaseResolvers.Mutation.deleteKnowledgeBaseArticle(
        null,
        {
          id: articleA.id,
        },
        unauthenticatedContext,
      ),
    );

    expect(deleteManyMock).not.toHaveBeenCalled();
  });
});

describe("Knowledge Base Resolvers - Authenticated User", () => {
  it("allows an authenticated user to retrieve an article", async () => {
    findFirstMock.mockResolvedValue(articleA);

    const result = await knowledgeBaseResolvers.Query.knowledgeBaseArticle(
      null,
      { id: articleA.id },
      authenticatedContext,
    );

    expect(result).toEqual(articleA);
  });

  it("allows an authenticated user to create an article", async () => {
    createMock.mockResolvedValue(articleA);

    const result =
      await knowledgeBaseResolvers.Mutation.createKnowledgeBaseArticle(
        null,
        { input: createInput },
        authenticatedContext,
      );

    expect(createMock).toHaveBeenCalledOnce();
    expect(result).toEqual(articleA);
  });

  it("serializes article dates as ISO strings", () => {
    expect(
      knowledgeBaseResolvers.KnowledgeBaseArticle.createdAt(articleA),
    ).toBe("2026-01-01T00:00:00.000Z");

    expect(
      knowledgeBaseResolvers.KnowledgeBaseArticle.updatedAt(articleA),
    ).toBe("2026-01-01T00:00:00.000Z");
  });
});
