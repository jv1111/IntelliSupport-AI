import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_AUTO_REPLIES_PER_LEVEL } from "@/lib/auto-replies/constants";
import {
  createAutoReply,
  deleteAutoReply,
  getAutoReplies,
  moveAutoReply,
  updateAutoReply,
} from "@/server/services/auto-replies";
import {
  getBotSettings,
  updateBotSettings,
} from "@/server/services/bot-settings";
import { autoReplyResolvers } from "@/server/graphql/modules/auto-replies/resolvers";
import { botSettingsResolvers } from "@/server/graphql/modules/bot-settings/resolvers";

const {
  transactionMock,
  productFindFirstMock,
  autoReplyCountMock,
  autoReplyCreateMock,
  autoReplyDeleteMock,
  autoReplyFindFirstMock,
  autoReplyFindManyMock,
  autoReplyUpdateMock,
  botSettingsFindUniqueMock,
  botSettingsUpsertMock,
  transactionFindFirstMock,
  transactionFindManyMock,
  transactionUpdateMock,
  transactionFindUniqueOrThrowMock,
} = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  productFindFirstMock: vi.fn(),
  autoReplyCountMock: vi.fn(),
  autoReplyCreateMock: vi.fn(),
  autoReplyDeleteMock: vi.fn(),
  autoReplyFindFirstMock: vi.fn(),
  autoReplyFindManyMock: vi.fn(),
  autoReplyUpdateMock: vi.fn(),
  botSettingsFindUniqueMock: vi.fn(),
  botSettingsUpsertMock: vi.fn(),
  transactionFindFirstMock: vi.fn(),
  transactionFindManyMock: vi.fn(),
  transactionUpdateMock: vi.fn(),
  transactionFindUniqueOrThrowMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    product: {
      findFirst: productFindFirstMock,
    },
    autoReply: {
      count: autoReplyCountMock,
      create: autoReplyCreateMock,
      delete: autoReplyDeleteMock,
      findFirst: autoReplyFindFirstMock,
      findMany: autoReplyFindManyMock,
      update: autoReplyUpdateMock,
    },
    botSettings: {
      findUnique: botSettingsFindUniqueMock,
      upsert: botSettingsUpsertMock,
    },
  },
}));

const userAId = "user-a-id";
const productAId = "product-a-id";
const productBId = "product-b-id";

const autoReplyA = {
  id: "auto-reply-a-id",
  productId: productAId,
  parentId: null,
  message: "How do I reset the router?",
  answer: "Hold the reset button for 10 seconds.",
  position: 0,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const autoReplyB = {
  ...autoReplyA,
  id: "auto-reply-b-id",
  message: "How do I connect to Wi-Fi?",
  position: 1,
};

const createInput = {
  productId: productAId,
  message: "How do I reset the router?",
  answer: "Hold the reset button for 10 seconds.",
};

const defaultBotSettings = {
  aiEnabled: true,
  autoRepliesEnabled: true,
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

const transactionClient = {
  autoReply: {
    findFirst: transactionFindFirstMock,
    findMany: transactionFindManyMock,
    update: transactionUpdateMock,
    findUniqueOrThrow: transactionFindUniqueOrThrowMock,
  },
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

type MockWithCalls = {
  mock: {
    calls: readonly unknown[];
  };
};

async function expectInvalidInput(
  action: () => Promise<unknown>,
  mocks: readonly MockWithCalls[],
): Promise<void> {
  await expect(action()).rejects.toMatchObject({
    code: "INVALID_INPUT",
  });

  for (const mock of mocks) {
    expect(mock.mock.calls).toHaveLength(0);
  }
}

function mockTransaction() {
  transactionMock.mockImplementation(
    async (
      callback: (transaction: typeof transactionClient) => Promise<unknown>,
    ) => callback(transactionClient),
  );
}

describe("Bot Manager - Auto Reply Read", () => {
  it("retrieves automatic replies belonging to the authenticated user's product", async () => {
    productFindFirstMock.mockResolvedValue({
      id: productAId,
    });

    autoReplyFindManyMock.mockResolvedValue([autoReplyA]);

    const result = await getAutoReplies(userAId, productAId);

    expect(productFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: productAId,
        userId: userAId,
      },
      select: {
        id: true,
      },
    });

    expect(autoReplyFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          product: {
            is: {
              userId: userAId,
            },
          },
          productId: productAId,
        },
      }),
    );

    expect(result).toEqual([autoReplyA]);
  });

  it("retrieves automatic replies across the authenticated user's products", async () => {
    autoReplyFindManyMock.mockResolvedValue([autoReplyA, autoReplyB]);

    const result = await getAutoReplies(userAId);

    expect(productFindFirstMock).not.toHaveBeenCalled();

    expect(autoReplyFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          product: {
            is: {
              userId: userAId,
            },
          },
        },
      }),
    );

    expect(result).toEqual([autoReplyA, autoReplyB]);
  });

  it("retrieves all automatic replies when the product ID is empty", async () => {
    autoReplyFindManyMock.mockResolvedValue([autoReplyA, autoReplyB]);

    const result = await getAutoReplies(userAId, "");

    expect(productFindFirstMock).not.toHaveBeenCalled();

    expect(autoReplyFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          product: {
            is: {
              userId: userAId,
            },
          },
        },
      }),
    );

    expect(result).toEqual([autoReplyA, autoReplyB]);
  });

  it("rejects a product that belongs to another user", async () => {
    productFindFirstMock.mockResolvedValue(null);

    await expect(getAutoReplies(userAId, productBId)).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Product not found.",
    });

    expect(autoReplyFindManyMock).not.toHaveBeenCalled();
  });
});

