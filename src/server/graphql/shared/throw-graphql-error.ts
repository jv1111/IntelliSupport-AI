import "server-only";

import { GraphQLError } from "graphql";

type GraphQLDomainError = Error & {
  readonly code: string;
};

type GraphQLDomainErrorConstructor = {
  readonly prototype: GraphQLDomainError;
};

function isGraphQLDomainError(
  error: unknown,
  domainErrors: readonly GraphQLDomainErrorConstructor[],
): error is GraphQLDomainError {
  return (
    error instanceof Error &&
    domainErrors.some(({ prototype }) => prototype.isPrototypeOf(error))
  );
}

export function throwGraphQLError(
  error: unknown,
  fallbackMessage: string,
  domainErrors: readonly GraphQLDomainErrorConstructor[] = [],
): never {
  if (isGraphQLDomainError(error, domainErrors)) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
      },
    });
  }

  throw new GraphQLError(fallbackMessage, {
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
    },
  });
}
