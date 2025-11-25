// app/api/story-dialogue/route.js

import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { rewrittenStory, characters, scriptId } = await req.json();

    if (!rewrittenStory || rewrittenStory.trim().length < 30) {
      return NextResponse.json(
        { success: false, error: "Story too short for dialogues" },
        { status: 400 }
      );
    }

    // ✅ structured + simple dialogue prompt
    const prompt = `
Convert the following story into clean dialogues.

STRICT RULES:
- NO screenplay format (no CUT TO, FADE IN, INT/EXT)
- NO scene directions like camera movements
- NO narration, only dialogues
- Use this structure:

Scene 1:
[Character]: line
[Character] (emotion): line

Scene 2:
...

Characters:
1) name – short description

Story:
${rewrittenStory}

Characters list to reference:
${characters?.map((c) => c.name).join(", ") || "Use names from the story"}
`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 1200,
    });

    const output =
      completion.choices?.[0]?.message?.content?.trim() || "No dialogue generated";

    // ✅ save to DB
    if (scriptId) {
      await prisma.script.update({
        where: { id: scriptId },
        data: { dialogue_text: output },
      });
    }

    return NextResponse.json({ success: true, dialogueText: output });
  } catch (err) {
    console.error("DIALOGUE GENERATION ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Dialogue generation failed" },
      { status: 500 }
    );
  }
}
