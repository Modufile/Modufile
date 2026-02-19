/**
 * Streaming Download (§13.6)
 * 
 * For large output files, streams directly to disk via the
 * File System Access API. Falls back to in-memory Blob download
 * on browsers that don't support `showSaveFilePicker`.
 * 
 * Usage:
 *   await streamingDownload('output.pdf', async (writer) => {
 *     for (const chunk of chunks) {
 *       await writer.write(chunk);
 *     }
 *   });
 */

import { downloadBlob } from './core/download';

interface WriterLike {
    write(data: Uint8Array | Blob): Promise<void>;
    close(): Promise<void>;
}

/**
 * Stream output to a file on disk.
 * Uses File System Access API on Chrome/Edge, falls back to Blob on Safari/Firefox.
 */
export async function streamingDownload(
    filename: string,
    mimeType: string,
    writeCallback: (writer: WriterLike) => Promise<void>,
): Promise<void> {
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [{ accept: { [mimeType]: [`.${filename.split('.').pop()}`] } }],
            });
            const writable = await handle.createWritable();
            await writeCallback(writable);
            await writable.close();
            return;
        } catch (err: any) {
            // User cancelled the dialog or API error — fall through to blob
            if (err?.name === 'AbortError') return;
        }
    }

    // Fallback: collect chunks in memory, then download as Blob
    const chunks: Uint8Array[] = [];
    const pseudoWriter: WriterLike = {
        write: async (data: Uint8Array | Blob) => {
            if (data instanceof Blob) {
                const buffer = await data.arrayBuffer();
                chunks.push(new Uint8Array(buffer));
            } else {
                chunks.push(data);
            }
        },
        close: async () => {
            const blob = new Blob(chunks as BlobPart[], { type: mimeType });
            downloadBlob(blob, filename);
        },
    };

    await writeCallback(pseudoWriter);
    await pseudoWriter.close();
}
