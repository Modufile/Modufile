/**
 * Device Store (§6.4)
 * 
 * Zustand store for device capabilities.
 * Detects available memory and determines processing constraints.
 * 
 * Usage:
 *   const { deviceMemory, isLowMemory } = useDeviceStore();
 *   if (isLowMemory) { // reduce concurrency, skip prefetch }
 */

import { create } from 'zustand';

interface DeviceStore {
    /** Device memory in GB (from navigator.deviceMemory, fallback: 4) */
    deviceMemory: number;
    /** True if device has ≤2GB RAM — limit WASM concurrency */
    isLowMemory: boolean;
    /** Max concurrent workers based on memory */
    maxWorkers: number;
    /** Whether OPFS is available */
    opfsAvailable: boolean;
    /** Whether SharedArrayBuffer is available (required for WASM threading) */
    sabAvailable: boolean;
    /** Initialize by detecting capabilities */
    detect: () => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
    deviceMemory: 4,
    isLowMemory: false,
    maxWorkers: 2,
    opfsAvailable: false,
    sabAvailable: false,

    detect: () => {
        if (typeof window === 'undefined') return;

        // Memory detection (Chrome/Edge only — fallback to 4GB)
        const mem = (navigator as any).deviceMemory ?? 4;
        const isLow = mem <= 2;

        // Worker concurrency based on memory
        const maxWorkers = isLow ? 1 : mem >= 8 ? 4 : 2;

        // OPFS availability
        let opfs = false;
        try {
            opfs = 'storage' in navigator && 'getDirectory' in navigator.storage;
        } catch { /* unavailable */ }

        // SharedArrayBuffer availability
        const sab = typeof SharedArrayBuffer !== 'undefined';

        set({
            deviceMemory: mem,
            isLowMemory: isLow,
            maxWorkers,
            opfsAvailable: opfs,
            sabAvailable: sab,
        });
    },
}));
