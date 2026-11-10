import { PDFDocument } from 'pdf-lib';

/** Creates a minimal valid PDF with the given number of pages and returns it as a Buffer. */
export async function createPdfBuffer(pageCount = 1): Promise<Buffer> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) {
        doc.addPage();
    }
    return Buffer.from(await doc.save());
}

/** Creates a minimal valid PDF Blob for use in tests. */
export async function createPdfBlob(pageCount = 1): Promise<Blob> {
    return new Blob([await createPdfBuffer(pageCount)], {
        type: 'application/pdf',
    });
}
