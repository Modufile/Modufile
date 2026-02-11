import { initializeImageMagick } from '@imagemagick/magick-wasm';

let isInitialized = false;

export async function initMagick() {
    if (isInitialized) return;

    // Load the WASM file from the public directory (we need to copy it there post-install or import it as a URL)
    // For now, we'll rely on the standard initialization which fetches from CDN or local if configured
    // In Next.js, we often need to copy the wasm file to public/
    // Checks if we are in browser
    if (typeof window === 'undefined') return;

    try {
        const wasmLocation = new URL('@imagemagick/magick-wasm/magick.wasm', import.meta.url);
        await initializeImageMagick(wasmLocation);
        isInitialized = true;
        console.log('Magick WASM Initialized');
    } catch (error) {
        console.error('Failed to initialize Magick WASM:', error);
    }
}