describe("Bot Manager - Create Auto Reply", () => {
  it("creates an automatic reply for the authenticated user's product", async () => {
    productFindFirstMock.mockResolvedValue({
      id: productAId,
    });

    autoReplyCountMock.mockResolvedValue(0);
    autoReplyFindFirstMock.mockResolvedValue(null);
    autoReplyCreateMock.mockResolvedValue(autoReplyA);

    const result = await createAutoReply(userAId, createInput);

    expect(productFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: productAId,
        userId: userAId,
      },
      select: {
        id: true,
      },
    });

    expect(autoReplyCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          productId: productAId,
          parentId: null,
          message: createInput.message,
          answer: createInput.answer,
          position: 0,
        },
      }),
    );

    expect(result).toEqual(autoReplyA);
  });

  it("accepts a customer message that is not phrased as a question", async () => {
    const message = "I see color red";

    productFindFirstMock.mockResolvedValue({
      id: productAId,
    });

    autoReplyCountMock.mockResolvedValue(0);
    autoReplyFindFirstMock.mockResolvedValue(null);
    autoReplyCreateMock.mockResolvedValue({
      ...autoReplyA,
      message,
    });

    const result = await createAutoReply(userAId, {
      ...createInput,
      message,
    });

    expect(autoReplyCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message,
          answer: createInput.answer,
        }),
      }),
    );

    expect(result.message).toBe(message);
  });

  it("creates a follow-up under an existing automatic reply", async () => {
    productFindFirstMock.mockResolvedValue({
      id: productAId,
    });

    autoReplyFindFirstMock
      .mockResolvedValueOnce({
        id: "parent-reply-id",
      })
      .mockResolvedValueOnce({
        position: 1,
      });

    autoReplyCountMock.mockResolvedValue(2);
    autoReplyCreateMock.mockResolvedValue({
      ...autoReplyA,
      id: "follow-up-id",
      parentId: "parent-reply-id",
      position: 2,
    });

    const result = await createAutoReply(userAId, {
      ...createInput,
      parentId: "parent-reply-id",
    });

    expect(autoReplyFindFirstMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          id: "parent-reply-id",
          productId: productAId,
        },
      }),
    );

    expect(autoReplyCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentId: "parent-reply-id",
          position: 2,
        }),
      }),
    );

    expect(result.position).toBe(2);
  });

  it("rejects an empty product ID", async () => {
    await expectInvalidInput(
      () =>
        createAutoReply(userAId, {
          ...createInput,
          productId: "",
        }),
      [
        productFindFirstMock,
        autoReplyFindFirstMock,
        autoReplyCountMock,
        autoReplyCreateMock,
      ],
    );
  });

  it("rejects an empty message", async () => {
    await expectInvalidInput(
      () =>
        createAutoReply(userAId, {
          ...createInput,
          message: "",
        }),
      [
        productFindFirstMock,
        autoReplyFindFirstMock,
        autoReplyCountMock,
        autoReplyCreateMock,
      ],
    );
  });

  it("rejects an empty answer", async () => {
    await expectInvalidInput(
      () =>
        createAutoReply(userAId, {
          ...createInput,
          answer: "",
        }),
      [
        productFindFirstMock,
        autoReplyFindFirstMock,
        autoReplyCountMock,
        autoReplyCreateMock,
      ],
    );
  });

  it("rejects a product that does not belong to the authenticated user", async () => {
    productFindFirstMock.mockResolvedValue(null);

    await expect(createAutoReply(userAId, createInput)).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Product not found.",
    });

    expect(autoReplyCountMock).not.toHaveBeenCalled();
    expect(autoReplyCreateMock).not.toHaveBeenCalled();
  });

  it("rejects a follow-up with a nonexistent parent", async () => {
    productFindFirstMock.mockResolvedValue({
      id: productAId,
    });

    autoReplyFindFirstMock.mockResolvedValue(null);

    await expect(
      createAutoReply(userAId, {
        ...createInput,
        parentId: "missing-parent-id",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Parent Auto Reply not found.",
    });

    expect(autoReplyCountMock).not.toHaveBeenCalled();
    expect(autoReplyCreateMock).not.toHaveBeenCalled();
  });

  it("rejects creating an automatic reply when the level limit is reached", async () => {
    productFindFirstMock.mockResolvedValue({
      id: productAId,
    });

    autoReplyCountMock.mockResolvedValue(MAX_AUTO_REPLIES_PER_LEVEL);
    autoReplyFindFirstMock.mockResolvedValue(null);

    await expect(createAutoReply(userAId, createInput)).rejects.toMatchObject({
      code: "LIMIT_REACHED",
    });

    expect(autoReplyCreateMock).not.toHaveBeenCalled();
  });
});

