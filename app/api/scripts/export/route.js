// app/api/scripts/export/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";

function splitTextIntoLines(text, maxChars = 90) {
  // Simple splitter by words to avoid breaking words mid-word.
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
      return NextResponse.json({ success: false, error: "Missing scriptId" }, { status: 400 });
    }

    const script = await prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) {
      return NextResponse.json({ success: false, error: "Script not found" }, { status: 404 });
    }

    if (!script.rewritten_text || script.rewritten_text.trim().length === 0) {
      return NextResponse.json({ success: false, error: "No rewritten text available" }, { status: 400 });
    }

    const text = script.rewritten_text;
    const filename = script.fileName || "rewritten";
    const lower = filename.toLowerCase();

    // If original was a PDF -> return PDF
    if (lower.endsWith(".pdf")) {
      // Create a simple multi-page PDF with Times Roman.
      const pdfDoc = await PDFDocument.create();
      const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontSize = 12;
      const pageWidth = 595; // A4 width approximation
      const pageHeight = 842;
      const margin = 40;
      const maxWidth = pageWidth - margin * 2;

      // Split into paragraphs (double newline indicates paragraph)
      const paragraphs = text.split(/\n\s*\n/);

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      for (const para of paragraphs) {
        const lines = splitTextIntoLines(para.replace(/\r/g, ""), 100); // tuned number
        for (const line of lines) {
          const textWidth = timesFont.widthOfTextAtSize(line, fontSize);
          // If we run out of vertical space, add new page
          if (y - fontSize < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          // draw
          page.drawText(line, { x: margin, y: y - fontSize, size: fontSize, font: timesFont });
          y -= fontSize + 6;
        }
        // paragraph spacing
        y -= fontSize;
        if (y < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
      }

      const pdfBytes = await pdfDoc.save();

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename.replace(/(\.pdf)?$/i, ".pdf")}"`,
        },
      });
    }

    // Otherwise produce DOCX
    // (We will default to DOCX for non-PDF original files)
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: text
            .split(/\n\s*\n/) // paragraphs
            .map((para) => {
              // create a Paragraph where each line is a separate text run
              const lines = para.replace(/\r/g, "").split(/\n/).map((l) => l.trim()).filter(Boolean);
              const runs = [];
              for (let i = 0; i < lines.length; i++) {
                runs.push(new TextRun({ text: lines[i], break: i !== lines.length - 1 ? 1 : 0 }));
              }
              return new Paragraph({ children: runs });
            }),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename.replace(/(\.docx)?$/i, ".docx")}"`,
      },
    });
  } catch (err) {
    console.error("EXPORT ERROR:", err);
    return NextResponse.json({ success: false, error: "Export failed" }, { status: 500 });
  }
}
