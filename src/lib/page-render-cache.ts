/**
 * Page Render Cache (§13.4)
 * 
 * LRU cache for rendered PDF page bitmaps.
 * Keeps the last N rendered pages in memory to avoid re-rendering
 * when the user scrolls back to a previously viewed page.
 * 
 * Usage:
 *   const cache = new PageRenderCache(10);
 *   cache.set('doc-1', 3, bitmap);
 *   const cached = cache.get('doc-1', 3);
 */

export class PageRenderCache {
    private cache = new Map<string, ImageBitmap>();
    private readonly maxSize: number;

    constructor(maxSize = 10) {
        this.maxSize = maxSize;
    }

    private makeKey(docId: string, pageIndex: number): string {
        return `${docId}:${pageIndex}`;
    }

    get(docId: string, pageIndex: number): ImageBitmap | undefined {
        return this.cache.get(this.makeKey(docId, pageIndex));
    }

    set(docId: string, pageIndex: number, bitmap: ImageBitmap): void {
        const key = this.makeKey(docId, pageIndex);

        // Evict oldest entry if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.get(firstKey)?.close(); // Release GPU memory
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, bitmap);
    }

    has(docId: string, pageIndex: number): boolean {
        return this.cache.has(this.makeKey(docId, pageIndex));
    }

    /**
     * Remove all cached pages for a specific document.
     */
    clearDocument(docId: string): void {
        for (const [key, bitmap] of this.cache.entries()) {
            if (key.startsWith(`${docId}:`)) {
                bitmap.close();
                this.cache.delete(key);
            }
        }
    }

    /**
     * Release all cached bitmaps and clear the cache.
     */
    clear(): void {
        this.cache.forEach(bitmap => bitmap.close());
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}
