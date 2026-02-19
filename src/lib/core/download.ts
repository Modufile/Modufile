import { zipSync, strToU8 } from 'fflate';

/**
 * Download a single Blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Download multiple files as a ZIP archive using fflate (lightweight, fast)
 */
export const downloadMultipleAsZip = async (files: Array<{ name: string; blob: Blob }>, zipName: string) => {
    const zipData: Record<string, Uint8Array> = {};

    for (const file of files) {
        const buffer = await file.blob.arrayBuffer();
        zipData[file.name] = new Uint8Array(buffer);
    }

    const zipped = zipSync(zipData);
    const blob = new Blob([zipped as BlobPart], { type: 'application/zip' });
    downloadBlob(blob, `${zipName}.zip`);
};
