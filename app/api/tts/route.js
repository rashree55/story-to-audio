import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function POST(req) {
  try {
    const body = await req.json();
    const { scriptId, dialogues } = body;

    if (!scriptId || !dialogues) {
      return NextResponse.json({ success: false, error: "Missing fields" });
    }

    // Load script
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
    });

    if (!script) {
      return NextResponse.json({ success: false, error: "Script not found" });
    }

    // ---- 1. CALL HUGGINGFACE XTTS FOR EACH LINE ----
    const outputs = [];

    for (const line of dialogues) {
      const r = await fetch(
        `https://api-inference.huggingface.co/models/${process.env.HUGGINGFACE_TTS_MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: line,
            options: { use_cache: true },
          }),
        }
      );

      const buffer = Buffer.from(await r.arrayBuffer());
      const filename = `line-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.mp3`;

      const fs = require("fs");
      const filePath = `public/tts/${filename}`;
      fs.writeFileSync(filePath, buffer);

      outputs.push(filePath);
    }

    // ---- 2. MERGE AUDIO CLIPS INTO ONE STORY MP3 ----
    const finalPath = `public/tts/story-${scriptId}.mp3`;

    await new Promise((resolve, reject) => {
      const command = ffmpeg();

      outputs.forEach((p) => command.input(p));

      command
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .mergeToFile(finalPath);
    });

    // ---- 3. SAVE FINAL FILE PATH ----
    await prisma.script.update({
      where: { id: scriptId },
      data: { final_audio: `/tts/story-${scriptId}.mp3` },
    });

    return NextResponse.json({
      success: true,
      url: `/tts/story-${scriptId}.mp3`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
