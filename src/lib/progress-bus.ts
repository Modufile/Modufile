/**
 * Progress Bus (§2.2)
 * 
 * EventEmitter for Worker → UI progress updates.
 * Workers post progress messages, the bus routes them to subscribers.
 * 
 * Usage:
 *   // Subscribe
 *   const unsub = progressBus.on('render-page-1', (progress) => {
 *     setProgress(progress.percent);
 *   });
 * 
 *   // Worker posts: { type: 'progress', operationId: '...', percent: 50, stage: 'rendering' }
 *   // Bus automatically routes to subscribers
 */

export interface ProgressEvent {
    operationId: string;
    percent: number;          // 0-100
    stage?: string;           // e.g. 'loading', 'parsing', 'rendering', 'saving'
    currentItem?: number;     // e.g. current page
    totalItems?: number;      // e.g. total pages
    message?: string;         // Human-readable status
}

type ProgressListener = (event: ProgressEvent) => void;
type GlobalProgressListener = (event: ProgressEvent) => void;

class ProgressBusImpl {
    private listeners = new Map<string, Set<ProgressListener>>();
    private globalListeners = new Set<GlobalProgressListener>();

    /**
     * Subscribe to progress updates for a specific operation.
     * Returns an unsubscribe function.
     */
    on(operationId: string, listener: ProgressListener): () => void {
        if (!this.listeners.has(operationId)) {
            this.listeners.set(operationId, new Set());
        }
        this.listeners.get(operationId)!.add(listener);

        return () => {
            this.listeners.get(operationId)?.delete(listener);
            if (this.listeners.get(operationId)?.size === 0) {
                this.listeners.delete(operationId);
            }
        };
    }

    /**
     * Subscribe to ALL progress updates (useful for debug/logging).
     */
    onAll(listener: GlobalProgressListener): () => void {
        this.globalListeners.add(listener);
        return () => this.globalListeners.delete(listener);
    }

    /**
     * Emit a progress event (called when a worker posts a progress message).
     */
    emit(event: ProgressEvent): void {
        // Route to operation-specific listeners
        this.listeners.get(event.operationId)?.forEach(fn => fn(event));

        // Route to global listeners
        this.globalListeners.forEach(fn => fn(event));
    }

    /**
     * Remove all listeners for an operation (cleanup after completion).
     */
    clear(operationId: string): void {
        this.listeners.delete(operationId);
    }

    /**
     * Remove ALL listeners (cleanup on unmount).
     */
    clearAll(): void {
        this.listeners.clear();
        this.globalListeners.clear();
    }
}

/** Singleton progress bus instance */
export const progressBus = new ProgressBusImpl();
