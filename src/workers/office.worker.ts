/**
 * Office Worker
 * 
 * Handles PDF → Office conversions using MuPDF text extraction
 * combined with docx/xlsx libraries for document generation.
 * 
 * Stub — full implementation pending docx/xlsx/mammoth installation.
 */

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener('message', async (e: MessageEvent) => {
    const { type, operationId, payload } = e.data;
    if (type !== 'exec') return;

    try {
        const result = await handleConversion(operationId, payload);
        ctx.postMessage({ type: 'result', operationId, payload: result });
    } catch (err: any) {
        ctx.postMessage({ type: 'error', operationId, error: err.message || 'Conversion failed' });
    }
});

async function handleConversion(operationId: string, payload: any) {
    ctx.postMessage({ type: 'progress', operationId, percent: 10, stage: 'loading' });

    // TODO: Implement PDF → DOCX using MuPDF extract + docx library
    // TODO: Implement PDF → XLSX using MuPDF extract + xlsx library

    throw new Error('Office conversion not yet implemented. Install docx/xlsx packages first.');
}

export { };
