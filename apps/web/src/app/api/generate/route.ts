import { auth } from "@arcade-vibe/auth";
import { headers } from "next/headers";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

export const maxDuration = 120;

const InputSchema = z.object({
  promptId: z.string().uuid(),
  modelKey: z.string().min(1),
  themeSystemPrompt: z.string(),
  promptContent: z.string(),
  provider: z.string(),
  apiKeyId: z.string().uuid().optional(),
});

// Simple provider factory for common models
function getModel(provider: string, modelName: string) {
  // Use environment variables for API keys
  switch (provider) {
    case "openai":
      return createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })(modelName);
    case "anthropic":
      return createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })(modelName);
    case "google":
      return createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
      })(modelName);
    case "openrouter":
      return createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      })(modelName);
    default:
      // Default to OpenAI compatible
      return createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })(modelName);
  }
}

export async function POST(req: Request) {
  // Authenticate
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse input
  let input: z.infer<typeof InputSchema>;
  try {
    const body: unknown = await req.json();
    input = InputSchema.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get model
  const model = getModel(input.provider, input.modelKey);

  // Create streaming response using AI SDK v6
  const result = streamText({
    model,
    messages: [
      { role: "system", content: input.themeSystemPrompt },
      { role: "user", content: input.promptContent },
    ],
  });

  // Create SSE stream
  const encoder = new TextEncoder();
  let fullCode = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send start event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "start" })}\n\n`
          )
        );

        // Stream text chunks
        for await (const chunk of result.textStream) {
          fullCode += chunk;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "chunk", code: fullCode })}\n\n`
            )
          );
        }

        // Send completion event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "complete", code: fullCode })}\n\n`
          )
        );

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: message })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
