import fs from 'fs';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function inspectPdf(pdfPath: string) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;

  console.log(`=== PDF INSPECTION REPORT: ${pdfPath} ===`);
  console.log(`Total Pages: ${pdfDoc.numPages}`);

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const strings = textContent.items.map((item: any) => item.str).filter((s: string) => s.trim().length > 0);
    console.log(`--- Page ${i} (Dimensions: ${viewport.width.toFixed(1)} x ${viewport.height.toFixed(1)} pt) ---`);
    console.log(`Item count: ${textContent.items.length}, First 3 lines:`);
    console.log(strings.slice(0, 3).map((s: string) => `  • "${s}"`).join('\n'));
    console.log(`Last line: "${strings[strings.length - 1]}"`);
    console.log('');
  }
}

inspectPdf('./output_glasshouse.pdf').catch(console.error);
