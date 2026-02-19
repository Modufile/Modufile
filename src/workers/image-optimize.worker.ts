/**
 * Image Optimize Worker
 * 
 * Handles image processing tasks using Canvas API and Squoosh.
 * Used for PDF → Image conversion output optimization.
 * 
 * Stub — full implementation pending @squoosh/lib installation.
 */

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener('message', async (e: MessageEvent) => {
    const { type, operationId, payload } = e.data;
    if (type !== 'exec') return;

    try {
        const result = await handleOptimize(operationId, payload);
        ctx.postMessage({ type: 'result', operationId, payload: result });
    } catch (err: any) {
        ctx.postMessage({ type: 'error', operationId, error: err.message || 'Optimization failed' });
    }
});

async function handleOptimize(operationId: string, payload: any) {
    ctx.postMessage({ type: 'progress', operationId, percent: 10, stage: 'loading' });

    // Use OffscreenCanvas for zero main-thread image processing
    if (payload.op === 'convert-format') {
        const { imageData, width, height, format, quality } = payload;

        const offscreen = new OffscreenCanvas(width, height);
        const context = offscreen.getContext('2d')!;
        context.putImageData(new ImageData(new Uint8ClampedArray(imageData), width, height), 0, 0);

        ctx.postMessage({ type: 'progress', operationId, percent: 50, stage: 'converting' });

        const blob = await offscreen.convertToBlob({
            type: `image/${format || 'webp'}`,
            quality: quality || 0.9,
        });

        const buffer = await blob.arrayBuffer();
        ctx.postMessage({ type: 'progress', operationId, percent: 100, stage: 'complete' });

        return { buffer: new Uint8Array(buffer), operationId };
    }

    throw new Error(`Unknown image operation: ${payload.op}`);
}

export { };
