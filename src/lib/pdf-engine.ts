/**
 * PDF Engine
 * 
 * High-level API that routes PDF operations to the correct worker.
 * Abstracts away worker pool management and progress tracking.
 * 
 * Usage:
 *   const result = await pdfEngine.render(fileBuffer, pageIndex, { dpi: 150 });
 *   const result = await pdfEngine.compress(fileBuffer, { preset: 'ebook' });
 */

import { WorkerPool, WorkerType } from './worker-pool';
import { progressBus, ProgressEvent } from './progress-bus';

export interface RenderOptions {
    dpi?: number;
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
}

export interface CompressOptions {
    preset: 'screen' | 'ebook' | 'print';
}

export interface EncryptOptions {
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
        print?: boolean;
        copy?: boolean;
        modify?: boolean;
    };
}

export interface OcrOptions {
    languages: string[];
    outputFormat?: 'text' | 'pdf'; // text = just text, pdf = searchable PDF
}

export interface PdfEngineResult<T = Uint8Array> {
    data: T;
    operationId: string;
    durationMs: number;
}

class PdfEngineImpl {
    private pool = WorkerPool.getInstance();

    /**
     * Render a single page to an image.
     */
    async render(
        fileBuffer: ArrayBuffer,
        pageIndex: number,
        options: RenderOptions = {},
    ): Promise<PdfEngineResult<ImageBitmap>> {
        const start = performance.now();
        const result = await this.pool.exec<{ bitmap: ImageBitmap; operationId: string }>('pdf-core', {
            op: 'render',
            buffer: fileBuffer,
            pageIndex,
            ...options,
        });
        return {
            data: result.bitmap,
            operationId: result.operationId,
            durationMs: performance.now() - start,
        };
    }

    /**
     * Compress a PDF using Ghostscript.
     */
    async compress(
        fileBuffer: ArrayBuffer,
        options: CompressOptions,
    ): Promise<PdfEngineResult<Uint8Array>> {
        const start = performance.now();
        const result = await this.pool.exec<{ buffer: Uint8Array; operationId: string }>('pdf-compress', {
            op: 'compress',
            buffer: fileBuffer,
            ...options,
        });
        return {
            data: result.buffer,
            operationId: result.operationId,
            durationMs: performance.now() - start,
        };
    }

    /**
     * Encrypt/protect a PDF.
     */
    async encrypt(
        fileBuffer: ArrayBuffer,
        options: EncryptOptions,
    ): Promise<PdfEngineResult<Uint8Array>> {
        const start = performance.now();
        const result = await this.pool.exec<{ buffer: Uint8Array; operationId: string }>('pdf-core', {
            op: 'encrypt',
            buffer: fileBuffer,
            ...options,
        });
        return {
            data: result.buffer,
            operationId: result.operationId,
            durationMs: performance.now() - start,
        };
    }

    /**
     * Remove password protection from a PDF.
     */
    async decrypt(
        fileBuffer: ArrayBuffer,
        password: string,
    ): Promise<PdfEngineResult<Uint8Array>> {
        const start = performance.now();
        const result = await this.pool.exec<{ buffer: Uint8Array; operationId: string }>('pdf-core', {
            op: 'decrypt',
            buffer: fileBuffer,
            password,
        });
        return {
            data: result.buffer,
            operationId: result.operationId,
            durationMs: performance.now() - start,
        };
    }

    /**
     * Repair a corrupted PDF.
     */
    async repair(
        fileBuffer: ArrayBuffer,
    ): Promise<PdfEngineResult<Uint8Array>> {
        const start = performance.now();
        const result = await this.pool.exec<{ buffer: Uint8Array; operationId: string }>('pdf-core', {
            op: 'repair',
            buffer: fileBuffer,
        });
        return {
            data: result.buffer,
            operationId: result.operationId,
            durationMs: performance.now() - start,
        };
    }

    /**
     * Run OCR on a PDF to make it searchable.
     */
    async ocr(
        fileBuffer: ArrayBuffer,
        options: OcrOptions,
    ): Promise<PdfEngineResult<Uint8Array | string>> {
        const start = performance.now();
        const result = await this.pool.exec<{ data: Uint8Array | string; operationId: string }>('ocr', {
            op: 'ocr',
            buffer: fileBuffer,
            ...options,
        });
        return {
            data: result.data,
            operationId: result.operationId,
            durationMs: performance.now() - start,
        };
    }

    /**
     * Subscribe to progress for a specific operation.
     */
    onProgress(operationId: string, listener: (e: ProgressEvent) => void): () => void {
        return progressBus.on(operationId, listener);
    }

    /**
     * Pre-warm the pdf-core worker during idle time.
     */
    warmUp(): void {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.pool.preloadWorker('pdf-core'), { timeout: 8000 });
        } else {
            setTimeout(() => this.pool.preloadWorker('pdf-core'), 3000);
        }
    }

    /**
     * Clean up all workers.
     */
    dispose(): void {
        this.pool.terminateAll();
    }
}

/** Singleton PDF engine instance */
export const pdfEngine = new PdfEngineImpl();
