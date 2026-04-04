import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      text = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true); // true flags raw text extraction
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.parseBuffer(buffer);
      });
    } else {
      text = buffer.toString("utf-8");
    }

    // Clean up excessive whitespace
    text = text.replace(/\s+/g, " ").trim();

    return NextResponse.json({ text: text.slice(0, 100000) });
  } catch (err) {
    console.error("/api/extract-text error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
