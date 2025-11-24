import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { rewrittenStory, characters, scriptId } = await req.json();

    if (!rewrittenStory || !characters || !scriptId) {
      return NextResponse.json({
        success: false,
        error: "Missing rewrittenStory, characters, or scriptId",
      });
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
You are a professional story writer.

TASK:
Convert the rewritten story into a natural, cinematic DIALOGUE VERSION.

------------------------------------------
Rewritten Story:
${rewrittenStory}

------------------------------------------
Characters:
${characters.map((c, i) => `${i + 1}) ${c.name} – ${c.description}`).join("\n")}

------------------------------------------
RULES:
- Use ONLY these characters.
- Assign dialogues naturally.
- Keep emotions rich.
- Keep story flow intact.
- Use this format:

[Aarav]: <dialogue>
[Mira]: <dialogue>
[Lior]: <dialogue>

Leave 2 lines space.

Then at the bottom print:

Characters:
1) Name – description
2) Name – description
`;

    const completion = await client.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 4096
    });

    const dialogueText = completion.choices[0]?.message?.content;

    if (!dialogueText) {
      return NextResponse.json({
        success: false,
        error: "AI returned empty dialogue text",
      });
    }

    // ⭐ Save generated dialogues to DB
    await prisma.script.update({
      where: { id: scriptId },
      data: { dialogue_text: dialogueText }
    });

    return NextResponse.json({
      success: true,
      dialogueText,
    });

  } catch (err) {
    console.error("DIALOGUE GENERATION ERROR:", err);
    return NextResponse.json({
      success: false,
      error: "Server crashed while generating dialogues",
    });
  }
}
