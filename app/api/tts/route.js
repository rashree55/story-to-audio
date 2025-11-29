import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

// ENV
const HF_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = process.env.HF_TTS_MODEL || "coqui/XTTS-v2";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// HuggingFace Router Endpoint (NEW)
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

// --- TTS FUNCTION ---
async function generateXTTS(text, speaker) {
  const payload = {
    inputs: text,
    parameters: {
      speaker: speaker || "default",
    },
  };

  const res = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("XTTS failed: " + errorText);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// --- MAIN API ---
export async function POST(req) {
  try {
    const { scriptId } = await req.json();

    if (!scriptId) {
      return NextResponse.json({
        success: false,
        error: "scriptId missing",
      });
    }

    // Load script from DB
    const script = await prisma.script.findUnique({ where: { id: scriptId } });

    if (!script || !script.dialogue_text) {
      return NextResponse.json({
        success: false,
        error: "Dialogue text missing",
      });
    }

    // Create folder for this script
    const folder = path.join(process.cwd(), "public", "tts", scriptId);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

   
    const lines = script.dialogue_text
      .split("\n")
      .filter((l) => l.trim() !== "");

    let index = 1;
    let generatedFiles = [];

    for (const line of lines) {
      let speaker = "Narrator";
      let text = line;

      if (line.includes(":")) {
        const [c, t] = line.split(":");
        speaker = c.trim();
        text = t.trim();
      }

      const buffer = await generateXTTS(text, speaker);

      const filename = `line-${index}.mp3`;
      const filepath = path.join(folder, filename);

      fs.writeFileSync(filepath, buffer);

      generatedFiles.push(`${BASE_URL}/tts/${scriptId}/${filename}`);
      index++;
    }

    return NextResponse.json({
      success: true,
      message: "XTTS generation complete",
      files: generatedFiles,
    });
  } catch (err) {
    console.error("TTS ERROR:", err);

    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
