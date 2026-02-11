import JSZip from 'jszip';

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
 * Download multiple files as a ZIP archive
 */
export const downloadMultipleAsZip = async (files: Array<{ name: string; blob: Blob }>, zipName: string) => {
    const zip = new JSZip();

    files.forEach(file => {
        zip.file(file.name, file.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, `${zipName}.zip`);
};
