/**
 * useFileStaging Hook
 * 
 * React hook for staging large files to OPFS with progress.
 * Automatically stages files above the threshold (50MB).
 * 
 * Usage:
 *   const { stageFile, readFile, clearFile, progress, isStaging } = useFileStaging();
 *   
 *   if (file.size > OPFS_THRESHOLD) {
 *     await stageFile('doc-1', file);
 *     const buffer = await readFile('doc-1');
 *   }
 */

'use client';

import { useState, useCallback } from 'react';
import {
    stageToOpfs,
    readFromOpfs,
    clearFromOpfs,
    clearAllStaged,
    OPFS_THRESHOLD,
} from '@/lib/opfs-staging';

export { OPFS_THRESHOLD };

interface UseFileStagingReturn {
    stageFile: (id: string, data: Blob | ArrayBuffer | Uint8Array) => Promise<void>;
    readFile: (id: string) => Promise<ArrayBuffer>;
    clearFile: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    isStaging: boolean;
    progress: number;
}

export function useFileStaging(): UseFileStagingReturn {
    const [isStaging, setIsStaging] = useState(false);
    const [progress, setProgress] = useState(0);

    const stageFile = useCallback(async (
        id: string,
        data: Blob | ArrayBuffer | Uint8Array,
    ) => {
        setIsStaging(true);
        setProgress(0);
        try {
            await stageToOpfs(id, data, (percent) => setProgress(percent));
        } finally {
            setIsStaging(false);
        }
    }, []);

    const readFile = useCallback(async (id: string): Promise<ArrayBuffer> => {
        return readFromOpfs(id);
    }, []);

    const clearFile = useCallback(async (id: string) => {
        await clearFromOpfs(id);
    }, []);

    const clearAll = useCallback(async () => {
        await clearAllStaged();
    }, []);

    return { stageFile, readFile, clearFile, clearAll, isStaging, progress };
}
