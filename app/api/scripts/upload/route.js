import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import pdf from "pdf-parse-fixed";
import mammoth from "mammoth";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) return NextResponse.json({ success: false, error: "No file" });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (file.name.endsWith(".pdf")) {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (file.name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    }

    const saved = await prisma.script.create({
      data: {
        fileName: file.name,
        raw_text: extractedText,
      },
    });

    return NextResponse.json({
      success: true,
      id: saved.id,
      text: extractedText,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" });
  }
}
