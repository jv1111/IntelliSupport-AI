export class GraphQLRequestError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "GraphQLRequestError";
  }
}

interface GraphQLErrorResponse {
  message: string;
  extensions?: {
    code?: string;
  };
}

interface GraphQLResponse<TData> {
  data?: TData | null;
  errors?: GraphQLErrorResponse[];
}

export async function graphqlRequest<
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(query: string, variables?: TVariables): Promise<TData> {
  let response: Response;

  try {
    response = await fetch("/api/graphql", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new GraphQLRequestError(
      "Unable to connect to the server. Please try again.",
    );
  }

  let result: GraphQLResponse<TData>;

  try {
    result = (await response.json()) as GraphQLResponse<TData>;
  } catch {
    throw new GraphQLRequestError("The server returned an invalid response.");
  }

  if (!response.ok || result.errors?.length) {
    const error = result.errors?.[0];

    throw new GraphQLRequestError(
      error?.message ?? "The request could not be completed.",
      error?.extensions?.code,
    );
  }

  if (result.data == null) {
    throw new GraphQLRequestError("The server returned no data.");
  }

  return result.data;
}
