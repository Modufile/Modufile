/**
 * PDF Core Worker
 * 
 * Handles heavy MuPDF operations off the main thread:
 * - Page rendering
 * - Redaction
 * - Encryption/Decryption
 * - Repair
 * - Text extraction
 * 
 * Communicates via postMessage with the worker pool.
 */

// Worker context
const ctx = self as unknown as DedicatedWorkerGlobalScope;

// MuPDF module — loaded on first use
let mupdf: any = null;

async function ensureMuPDF() {
    if (mupdf) return mupdf;
    // Import from the public directory (same as main thread loader)
    // @ts-ignore — runtime import from public/, not resolvable by TS
    mupdf = await import(/* webpackIgnore: true */ '/mupdf.js');
    return mupdf;
}

ctx.addEventListener('message', async (e: MessageEvent) => {
    const { type, operationId, payload } = e.data;

    // Preload: just initialize MuPDF without processing a file
    if (type === 'preload') {
        try {
            await ensureMuPDF();
            ctx.postMessage({ type: 'preload-done' });
        } catch (err: any) {
            console.warn('[PdfCoreWorker] Preload failed:', err.message);
        }
        return;
    }

    if (type !== 'exec') return;

    try {
        const result = await handleOperation(operationId, payload);
        ctx.postMessage({ type: 'result', operationId, payload: result });
    } catch (err: any) {
        ctx.postMessage({ type: 'error', operationId, error: err.message || 'Unknown error' });
    }
});

async function handleOperation(operationId: string, payload: any): Promise<any> {
    const mupdf = await ensureMuPDF();

    switch (payload.op) {
        case 'render':
            return renderPage(mupdf, operationId, payload);
        case 'encrypt':
            return encryptPdf(mupdf, operationId, payload);
        case 'decrypt':
            return decryptPdf(mupdf, operationId, payload);
        case 'repair':
            return repairPdf(mupdf, operationId, payload);
        case 'extract-text':
            return extractText(mupdf, operationId, payload);
        default:
            throw new Error(`Unknown operation: ${payload.op}`);
    }
}

function sendProgress(operationId: string, percent: number, stage: string) {
    ctx.postMessage({ type: 'progress', operationId, percent, stage });
}

async function renderPage(mupdf: any, operationId: string, payload: any) {
    sendProgress(operationId, 10, 'loading');

    const doc = mupdf.Document.openDocument(
        new Uint8Array(payload.buffer),
        'application/pdf',
    );

    sendProgress(operationId, 30, 'rendering');

    const page = doc.loadPage(payload.pageIndex);
    const dpi = payload.dpi || 150;
    const scale = dpi / 72;

    const pixmap = page.toPixmap(
        mupdf.Matrix.scale(scale, scale),
        mupdf.ColorSpace.DeviceRGB,
        false, // no alpha
    );

    sendProgress(operationId, 70, 'converting');

    const width = pixmap.getWidth();
    const height = pixmap.getHeight();
    const samples = pixmap.getSamples();

    // Create ImageData → ImageBitmap for zero-copy transfer
    const imageData = new ImageData(
        new Uint8ClampedArray(samples),
        width,
        height,
    );
    const bitmap = await createImageBitmap(imageData);

    // Cleanup WASM memory
    pixmap.destroy();
    page.destroy();
    doc.destroy();

    sendProgress(operationId, 100, 'complete');

    return { bitmap, operationId };
}

async function encryptPdf(mupdf: any, operationId: string, payload: any) {
    sendProgress(operationId, 10, 'loading');

    const doc = mupdf.Document.openDocument(
        new Uint8Array(payload.buffer),
        'application/pdf',
    ).asPDF();

    if (!doc) throw new Error('Not a valid PDF');

    sendProgress(operationId, 50, 'encrypting');

    // Build encryption options string
    const opts = ['garbage=4', 'compress'];
    if (payload.userPassword) opts.push(`user-password=${payload.userPassword}`);
    if (payload.ownerPassword) opts.push(`owner-password=${payload.ownerPassword}`);

    const buffer = doc.saveToBuffer(opts.join(','));
    const result = buffer.asUint8Array().slice(); // Copy before WASM memory is freed

    doc.destroy();
    sendProgress(operationId, 100, 'complete');

    return { buffer: result, operationId };
}

async function decryptPdf(mupdf: any, operationId: string, payload: any) {
    sendProgress(operationId, 10, 'loading');

    const doc = mupdf.Document.openDocument(
        new Uint8Array(payload.buffer),
        'application/pdf',
    );

    sendProgress(operationId, 30, 'authenticating');

    const success = doc.authenticatePassword(payload.password);
    if (!success) throw new Error('Incorrect password');

    sendProgress(operationId, 50, 'decrypting');

    const pdfDoc = doc.asPDF();
    const buffer = pdfDoc.saveToBuffer('garbage=4,compress');
    const result = buffer.asUint8Array().slice();

    pdfDoc.destroy();
    sendProgress(operationId, 100, 'complete');

    return { buffer: result, operationId };
}

async function repairPdf(mupdf: any, operationId: string, payload: any) {
    sendProgress(operationId, 10, 'loading');

    const doc = mupdf.Document.openDocument(
        new Uint8Array(payload.buffer),
        'application/pdf',
    ).asPDF();

    if (!doc) throw new Error('Cannot parse PDF');

    sendProgress(operationId, 50, 'repairing');

    // Save with maximum garbage collection — this rebuilds the xref table
    const buffer = doc.saveToBuffer('garbage=4,compress,clean');
    const result = buffer.asUint8Array().slice();

    doc.destroy();
    sendProgress(operationId, 100, 'complete');

    return { buffer: result, operationId };
}

async function extractText(mupdf: any, operationId: string, payload: any) {
    sendProgress(operationId, 10, 'loading');

    const doc = mupdf.Document.openDocument(
        new Uint8Array(payload.buffer),
        'application/pdf',
    );

    const pageCount = doc.countPages();
    const pages: string[] = [];

    for (let i = 0; i < pageCount; i++) {
        const page = doc.loadPage(i);
        const text = page.toStructuredText('preserve-whitespace').asText();
        pages.push(text);
        page.destroy();

        sendProgress(operationId, 10 + Math.round((i / pageCount) * 80), 'extracting');
    }

    doc.destroy();
    sendProgress(operationId, 100, 'complete');

    return { data: pages.join('\n---\n'), operationId };
}

export { };
