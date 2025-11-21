import prisma from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { scriptId, rewritten } = await req.json();

    const updated = await prisma.script.update({
      where: { id: scriptId },
      data: { rewritten_text: rewritten },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    return NextResponse.json({ success: false });
  }
}
