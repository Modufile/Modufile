/**
 * OPFS Staging (§4)
 * 
 * Stage large files (>50MB) in the Origin Private File System (OPFS)
 * to avoid holding them in memory. OPFS persists across page reloads
 * and has no practical storage limit.
 * 
 * Usage:
 *   const handle = await opfsStaging.stage('upload-123', fileBlob);
 *   const buffer = await opfsStaging.read('upload-123');
 *   await opfsStaging.clear('upload-123');
 */

const STAGING_DIR = 'modufile-staging';

/**
 * Threshold above which files should be staged to OPFS.
 * 50MB is chosen to balance memory usage vs the overhead of OPFS access.
 */
export const OPFS_THRESHOLD = 50 * 1024 * 1024; // 50MB

async function getStagingDir(): Promise<FileSystemDirectoryHandle> {
    const root = await navigator.storage.getDirectory();
    return root.getDirectoryHandle(STAGING_DIR, { create: true });
}

/**
 * Stage a file or blob to OPFS.
 * Returns the filename used for retrieval.
 */
export async function stageToOpfs(
    id: string,
    data: Blob | ArrayBuffer | Uint8Array,
    onProgress?: (percent: number) => void,
): Promise<string> {
    const dir = await getStagingDir();
    const fileHandle = await dir.getFileHandle(id, { create: true });
    const writable = await fileHandle.createWritable();

    if (data instanceof Blob) {
        // Stream in chunks for progress reporting
        const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
        const totalSize = data.size;
        let written = 0;

        for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
            const chunk = data.slice(offset, Math.min(offset + CHUNK_SIZE, totalSize));
            await writable.write(chunk);
            written += chunk.size;
            onProgress?.(Math.round((written / totalSize) * 100));
        }
    } else {
        // ArrayBuffer or Uint8Array — write in one shot
        const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
        await writable.write(bytes as unknown as FileSystemWriteChunkType);
        onProgress?.(100);
    }

    await writable.close();
    return id;
}

/**
 * Read a staged file back from OPFS as an ArrayBuffer.
 */
export async function readFromOpfs(id: string): Promise<ArrayBuffer> {
    const dir = await getStagingDir();
    const fileHandle = await dir.getFileHandle(id);
    const file = await fileHandle.getFile();
    return file.arrayBuffer();
}

/**
 * Read a staged file as a ReadableStream (for streaming operations).
 */
export async function readStreamFromOpfs(id: string): Promise<ReadableStream<Uint8Array>> {
    const dir = await getStagingDir();
    const fileHandle = await dir.getFileHandle(id);
    const file = await fileHandle.getFile();
    return file.stream() as ReadableStream<Uint8Array>;
}

/**
 * Remove a staged file from OPFS.
 */
export async function clearFromOpfs(id: string): Promise<void> {
    try {
        const dir = await getStagingDir();
        await dir.removeEntry(id);
    } catch {
        // File may not exist — that's fine
    }
}

/**
 * Clear ALL staged files (useful on app startup or explicit cleanup).
 */
export async function clearAllStaged(): Promise<void> {
    try {
        const root = await navigator.storage.getDirectory();
        await root.removeEntry(STAGING_DIR, { recursive: true });
    } catch {
        // Directory may not exist
    }
}

/**
 * List all currently staged files.
 */
export async function listStaged(): Promise<string[]> {
    try {
        const dir = await getStagingDir();
        const names: string[] = [];
        for await (const entry of (dir as any).keys()) {
            names.push(entry);
        }
        return names;
    } catch {
        return [];
    }
}
