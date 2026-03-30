import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contactName,
      tier,
      replyTone,
      lastReceivedMessage,
      recentInteractions,
    } = body;

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const tierLabels: Record<string, string> = {
      A: "Inner Circle",
      B: "In the Mix",
      C: "Check-ins",
    };

    const userPrompt = `Contact: ${contactName}
Tier: ${tier} (${tierLabels[tier] || tier})
Reply tone: ${replyTone || "casual and natural"}
Their last message: "${lastReceivedMessage}"
Recent conversation:
${(recentInteractions || []).map((i: string, idx: number) => `${idx + 1}. ${i}`).join("\n")}

Write one reply to send back.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system:
        "You are writing a reply on behalf of the user. Match the tone settings exactly. Sound completely human — not like AI. One reply only. No options, no explanation, no preamble. Just the reply text.",
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const reply = textBlock ? textBlock.text : "Could not generate reply.";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Draft reply error:", error);
    const message = error instanceof Error ? error.message : "Failed to draft reply";
    return NextResponse.json({ reply: message }, { status: 500 });
  }
}
