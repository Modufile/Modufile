/**
 * Type declarations for Web Worker global scope and external modules.
 */

// Minimal WorkerGlobalScope for worker files
// (TypeScript's DOM lib doesn't include worker globals by default,
//  and we can't use both "dom" and "webworker" libs)
interface DedicatedWorkerGlobalScope {
    postMessage(message: any, transfer?: Transferable[]): void;
    postMessage(message: any, options?: StructuredSerializeOptions): void;
    addEventListener(type: 'message', listener: (e: MessageEvent) => void): void;
    addEventListener(type: string, listener: (e: any) => void): void;
    removeEventListener(type: string, listener: (e: any) => void): void;
    onmessage: ((this: DedicatedWorkerGlobalScope, ev: MessageEvent) => any) | null;
}

// Module declaration for MuPDF loaded dynamically from public/
// Used in workers and the main-thread loader
declare module '/mupdf.js' {
    const mupdf: any;
    export = mupdf;
}