describe("Bot Manager - Update Auto Reply", () => {
  it("updates an automatic reply belonging to the authenticated user", async () => {
    const updatedReply = {
      ...autoReplyA,
      message: "Updated message",
      answer: "Updated answer",
    };

    autoReplyFindFirstMock.mockResolvedValue({
      id: autoReplyA.id,
    });

    autoReplyUpdateMock.mockResolvedValue(updatedReply);

    const result = await updateAutoReply(userAId, autoReplyA.id, {
      message: "Updated message",
      answer: "Updated answer",
    });

    expect(autoReplyFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: autoReplyA.id,
          product: {
            is: {
              userId: userAId,
            },
          },
        },
      }),
    );

    expect(autoReplyUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: autoReplyA.id,
        },
        data: {
          message: "Updated message",
          answer: "Updated answer",
        },
      }),
    );

    expect(result).toEqual(updatedReply);
  });

  it("rejects an empty automatic reply ID", async () => {
    await expect(
      updateAutoReply(userAId, "", {
        message: "Updated message",
        answer: "Updated answer",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(autoReplyFindFirstMock).not.toHaveBeenCalled();
    expect(autoReplyUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects an empty updated message", async () => {
    await expect(
      updateAutoReply(userAId, autoReplyA.id, {
        message: "",
        answer: "Updated answer",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(autoReplyFindFirstMock).not.toHaveBeenCalled();
    expect(autoReplyUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects an empty updated answer", async () => {
    await expect(
      updateAutoReply(userAId, autoReplyA.id, {
        message: "Updated message",
        answer: "",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(autoReplyFindFirstMock).not.toHaveBeenCalled();
    expect(autoReplyUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects updating an automatic reply belonging to another user", async () => {
    autoReplyFindFirstMock.mockResolvedValue(null);

    await expect(
      updateAutoReply(userAId, autoReplyB.id, {
        message: "Unauthorized Update",
        answer: "Unauthorized Answer",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Automatic reply not found.",
    });

    expect(autoReplyUpdateMock).not.toHaveBeenCalled();
  });
});

describe("Bot Manager - Delete Auto Reply", () => {
  it("deletes an automatic reply belonging to the authenticated user", async () => {
    autoReplyFindFirstMock.mockResolvedValue({
      id: autoReplyA.id,
    });

    autoReplyDeleteMock.mockResolvedValue(autoReplyA);

    const result = await deleteAutoReply(userAId, autoReplyA.id);

    expect(autoReplyFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: autoReplyA.id,
          product: {
            is: {
              userId: userAId,
            },
          },
        },
      }),
    );

    expect(autoReplyDeleteMock).toHaveBeenCalledWith({
      where: {
        id: autoReplyA.id,
      },
    });

    expect(result).toBe(true);
  });

  it("rejects deleting an automatic reply with an empty ID", async () => {
    await expect(deleteAutoReply(userAId, "")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(autoReplyFindFirstMock).not.toHaveBeenCalled();
    expect(autoReplyDeleteMock).not.toHaveBeenCalled();
  });

  it("rejects deleting an automatic reply belonging to another user", async () => {
    autoReplyFindFirstMock.mockResolvedValue(null);

    await expect(deleteAutoReply(userAId, autoReplyB.id)).rejects.toMatchObject(
      {
        code: "NOT_FOUND",
        message: "Automatic reply not found.",
      },
    );

    expect(autoReplyDeleteMock).not.toHaveBeenCalled();
  });
});

describe("Bot Manager - Move Auto Reply", () => {
  it("moves an automatic reply down and updates sibling positions", async () => {
    mockTransaction();

    transactionFindFirstMock.mockResolvedValue(autoReplyA);

    transactionFindManyMock.mockResolvedValue([
      {
        id: autoReplyA.id,
        position: 0,
      },
      {
        id: autoReplyB.id,
        position: 1,
      },
    ]);

    transactionFindUniqueOrThrowMock.mockResolvedValue({
      ...autoReplyA,
      position: 1,
    });

    const result = await moveAutoReply(userAId, autoReplyA.id, "DOWN");

    expect(transactionMock).toHaveBeenCalledOnce();

    expect(transactionFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: autoReplyA.id,
          product: {
            is: {
              userId: userAId,
            },
          },
        },
      }),
    );

    expect(transactionUpdateMock).toHaveBeenCalledTimes(2);

    expect(transactionFindUniqueOrThrowMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: autoReplyA.id,
        },
      }),
    );

    expect(result.position).toBe(1);
  });

  it("does not change positions when an automatic reply is already at the top", async () => {
    mockTransaction();

    transactionFindFirstMock.mockResolvedValue(autoReplyA);

    transactionFindManyMock.mockResolvedValue([
      {
        id: autoReplyA.id,
        position: 0,
      },
      {
        id: autoReplyB.id,
        position: 1,
      },
    ]);

    const result = await moveAutoReply(userAId, autoReplyA.id, "UP");

    expect(transactionUpdateMock).not.toHaveBeenCalled();
    expect(transactionFindUniqueOrThrowMock).not.toHaveBeenCalled();
    expect(result).toEqual(autoReplyA);
  });

  it("rejects moving an automatic reply with an empty ID", async () => {
    await expect(moveAutoReply(userAId, "", "UP")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid move direction", async () => {
    await expect(
      moveAutoReply(userAId, autoReplyA.id, "LEFT" as "UP"),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects moving an automatic reply belonging to another user", async () => {
    mockTransaction();

    transactionFindFirstMock.mockResolvedValue(null);

    await expect(
      moveAutoReply(userAId, autoReplyB.id, "UP"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Automatic reply not found.",
    });

    expect(transactionFindManyMock).not.toHaveBeenCalled();
    expect(transactionUpdateMock).not.toHaveBeenCalled();
  });
});

describe("Bot Manager - Read Bot Settings", () => {
  it("retrieves bot settings belonging to the authenticated user", async () => {
    botSettingsFindUniqueMock.mockResolvedValue(defaultBotSettings);

    const result = await getBotSettings(userAId);

    expect(botSettingsFindUniqueMock).toHaveBeenCalledWith({
      where: {
        userId: userAId,
      },
      select: {
        aiEnabled: true,
        autoRepliesEnabled: true,
      },
    });

    expect(result).toEqual(defaultBotSettings);
  });

  it("returns default settings when the user has no saved settings", async () => {
    botSettingsFindUniqueMock.mockResolvedValue(null);

    const result = await getBotSettings(userAId);

    expect(result).toEqual({
      aiEnabled: true,
      autoRepliesEnabled: true,
    });

    expect(botSettingsFindUniqueMock).toHaveBeenCalledOnce();
  });
});

describe("Bot Manager - Update Bot Settings", () => {
  it("updates AI settings", async () => {
    const updatedSettings = {
      aiEnabled: false,
      autoRepliesEnabled: true,
    };

    botSettingsUpsertMock.mockResolvedValue(updatedSettings);

    const result = await updateBotSettings(userAId, {
      aiEnabled: false,
    });

    expect(botSettingsUpsertMock).toHaveBeenCalledWith({
      where: {
        userId: userAId,
      },
      update: {
        aiEnabled: false,
      },
      create: {
        user: {
          connect: {
            id: userAId,
          },
        },
        aiEnabled: false,
      },
      select: {
        aiEnabled: true,
        autoRepliesEnabled: true,
      },
    });

    expect(result).toEqual(updatedSettings);
  });

  it("updates automatic reply settings", async () => {
    const updatedSettings = {
      aiEnabled: true,
      autoRepliesEnabled: false,
    };

    botSettingsUpsertMock.mockResolvedValue(updatedSettings);

    const result = await updateBotSettings(userAId, {
      autoRepliesEnabled: false,
    });

    expect(botSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          autoRepliesEnabled: false,
        },
      }),
    );

    expect(result).toEqual(updatedSettings);
  });

  it("updates multiple bot settings", async () => {
    const updatedSettings = {
      aiEnabled: false,
      autoRepliesEnabled: false,
    };

    botSettingsUpsertMock.mockResolvedValue(updatedSettings);

    const result = await updateBotSettings(userAId, {
      aiEnabled: false,
      autoRepliesEnabled: false,
    });

    expect(botSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          aiEnabled: false,
          autoRepliesEnabled: false,
        },
      }),
    );

    expect(result).toEqual(updatedSettings);
  });

  it("rejects an empty settings input", async () => {
    await expect(updateBotSettings(userAId, {})).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(botSettingsUpsertMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid AI setting value", async () => {
    await expect(
      updateBotSettings(userAId, {
        aiEnabled: "enabled",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(botSettingsUpsertMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid automatic reply setting value", async () => {
    await expect(
      updateBotSettings(userAId, {
        autoRepliesEnabled: "enabled",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(botSettingsUpsertMock).not.toHaveBeenCalled();
  });
});

describe("Bot Manager Resolvers - Unauthenticated User", () => {
  it("rejects an unauthenticated request to retrieve automatic replies", async () => {
    await expectUnauthenticated(() =>
      autoReplyResolvers.Query.autoReplies(null, {}, unauthenticatedContext),
    );

    expect(autoReplyFindManyMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to create an automatic reply", async () => {
    await expectUnauthenticated(() =>
      autoReplyResolvers.Mutation.createAutoReply(
        null,
        {
          input: createInput,
        },
        unauthenticatedContext,
      ),
    );

    expect(autoReplyCreateMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to update an automatic reply", async () => {
    await expectUnauthenticated(() =>
      autoReplyResolvers.Mutation.updateAutoReply(
        null,
        {
          id: autoReplyA.id,
          input: {
            message: "Updated message",
            answer: "Updated answer",
          },
        },
        unauthenticatedContext,
      ),
    );

    expect(autoReplyUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to move an automatic reply", async () => {
    await expectUnauthenticated(() =>
      autoReplyResolvers.Mutation.moveAutoReply(
        null,
        {
          id: autoReplyA.id,
          direction: "DOWN",
        },
        unauthenticatedContext,
      ),
    );

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to delete an automatic reply", async () => {
    await expectUnauthenticated(() =>
      autoReplyResolvers.Mutation.deleteAutoReply(
        null,
        {
          id: autoReplyA.id,
        },
        unauthenticatedContext,
      ),
    );

    expect(autoReplyDeleteMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to retrieve bot settings", async () => {
    await expectUnauthenticated(() =>
      botSettingsResolvers.Query.botSettings(null, {}, unauthenticatedContext),
    );

    expect(botSettingsFindUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request to update bot settings", async () => {
    await expectUnauthenticated(() =>
      botSettingsResolvers.Mutation.updateBotSettings(
        null,
        {
          input: {
            aiEnabled: false,
          },
        },
        unauthenticatedContext,
      ),
    );

    expect(botSettingsUpsertMock).not.toHaveBeenCalled();
  });
});

describe("Bot Manager Resolvers - Authenticated User", () => {
  it("allows an authenticated user to retrieve bot settings", async () => {
    botSettingsFindUniqueMock.mockResolvedValue(defaultBotSettings);

    const result = await botSettingsResolvers.Query.botSettings(
      null,
      {},
      authenticatedContext,
    );

    expect(botSettingsFindUniqueMock).toHaveBeenCalledOnce();
    expect(result).toEqual(defaultBotSettings);
  });

  it("allows an authenticated user to update bot settings", async () => {
    const updatedSettings = {
      aiEnabled: false,
      autoRepliesEnabled: true,
    };

    botSettingsUpsertMock.mockResolvedValue(updatedSettings);

    const result = await botSettingsResolvers.Mutation.updateBotSettings(
      null,
      {
        input: {
          aiEnabled: false,
        },
      },
      authenticatedContext,
    );

    expect(botSettingsUpsertMock).toHaveBeenCalledOnce();
    expect(result).toEqual(updatedSettings);
  });

  it("serializes automatic reply dates as ISO strings", () => {
    expect(autoReplyResolvers.AutoReply.createdAt(autoReplyA)).toBe(
      "2026-01-01T00:00:00.000Z",
    );

    expect(autoReplyResolvers.AutoReply.updatedAt(autoReplyA)).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });
});
