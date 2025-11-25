import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { rewrittenStory, characters, scriptId } = await req.json();

    if (!rewrittenStory || !scriptId) {
      return NextResponse.json(
        { success: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    const charList = characters.map(c => c.name).join(", ");

    const prompt = `
Convert this story into screenplay-style dialogues.
ONLY use these characters: ${charList}

Story:
${rewrittenStory}
`;

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 4096
    });

    const dialogueText = completion.choices[0].message.content.trim();

    await prisma.script.update({
      where: { id: scriptId },
      data: { dialogue_text: dialogueText }
    });

    return NextResponse.json({ success: true, dialogueText });

  } catch (err) {
    console.error("DIALOGUE ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Dialogue generation failed" },
      { status: 500 }
    );
  }
}
