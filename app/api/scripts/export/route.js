import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";

function splitTextIntoLines(text, maxChars = 90) {
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

    const script = await prisma.script.findUnique({ where: { id: scriptId } });

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

    if (!text) {
      return NextResponse.json(
        { success: false, error: "No text available to export" },
        { status: 400 }
      );
    }

    const filename = script.fileName.toLowerCase();

    // ------------ PDF EXPORT ------------
    if (filename.endsWith(".pdf")) {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const pageWidth = 595;
      const pageHeight = 842;
      const margin = 40;
      const fontSize = 12;

      const paragraphs = text.split(/\n\s*\n/);

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      for (const para of paragraphs) {
        const lines = splitTextIntoLines(para.replace(/\r/g, ""), 100);

        for (const line of lines) {
          if (y - fontSize < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }

          page.drawText(line, {
            x: margin,
            y: y - fontSize,
            size: fontSize,
            font,
          });

          y -= fontSize + 6;
        }

        y -= fontSize;
      }

      const pdfBytes = await pdfDoc.save();

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="dialogues.pdf"`,
        },
      });
    }

    // ------------ DOCX EXPORT ------------
    const doc = new Document({
      sections: [
        {
          children: text
            .split(/\n\s*\n/)
            .map((para) => {
              const lines = para
                .replace(/\r/g, "")
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean);

              return new Paragraph({
                children: lines.map(
                  (line, i) =>
                    new TextRun({ text: line, break: i !== lines.length - 1 })
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
        "Content-Disposition": `attachment; filename="dialogues.docx"`,
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
