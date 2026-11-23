import { expect } from "vitest";

interface MockWithCalls {
  mock: {
    calls: readonly unknown[];
  };
}

export function createInvalidInputExpectation(
  action: (input: unknown) => Promise<unknown>,
  mocks: readonly MockWithCalls[],
) {
  return async (input: unknown): Promise<void> => {
    await expect(action(input)).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    for (const mock of mocks) {
      expect(mock.mock.calls).toHaveLength(0);
    }
  };
}
