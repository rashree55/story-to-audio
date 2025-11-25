import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";   // ✅ FIXED PATH
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { rewrittenStory, characters, scriptId } = await req.json();

    if (!rewrittenStory || !scriptId) {
      return NextResponse.json({
        success: false,
        error: "Missing rewrittenStory or scriptId",
      });
    }

    const prompt = `
Convert the rewritten story into structured cinematic dialogues.

STRICT RULES:
- NO screenplay format (no CUT TO, FADE IN, EXT/INT)
- NO camera directions
- NO scene headings like "INT. HOUSE - NIGHT"
- Format EXACTLY like this:

Scene 1:
[Name]: line
[Name] (emotion): line

Scene 2:
...

Characters:
${characters.map((c, i) => `${i + 1}) ${c.name} – ${c.description}`).join("\n")}

Keep lines short, natural, emotional, and ONLY based on the original story.
Do NOT invent new events.
`;

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 4000,
    });

    let dialogue = completion.choices?.[0]?.message?.content || "";

    // ✅ Clean formatting
    dialogue = dialogue
      .replace(/^###\s*/gm, "")
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // ✅ Save to DB
    await prisma.script.update({
      where: { id: scriptId },
      data: { dialogue_text: dialogue },
    });

    return NextResponse.json({
      success: true,
      dialogueText: dialogue,
    });

  } catch (err) {
    console.error("DIALOGUE ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Server failed generating dialogues" },
      { status: 500 }
    );
  }
}
