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
Rewrite the following story clearly and coherently.
Then identify all characters and list them like this:

Characters:
1) Name – short description
2) Name – short description
3)...

Do NOT return JSON.
Do NOT wrap inside \`\`\`json or any code block.
Return only clean readable text.

Story to rewrite:
${text}
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("AI RAW:", JSON.stringify(data, null, 2));

    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!raw) {
      return NextResponse.json({
        success: false,
        error: "AI returned empty response",
      });
    }

    // Remove unwanted ```json or ``` wrappers if any
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    // Store rewritten text
    await prisma.script.update({
      where: { id: scriptId },
      data: { rewritten_text: raw },
    });

    return NextResponse.json({
      success: true,
      rewritten: raw,
    });
  } catch (err) {
    console.error("SERVER CRASH:", err);
    return NextResponse.json({ success: false, error: "Server crashed" });
  }
}
