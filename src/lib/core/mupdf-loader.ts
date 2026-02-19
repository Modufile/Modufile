/**
 * MuPDF Loader
 * 
 * Dynamically loads the official Artifex MuPDF library from public/.
 * Files are copied there during build via `npm run copy:wasm`.
 * 
 * Chain: mupdf.js → mupdf-wasm.js → mupdf-wasm.wasm
 * All three must be in public/ for relative imports to resolve.
 * 
 * Usage:
 *   const mupdf = await loadMuPDF();
 *   const doc = mupdf.Document.openDocument(buffer, 'application/pdf');
 */

let mupdfModule: any = null;

export async function loadMuPDF(): Promise<typeof import('mupdf')> {
    if (mupdfModule) return mupdfModule;

    // Dynamic import from public/ — webpackIgnore bypasses bundler
    // mupdf.js internally imports ./mupdf-wasm.js which loads ./mupdf-wasm.wasm
    // @ts-ignore
    mupdfModule = await import(/* webpackIgnore: true */ '/mupdf.js');

    return mupdfModule;
}
