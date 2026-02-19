/**
 * Service Worker Registration
 * 
 * Registers the WASM-caching service worker.
 * Call this once from layout or a client component.
 */

export function registerServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        console.log('[SW] New service worker activated');
                    }
                });
            });

            console.log('[SW] Service worker registered');
        } catch (err) {
            console.warn('[SW] Registration failed:', err);
        }
    });
}
