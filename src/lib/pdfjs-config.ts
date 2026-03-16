/**
 * Shared pdfjs-dist configuration.
 * Worker is bundled locally (copied from node_modules to public/ via copy:wasm script)
 * to avoid COEP/CORS issues with CDN-hosted workers.
 */
export const PDFJS_WORKER_SRC = '/pdf.worker.min.js';
