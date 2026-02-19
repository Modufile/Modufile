'use client';

/**
 * Client Bootstrap
 * 
 * Runs once on app mount to initialize:
 * - Service Worker registration (WASM caching)
 * - Device capability detection
 * - MuPDF WASM prefetch on idle
 */

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';
import { useDeviceStore } from '@/stores/deviceStore';
import { prefetchMuPdfOnIdle } from '@/lib/predictive-loader';

export function ClientBootstrap() {
    const detect = useDeviceStore((s) => s.detect);

    useEffect(() => {
        // 1. Detect device capabilities
        detect();

        // 2. Register service worker for WASM caching
        registerServiceWorker();

        // 3. Prefetch MuPDF WASM during idle time
        prefetchMuPdfOnIdle();
    }, [detect]);

    return null; // No UI — just side effects
}
