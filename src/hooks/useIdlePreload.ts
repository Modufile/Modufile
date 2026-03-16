import { useEffect } from 'react';

export function useIdlePreload(importFn: () => Promise<unknown>): void {
    useEffect(() => {
        let handle: number | ReturnType<typeof setTimeout>;

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            handle = requestIdleCallback(() => { importFn().catch(() => {}); }, { timeout: 5000 });
        } else {
            handle = setTimeout(() => { importFn().catch(() => {}); }, 2000);
        }

        return () => {
            if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
                cancelIdleCallback(handle as number);
            } else {
                clearTimeout(handle as ReturnType<typeof setTimeout>);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
