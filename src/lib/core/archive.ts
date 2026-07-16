/**
 * archive.ts — Domain-core ZIP create/extract via fflate (MIT).
 * Runs entirely client-side; platform-agnostic (Layer 3).
 */

import { zip, unzip, type AsyncZippable } from 'fflate';

export interface ZipEntry {
    /** Path inside the archive (POSIX separators). */
    name: string;
    /** Uncompressed size in bytes. */
    size: number;
    data: Uint8Array;
}

/** 0 = store (no compression), 6 = balanced, 9 = smallest. */
export type ZipLevel = 0 | 6 | 9;

/** Builds a ZIP archive from files. Duplicate names get a numeric suffix. */
export async function createZip(
    files: Array<{ name: string; data: Uint8Array }>,
    level: ZipLevel = 6,
): Promise<Blob> {
    const tree: AsyncZippable = {};
    const seen = new Set<string>();

    for (const file of files) {
        let name = file.name.replace(/\\/g, '/');
        if (seen.has(name)) {
            const dot = name.lastIndexOf('.');
            const base = dot > 0 ? name.slice(0, dot) : name;
            const ext = dot > 0 ? name.slice(dot) : '';
            let n = 2;
            while (seen.has(`${base} (${n})${ext}`)) n++;
            name = `${base} (${n})${ext}`;
        }
        seen.add(name);
        tree[name] = [file.data, { level }];
    }

    const zipped = await new Promise<Uint8Array>((resolve, reject) => {
        zip(tree, (err, data) => (err ? reject(err) : resolve(data)));
    });
    return new Blob([zipped as BlobPart], { type: 'application/zip' });
}

/** Extracts all file entries from a ZIP archive (directories are skipped). */
export async function extractZip(archive: Uint8Array): Promise<ZipEntry[]> {
    const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
        unzip(archive, (err, data) => (err ? reject(err) : resolve(data)));
    });

    return Object.entries(unzipped)
        .filter(([name]) => !name.endsWith('/'))
        .map(([name, data]) => ({ name, size: data.length, data }));
}

/** Guesses a MIME type from a filename extension (for extracted-entry downloads). */
export function guessMimeType(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
        pdf: 'application/pdf',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
        webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif',
        txt: 'text/plain', md: 'text/plain', csv: 'text/csv', json: 'application/json',
        html: 'text/html', xml: 'application/xml',
        mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        zip: 'application/zip',
    };
    return map[ext] ?? 'application/octet-stream';
}
