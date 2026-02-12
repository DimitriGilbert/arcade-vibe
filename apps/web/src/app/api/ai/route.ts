import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  wrapLanguageModel,
} from "ai";
import { type NextRequest, NextResponse } from "next/server";
import {
  withRateLimit,
  rateLimits,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

export const maxDuration = 30;

async function handlePost(req: NextRequest): Promise<NextResponse> {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const model = wrapLanguageModel({
    model: google("gemini-2.5-flash"),
    middleware: devToolsMiddleware(),
  });
  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  // Convert the stream to a Response and wrap it with NextResponse
  const streamResponse = result.toUIMessageStreamResponse();
  return new NextResponse(streamResponse.body, {
    status: streamResponse.status,
    headers: streamResponse.headers,
  });
}

export const POST = withRateLimit(rateLimits.default, handlePost);
