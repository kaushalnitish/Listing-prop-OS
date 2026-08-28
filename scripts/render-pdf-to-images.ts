import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function renderPdfToImages(pdfPath: string, outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;

  console.log(`PDF loaded: ${pdfDoc.numPages} pages found.`);

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // High resolution 2x

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
    };

    await (page.render(renderContext as any) as any).promise;

    const imagePath = path.join(outputDir, `page_${pageNum}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imagePath, buffer);
    console.log(`Rendered Page ${pageNum} -> ${imagePath} (${viewport.width}x${viewport.height})`);
  }

  console.log(`Completed rendering ${pdfDoc.numPages} pages.`);
}

renderPdfToImages('./output_glasshouse.pdf', './rendered_pages').catch(err => {
  console.error('Error rendering PDF:', err);
  process.exit(1);
});
