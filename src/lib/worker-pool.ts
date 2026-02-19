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
    | 'office'         // PDF → Office (docx/xlsx)
    | 'office-zeta'    // Office → PDF (ZetaJS)
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

/**
 * Worker script paths — mapped to src/workers/*.worker.ts
 * These are compiled separately and loaded via `new Worker(url)`.
 */
const WORKER_SCRIPTS: Record<WorkerType, string> = {
    'pdf-core': '/workers/pdf-core.worker.js',
    'pdf-compress': '/workers/pdf-compress.worker.js',
    'ocr': '/workers/ocr.worker.js',
    'office': '/workers/office.worker.js',
    'office-zeta': '/workers/office-zeta.worker.js',
    'image-optimize': '/workers/image-optimize.worker.js',
};

const MAX_CONCURRENCY: Record<WorkerType, number> = {
    'pdf-core': 2,
    'pdf-compress': 1,     // Ghostscript is memory-heavy
    'ocr': 2,
    'office': 1,
    'office-zeta': 1,      // ZetaJS is very heavy
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
        const worker = new Worker(WORKER_SCRIPTS[type], { type: 'module' });
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
