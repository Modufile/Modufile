import { downloadBlob, downloadMultipleAsZip } from './download';
import { PDFJS_WORKER_SRC } from '../pdfjs-config';

export async function exportPdfAsImages(
    blob: Blob,
    basename: string,
    format: 'jpg' | 'png',
    dpi = 144,
): Promise<void> {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    }

    const buf = await blob.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const scale = dpi / 72;
    const files: { name: string; blob: Blob }[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const quality = format === 'jpg' ? 0.92 : undefined;
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const res = await fetch(dataUrl);
        const imgBlob = await res.blob();
        const cleanName = basename.replace(/\.pdf$/i, '');
        files.push({ name: `${cleanName}_p${i}.${format}`, blob: imgBlob });
    }

    doc.destroy();

    if (files.length === 1) {
        downloadBlob(files[0].blob, files[0].name);
    } else {
        await downloadMultipleAsZip(files, `${basename.replace(/\.pdf$/i, '')}_images`);
    }
}
