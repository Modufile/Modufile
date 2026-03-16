'use client';

/**
 * useMuPDF Hook
 *
 * Promise-based bridge to the dedicated pdf-editor worker.
 * Creates a single worker instance (not pooled) since the document
 * stays open across operations.
 */

import { useRef, useCallback, useEffect, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PageInfo {
    width: number;
    height: number;
}

export interface LoadResult {
    pageCount: number;
    pages: PageInfo[];
}

export interface RenderResult {
    pngData: ArrayBuffer;
    width: number;
    height: number;
    pageWidth: number;
    pageHeight: number;
}

export interface AnnotationInfo {
    index: number;
    type: string;
    rect: number[];
    contents: string;
    color: number[];
    opacity: number;
    hasQuadPoints: boolean;
    hasInkList: boolean;
}

export type AnnotationType =
    | 'Text' | 'FreeText' | 'Line' | 'Square' | 'Circle'
    | 'Polygon' | 'PolyLine' | 'Highlight' | 'Underline'
    | 'Squiggly' | 'StrikeOut' | 'Redact' | 'Stamp' | 'Ink';

export interface AddAnnotationParams {
    pageIndex: number;
    type: AnnotationType;
    rect?: number[];
    color?: number[];
    interiorColor?: number[];
    opacity?: number;
    contents?: string;
    quadPoints?: number[][];
    inkList?: number[][][];
    borderWidth?: number;
    fontSize?: number;
    fontName?: string;
    lineEndingStart?: string;
    lineEndingEnd?: string;
    linePoints?: number[];
    vertices?: number[][];
    imageData?: ArrayBuffer;
    iconName?: string;
    textColor?: number[];    // [r, g, b] 0-1, for FreeText text color
    transparent?: boolean;   // Skip setColor for transparent FreeText background
}

export interface UpdateAnnotationParams {
    pageIndex: number;
    annotIndex: number;
    color?: number[];
    opacity?: number;
    borderWidth?: number;
    contents?: string;
    rect?: number[];
    linePoints?: number[];
    inkList?: number[][][];
    quadPoints?: number[][];
}

export interface AnnotationGeometry {
    rect: number[];
    linePoints?: number[];
    inkList?: number[][][];
    quadPoints?: number[][];
}

/* ------------------------------------------------------------------ */
/*  Pending request tracking                                           */
/* ------------------------------------------------------------------ */

interface PendingRequest {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useMuPDF() {
    const workerRef = useRef<Worker | null>(null);
    const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
    const isDisposedRef = useRef(false);

    // Initialize worker lazily — recreates if previously disposed
    const getWorker = useCallback(() => {
        if (workerRef.current) return workerRef.current;

        // Reset disposed flag — user is starting a new operation
        isDisposedRef.current = false;

        const worker = new Worker(
            new URL('../workers/pdf-editor.worker.ts', import.meta.url),
            { type: 'module' },
        );

        worker.addEventListener('message', (e: MessageEvent) => {
            const { id, result, error } = e.data;
            const pending = pendingRef.current.get(id);
            if (!pending) return;

            pendingRef.current.delete(id);
            if (error) {
                pending.reject(new Error(error));
            } else {
                pending.resolve(result);
            }
        });

        worker.addEventListener('error', (e) => {
            console.error('[useMuPDF] Worker error:', e);
        });

        workerRef.current = worker;
        return worker;
    }, []);

    // Send a message and return a promise for the response
    const send = useCallback(<T = any>(op: string, params: Record<string, any> = {}): Promise<T> => {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const worker = getWorker();

            pendingRef.current.set(id, { resolve, reject });

            // Clone imageData before transferring so the original stays valid in React state
            const sendParams = { ...params };
            if (sendParams.imageData instanceof ArrayBuffer) {
                sendParams.imageData = sendParams.imageData.slice(0);
            }

            // Build transfer list for ArrayBuffer params
            const transfer: Transferable[] = [];
            if (sendParams.buffer instanceof ArrayBuffer) {
                transfer.push(sendParams.buffer);
            }
            if (sendParams.imageData instanceof ArrayBuffer) {
                transfer.push(sendParams.imageData);
            }

            worker.postMessage({ id, op, ...sendParams }, transfer);
        });
    }, [getWorker]);

    // Cleanup on unmount
    // Reset isDisposed on mount to handle React Strict Mode double-mount
    // (refs persist across the unmount/remount cycle)
    useEffect(() => {
        isDisposedRef.current = false;

        return () => {
            isDisposedRef.current = true;
            if (workerRef.current) {
                // Try to close document before terminating
                const id = crypto.randomUUID();
                workerRef.current.postMessage({ id, op: 'close' });
                setTimeout(() => {
                    workerRef.current?.terminate();
                    workerRef.current = null;
                }, 100);
            }
            // Reject any pending requests
            pendingRef.current.forEach((p) => p.reject(new Error('Worker disposed')));
            pendingRef.current.clear();
        };
    }, []);

    /* ---- Eager init: preload worker + WASM on mount ---- */
    const warmup = useCallback(() => {
        getWorker(); // Triggers lazy creation which loads the worker script + WASM
    }, [getWorker]);

    /* ---- Public API ---- */

    const load = useCallback(
        (buffer: ArrayBuffer) => send<LoadResult>('load', { buffer }),
        [send],
    );

    const renderPage = useCallback(
        (pageIndex: number, dpi = 150) => send<RenderResult>('render', { pageIndex, dpi }),
        [send],
    );

    const addAnnotation = useCallback(
        (params: AddAnnotationParams) => send<{ success: boolean }>('add-annotation', params),
        [send],
    );

    const deleteAnnotation = useCallback(
        (pageIndex: number, annotIndex: number) =>
            send<{ success: boolean }>('delete-annotation', { pageIndex, annotIndex }),
        [send],
    );

    const updateAnnotation = useCallback(
        (params: UpdateAnnotationParams) =>
            send<{ success: boolean }>('update-annotation', params),
        [send],
    );

    const getAnnotations = useCallback(
        (pageIndex: number) =>
            send<{ annotations: AnnotationInfo[] }>('get-annotations', { pageIndex }),
        [send],
    );

    const getAnnotationGeometry = useCallback(
        (pageIndex: number, annotIndex: number) =>
            send<AnnotationGeometry>('get-annotation-geometry', { pageIndex, annotIndex }),
        [send],
    );

    const applyRedactions = useCallback(
        (pageIndex: number) => send<{ success: boolean }>('apply-redactions', { pageIndex }),
        [send],
    );

    const save = useCallback(
        () => send<{ buffer: Uint8Array }>('save'),
        [send],
    );

    // Close document but keep worker alive (for re-uploading a new file)
    const close = useCallback(
        () => send<{ success: boolean }>('close'),
        [send],
    );

    const dispose = useCallback(() => {
        isDisposedRef.current = true;
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        pendingRef.current.forEach((p) => p.reject(new Error('Worker disposed')));
        pendingRef.current.clear();
    }, []);

    return useMemo(() => ({
        warmup,
        load,
        renderPage,
        addAnnotation,
        deleteAnnotation,
        updateAnnotation,
        getAnnotations,
        getAnnotationGeometry,
        applyRedactions,
        save,
        close,
        dispose,
    }), [warmup, load, renderPage, addAnnotation, deleteAnnotation, updateAnnotation, getAnnotations, getAnnotationGeometry, applyRedactions, save, close, dispose]);
}
