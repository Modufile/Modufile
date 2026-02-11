import { initializeImageMagick } from '@imagemagick/magick-wasm';

let isInitialized = false;

export async function initMagick() {
    if (isInitialized) return;

    // Load the WASM file from the public directory (we need to copy it there post-install or import it as a URL)
    // For now, we'll rely on the standard initialization which fetches from CDN or local if configured
    // In Next.js, we often need to copy the wasm file to public/
    // Checks if we are in browser
    if (typeof window === 'undefined') return;

    // Robust loading for static export:
    // 1. Resolve correct path (handling potential base paths if any)
    const wasmPath = '/magick.wasm';

    // 2. Fetch it explicitly to get a valid Response object
    const response = await fetch(wasmPath);
    if (!response.ok) {
        throw new Error(`Failed to fetch WASM: ${response.statusText}`);
    }

    // 3. Get the ArrayBuffer (safest way to pass to instantiate)
    const wasmBytes = await response.arrayBuffer();

    // 4. Initialize with the bytes
    await initializeImageMagick(wasmBytes);

    isInitialized = true;
    console.log('Magick WASM Initialized');
} catch (error) {
    console.error('Failed to initialize Magick WASM:', error);
}
}
