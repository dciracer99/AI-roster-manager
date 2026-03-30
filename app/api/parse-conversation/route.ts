import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

// Allow up to 5 minutes for large conversation parsing
export const maxDuration = 300;

interface ParsedMessage {
  direction: "sent" | "received";
  content: string;
}

async function parseChunk(
  client: Anthropic,
  chunk: string,
  userName: string,
  contactName: string
): Promise<ParsedMessage[]> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    system: `You parse text message conversations into structured JSON. The user will paste a raw conversation between two people. Identify who said what.

Rules:
- Output ONLY a JSON array, no other text
- Each element: {"direction": "sent" | "received", "content": "the message text"}
- "sent" = messages from ${userName} (the app user)
- "received" = messages from ${contactName}
- Strip timestamps, dates, read receipts, "Delivered", "Read" markers, and any metadata
- Keep the actual message content exactly as written
- If you can't determine direction of a message, use context clues (reply patterns, who initiated)
- Preserve emoji and slang exactly
- Combine multi-line messages from the same person into one entry if they were clearly one thought
- Skip empty lines and system messages like "You named the conversation" etc.
- Order chronologically (first message first)`,
    messages: [
      {
        role: "user",
        content: `Parse this conversation between ${userName} (me) and ${contactName} (them):\n\n${chunk}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const rawResponse = textBlock?.text || "[]";

  let jsonStr = rawResponse;
  const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  return JSON.parse(jsonStr) as ParsedMessage[];
}

function splitIntoChunks(text: string, maxChars: number): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let current = "";

  for (const line of lines) {
    if (current.length + line.length + 1 > maxChars && current.length > 0) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + "\n" + line : line;
    }
  }
  if (current.trim()) {
    chunks.push(current);
  }
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { rawText, userName, contactName } = body;

    if (!rawText || !userName || !contactName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Split into ~5k char chunks so AI can output all messages within token limits
    const chunks = splitIntoChunks(rawText, 5000);
    const allMessages: ParsedMessage[] = [];

    // Process chunks sequentially to maintain order
    for (const chunk of chunks) {
      const parsed = await parseChunk(client, chunk, userName, contactName);
      allMessages.push(...parsed);
    }

    return NextResponse.json({
      messages: allMessages,
      chunks: chunks.length,
    });
  } catch (error: unknown) {
    console.error("Parse conversation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to parse conversation";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
