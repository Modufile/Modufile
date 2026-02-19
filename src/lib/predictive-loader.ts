/**
 * Predictive WASM Loader (§13.1)
 * 
 * Strategies for pre-loading WASM binaries before the user needs them:
 * A — Idle-time prefetch of MuPDF (always, on any PDF page)
 * B — Hover-intent prefetch for heavy engines (300ms delay)
 * D — Route-based prefetch (in page useEffects)
 */

/**
 * Strategy A: Prefetch MuPDF WASM during browser idle time.
 * Call this on any PDF tool page mount.
 * Costs nothing if already cached, saves ~4s if not.
 */
export function prefetchMuPdfOnIdle(): void {
    const prefetch = () => {
        // Fetch the WASM to populate browser cache / service worker cache
        fetch('/mupdf-wasm.wasm', { priority: 'low' as RequestPriority }).catch(() => { });
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(prefetch, { timeout: 5000 });
    } else {
        setTimeout(prefetch, 3000); // Fallback for Safari
    }
}

/**
 * Strategy B: Returns event handlers for hover-intent prefetch.
 * Attach to feature cards that need heavy WASM engines.
 * 
 * Usage:
 *   const handlers = createHoverPrefetch('/ghostscript.wasm');
 *   <FeatureCard {...handlers} />
 */
export function createHoverPrefetch(wasmUrl: string, delayMs = 300) {
    let timer: ReturnType<typeof setTimeout>;

    return {
        onMouseEnter: () => {
            timer = setTimeout(() => {
                fetch(wasmUrl, { priority: 'low' as RequestPriority }).catch(() => { });
            }, delayMs);
        },
        onMouseLeave: () => {
            clearTimeout(timer);
        },
    };
}

/**
 * Prefetch a specific WASM file immediately.
 * Useful for route-based prefetching.
 */
export function prefetchWasm(wasmUrl: string): void {
    fetch(wasmUrl, { priority: 'low' as RequestPriority }).catch(() => { });
}
