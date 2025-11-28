import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { filename, text, userId } = body;

    if (!text || !filename || !userId) {
      return NextResponse.json({ success: false, error: "Missing fields" });
    }

    const newScript = await prisma.script.create({
      data: {
        userId,
        filename,
        raw_text: text,
      },
    });

    return NextResponse.json({
      success: true,
      scriptId: newScript.id,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
