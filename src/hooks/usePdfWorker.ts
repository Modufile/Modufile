/**
 * usePdfWorker Hook
 * 
 * React hook for executing PDF operations via the worker pool.
 * Provides loading state, progress tracking, and error handling.
 * 
 * Usage:
 *   const { execute, isProcessing, progress, error } = usePdfWorker();
 *   
 *   const result = await execute('render', {
 *     buffer: fileBuffer,
 *     pageIndex: 0,
 *     dpi: 150,
 *   });
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { WorkerPool, WorkerType } from '@/lib/worker-pool';
import { progressBus, ProgressEvent } from '@/lib/progress-bus';

interface UsePdfWorkerOptions {
    /** Worker type to use. Defaults to 'pdf-core'. */
    workerType?: WorkerType;
    /** Called on each progress update. */
    onProgress?: (event: ProgressEvent) => void;
}

interface UsePdfWorkerReturn<T = unknown> {
    execute: (payload: unknown) => Promise<T>;
    isProcessing: boolean;
    progress: number;
    stage: string;
    error: string | null;
    cancel: () => void;
}

export function usePdfWorker<T = unknown>(
    options: UsePdfWorkerOptions = {},
): UsePdfWorkerReturn<T> {
    const { workerType = 'pdf-core', onProgress } = options;

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const operationIdRef = useRef<string | null>(null);
    const unsubRef = useRef<(() => void) | null>(null);

    // Clean up progress listener on unmount
    useEffect(() => {
        return () => {
            unsubRef.current?.();
        };
    }, []);

    const execute = useCallback(async (payload: unknown): Promise<T> => {
        setIsProcessing(true);
        setProgress(0);
        setStage('initializing');
        setError(null);

        const pool = WorkerPool.getInstance();

        try {
            const result = await pool.exec<T>(workerType, payload);
            setProgress(100);
            setStage('complete');
            return result;
        } catch (err: any) {
            const message = err?.message || 'An unknown error occurred';
            setError(message);
            throw err;
        } finally {
            setIsProcessing(false);
            unsubRef.current?.();
            unsubRef.current = null;
            operationIdRef.current = null;
        }
    }, [workerType, onProgress]);

    const cancel = useCallback(() => {
        // Workers don't support cancellation natively.
        // We can terminate the entire pool for the type, but that's destructive.
        // For now, just clean up state.
        setIsProcessing(false);
        setProgress(0);
        setStage('');
        unsubRef.current?.();
    }, []);

    return { execute, isProcessing, progress, stage, error, cancel };
}
