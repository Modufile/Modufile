/**
 * Worker Pool (§2.1)
 * 
 * Manages a pool of Web Workers with queuing and concurrency limits.
 * Each worker type has its own pool, lazily instantiated.
 * 
 * Usage:
 *   const pool = WorkerPool.getInstance();
 *   const result = await pool.exec('pdf-core', { op: 'render', ... });
 */

export type WorkerType =
    | 'pdf-core'       // MuPDF: render, redact, repair, encrypt
    | 'pdf-compress'   // Ghostscript
    | 'ocr'            // Tesseract.js
    | 'office'         // Office → PDF (docx/xlsx/pptx libs)
    | 'image-optimize'; // Canvas + Squoosh

interface QueuedTask {
    type: WorkerType;
    payload: unknown;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
    operationId: string;
}

interface WorkerEntry {
    worker: Worker;
    busy: boolean;
}

// Webpack requires static string literals for new Worker(new URL(...)) to correctly bundle workers.
// The mapping is now handled directly inside createWorker.

const MAX_CONCURRENCY: Record<WorkerType, number> = {
    'pdf-core': 2,
    'pdf-compress': 1,     // Ghostscript is memory-heavy
    'ocr': 2,
    'office': 1,
    'image-optimize': 2,
};

export class WorkerPool {
    private static instance: WorkerPool;
    private pools = new Map<WorkerType, WorkerEntry[]>();
    private queues = new Map<WorkerType, QueuedTask[]>();

    static getInstance(): WorkerPool {
        if (!WorkerPool.instance) {
            WorkerPool.instance = new WorkerPool();
        }
        return WorkerPool.instance;
    }

    /**
     * Execute an operation on a worker.
     * If all workers of the given type are busy, the task is queued.
     */
    async exec<T = unknown>(type: WorkerType, payload: unknown): Promise<T> {
        const operationId = crypto.randomUUID();

        return new Promise<T>((resolve, reject) => {
            const task: QueuedTask = {
                type,
                payload,
                resolve: resolve as (value: unknown) => void,
                reject,
                operationId,
            };

            const worker = this.getAvailableWorker(type);
            if (worker) {
                this.dispatch(worker, task);
            } else {
                // Queue if all workers busy or at max concurrency
                if (!this.queues.has(type)) this.queues.set(type, []);
                this.queues.get(type)!.push(task);
            }
        });
    }

    /**
     * Pre-instantiate a worker during idle time.
     */
    ensureWorker(type: WorkerType): void {
        const pool = this.pools.get(type) || [];
        if (pool.length === 0) {
            const entry = this.createWorker(type);
            pool.push(entry);
            this.pools.set(type, pool);
        }
    }

    /**
     * Pre-instantiate a worker AND trigger its WASM/engine initialization.
     * This sends a 'preload' message so the worker downloads and compiles
     * its WASM binary during idle time, before the user needs it.
     */
    preloadWorker(type: WorkerType): void {
        this.ensureWorker(type);
        const pool = this.pools.get(type);
        if (pool && pool.length > 0) {
            const entry = pool[0];
            if (!entry.busy) {
                entry.worker.postMessage({ type: 'preload' });
            }
        }
    }

    /**
     * Terminate all workers of a given type (for cleanup).
     */
    terminateAll(type?: WorkerType): void {
        const types = type ? [type] : Array.from(this.pools.keys());
        for (const t of types) {
            const pool = this.pools.get(t) || [];
            pool.forEach(entry => entry.worker.terminate());
            this.pools.delete(t);
            this.queues.delete(t);
        }
    }

    private getAvailableWorker(type: WorkerType): WorkerEntry | null {
        const pool = this.pools.get(type) || [];
        const maxConcurrency = MAX_CONCURRENCY[type];

        // Find an idle worker
        const idle = pool.find(entry => !entry.busy);
        if (idle) return idle;

        // Create a new worker if under concurrency limit
        if (pool.length < maxConcurrency) {
            const entry = this.createWorker(type);
            pool.push(entry);
            this.pools.set(type, pool);
            return entry;
        }

        return null; // All busy, task will be queued
    }

    private createWorker(type: WorkerType): WorkerEntry {
        let worker: Worker;
        // Next.js (Webpack 5) requires precise static paths for the import.meta.url magic to work
        switch (type) {
            case 'pdf-core':
                worker = new Worker(new URL('../workers/pdf-core.worker.ts', import.meta.url), { type: 'module' });
                break;
            case 'pdf-compress':
                worker = new Worker(new URL('../workers/pdf-compress.worker.ts', import.meta.url), { type: 'module' });
                break;
            case 'ocr':
                worker = new Worker(new URL('../workers/ocr.worker.ts', import.meta.url), { type: 'module' });
                break;
            case 'office':
                worker = new Worker(new URL('../workers/office.worker.ts', import.meta.url), { type: 'module' });
                break;
            case 'image-optimize':
                worker = new Worker(new URL('../workers/image-optimize.worker.ts', import.meta.url), { type: 'module' });
                break;
            default:
                throw new Error(`Unsupported worker type: ${type}`);
        }
        return { worker, busy: false };
    }

    private dispatch(entry: WorkerEntry, task: QueuedTask): void {
        entry.busy = true;

        const cleanup = () => {
            entry.busy = false;
            entry.worker.removeEventListener('message', handleMessage);
            entry.worker.removeEventListener('error', handleError);
            this.processQueue(task.type);
        };

        const handleMessage = (e: MessageEvent) => {
            if (e.data?.operationId !== task.operationId) return;

            if (e.data.type === 'result') {
                task.resolve(e.data.payload);
                cleanup();
            } else if (e.data.type === 'error') {
                task.reject(new Error(e.data.error));
                cleanup();
            }
            // 'progress' messages are handled elsewhere (progress-bus)
        };

        const handleError = (e: ErrorEvent) => {
            task.reject(e);
            cleanup();
        };

        entry.worker.addEventListener('message', handleMessage);
        entry.worker.addEventListener('error', handleError);

        entry.worker.postMessage({
            type: 'exec',
            operationId: task.operationId,
            payload: task.payload,
        });
    }

    private processQueue(type: WorkerType): void {
        const queue = this.queues.get(type);
        if (!queue || queue.length === 0) return;

        const worker = this.getAvailableWorker(type);
        if (!worker) return;

        const nextTask = queue.shift()!;
        this.dispatch(worker, nextTask);
    }
}
