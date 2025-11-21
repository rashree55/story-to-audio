import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { text, scriptId } = await req.json();

    if (!text || !scriptId) {
      return NextResponse.json({
        success: false,
        error: "Missing text or scriptId",
      });
    }

    // Call GROK API for rewriting
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-1.1",
        messages: [
          {
            role: "system",
            content: `
You are a professional story rewriting AI.

Rewrite the given story into clean, structured SCENES.
Add DIALOGUES where appropriate.
Do NOT invent new characters.
Do NOT change the meaning.
Improve clarity, immersion, pacing, and flow.

Return ONLY the rewritten story — no explanation.
            `,
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    const data = await response.json();
    const rewritten = data?.choices?.[0]?.message?.content;

    // Save rewritten text into DB
    await prisma.script.update({
      where: { id: scriptId },
      data: { rewritten_text: rewritten },
    });

    return NextResponse.json({
      success: true,
      rewritten,
    });

  } catch (err) {
    console.error("REWRITE ERROR:", err);
    return NextResponse.json({
      success: false,
      error: "Rewrite failed",
    });
  }
}
