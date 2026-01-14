import pdfMake from "pdfmake/build/pdfmake";
import htmlToPdfmake from "html-to-pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts"; // ← critical
import { getPdfImages } from "./registerPdfAssets";

/* Bind Roboto fonts correctly for Vite */
pdfMake.vfs = pdfFonts.vfs;

export async function exportHtmlToPdf(html, filename = "invoice.pdf") {
  const images = await getPdfImages();

  const pdfContent = htmlToPdfmake(html, { images });

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [25, 25, 25, 25],
    content: pdfContent,
    images,
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
    },
  };

  pdfMake.createPdf(docDefinition).download(filename);
}
