// app/api/scripts/export/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";

function splitLines(text, maxChars = 90) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";

  for (const w of words) {
    if ((line + " " + w).trim().length <= maxChars) {
      line = (line + " " + w).trim();
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const scriptId = searchParams.get("scriptId");

    if (!scriptId) {
      return NextResponse.json(
        { success: false, error: "Missing scriptId" },
        { status: 400 }
      );
    }

    const script = await prisma.script.findUnique({
      where: { id: scriptId },
    });

    if (!script) {
      return NextResponse.json(
        { success: false, error: "Script not found" },
        { status: 404 }
      );
    }

    const text =
      script.dialogue_text?.trim()?.length > 0
        ? script.dialogue_text
        : script.rewritten_text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "No text available to export" },
        { status: 400 }
      );
    }

    const filename = script.fileName || "output.txt";
    const lower = filename.toLowerCase();

    // ✅ If original was PDF → export PDF
    if (lower.endsWith(".pdf")) {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontSize = 12;
      const pageWidth = 595;
      const pageHeight = 842;
      const margin = 40;

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      splitLines(text).forEach((line) => {
        if (y < margin + 20) {
          page = pdfDoc.addPage([pageWidth, pageHeight]); // ✅ now works
          y = pageHeight - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= fontSize + 6;
      });

      const bytes = await pdfDoc.save();

      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename.replace(
            /\.pdf$/i,
            "-dialogue.pdf"
          )}"`,
        },
      });
    }

    // ✅ Otherwise → export DOCX
    const paragraphs = text.split(/\n\s*\n/);

    const doc = new Document({
      sections: [
        {
          children: paragraphs.map((para) => {
            const lines = para
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);

            return new Paragraph({
              children: lines.map(
                (l, i) =>
                  new TextRun({
                    text: l,
                    break: i > 0 ? 1 : 0,
                  })
              ),
            });
          }),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename.replace(
          /\.docx$/i,
          "-dialogue.docx"
        )}"`,
      },
    });
  } catch (err) {
    console.error("EXPORT ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Export failed" },
      { status: 500 }
    );
  }
}
