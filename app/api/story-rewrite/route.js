import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { text, scriptId } = await req.json();

    if (!text || !scriptId) {
      return NextResponse.json({ success: false, error: "Missing text or scriptId" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
Rewrite the following story clearly.
Do NOT add dialogues.
Do NOT add characters.
Do NOT add scenes.
ONLY rewrite the text:

${text}
                  `
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    console.log("AI RAW:", JSON.stringify(data, null, 2));

    const rewritten = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!rewritten) {
      return NextResponse.json({
        success: false,
        error: "AI returned empty response"
      });
    }

    // ⭐ Save rewritten text in DB
    await prisma.script.update({
      where: { id: scriptId },
      data: { rewritten_text: rewritten }
    });

    return NextResponse.json({
      success: true,
      rewritten
    });

  } catch (err) {
    console.error("SERVER CRASH:", err);
    return NextResponse.json({ success: false, error: "Server crashed" });
  }
}
