/**
 * PyMuPDF WASM Loader
 *
 * Singleton loader for @bentopdf/pymupdf-wasm.
 * WASM assets are self-hosted at /wasm/pymupdf/ and /wasm/gs/ (served from R2 in production).
 *
 * License: AGPL-3.0
 */

const PYMUPDF_BASE = '/wasm/pymupdf/';
const GS_BASE = '/wasm/gs/assets/';

let cachedInstance: any = null;
let loadPromise: Promise<any> | null = null;

/**
 * Load and return the PyMuPDF singleton instance.
 * First call downloads and initializes the WASM engine (~56MB).
 * Subsequent calls return the cached instance immediately.
 */
export async function loadPyMuPDF(): Promise<any> {
    if (cachedInstance) return cachedInstance;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        try {
            const wrapperUrl = `${PYMUPDF_BASE}dist/index.js`;
            const module = await import(/* webpackIgnore: true */ wrapperUrl);

            if (typeof module.PyMuPDF !== 'function') {
                throw new Error('PyMuPDF module did not export expected PyMuPDF class.');
            }

            cachedInstance = new module.PyMuPDF({
                assetPath: `${PYMUPDF_BASE}assets/`,
                ghostscriptUrl: GS_BASE,
            });

            await cachedInstance.load();
            console.log('[PyMuPDF] Engine loaded successfully');
            return cachedInstance;
        } catch (error: any) {
            loadPromise = null;
            cachedInstance = null;
            throw new Error(`Failed to load PyMuPDF: ${error.message}`);
        }
    })();

    return loadPromise;
}

/**
 * Preload PyMuPDF during idle time.
 * Call on mount of pages that will need PDF conversion.
 */
export function preloadPyMuPDF(): void {
    const doPreload = () => {
        loadPyMuPDF().catch(() => {
            // Silently fail — user will see the error when they attempt conversion
        });
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(doPreload, { timeout: 8000 });
    } else {
        setTimeout(doPreload, 3000);
    }
}
