import { graphqlRequest } from "@/lib/graphql/client";

interface SendGeminiMessageInput {
  message: string;
}

export interface GeminiResponse {
  text: string;
  model: string;
}

export async function sendGeminiMessage(
  input: SendGeminiMessageInput,
): Promise<GeminiResponse> {
  const data = await graphqlRequest<
    { sendGeminiMessage: GeminiResponse },
    { input: SendGeminiMessageInput }
  >(
    `
      mutation SendGeminiMessage($input: SendGeminiMessageInput!) {
        sendGeminiMessage(input: $input) {
          text
          model
        }
      }
    `,
    { input },
  );

  return data.sendGeminiMessage;
}
