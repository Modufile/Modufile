'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { extractZip, guessMimeType, type ZipEntry } from '@/lib/core/archive';
import { Download, FileText, FileArchive, RefreshCw, X } from 'lucide-react';

export default function UnzipPage() {
    const [file, setFile] = useState<File | null>(null);
    const [entries, setEntries] = useState<ZipEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const handleFilesAdded = useCallback(async (newFiles: File[]) => {
        const zipFile = newFiles.find(f => f.name.toLowerCase().endsWith('.zip')) ?? newFiles[0];
        if (!zipFile) return;

        setIsLoading(true);
        setLoadError(null);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        try {
            const bytes = new Uint8Array(await zipFile.arrayBuffer());
            const extracted = await extractZip(bytes);
            setFile(zipFile);
            setEntries(extracted);
            if (extracted.length === 0) {
                setLoadError('This archive contains no files.');
            }
        } catch (err) {
            console.error('Failed to extract archive:', err);
            setFile(zipFile);
            setEntries([]);
            setLoadError('Could not read this archive. It may be corrupt, encrypted, or not a ZIP file.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFilesAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFilesAdded, setStoredFiles]);

    const removeFile = useCallback(() => {
        setFile(null);
        setEntries([]);
        setLoadError(null);
    }, []);

    const downloadEntry = useCallback((entry: ZipEntry) => {
        const blob = new Blob([entry.data as BlobPart], { type: guessMimeType(entry.name) });
        // Flatten folder paths for the download filename
        downloadBlob(blob, entry.name.split('/').pop() || entry.name);
    }, []);

    // Save = extract everything as individual downloads (browser will ask once for multi-download)
    const handleSave = async (): Promise<void> => {
        setIsProcessing(true);
        try {
            for (const entry of entries) {
                downloadEntry(entry);
                await new Promise(r => setTimeout(r, 250));
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);

    return (
        <ToolPageLayout
            title="Extract ZIP"
            description="Open a ZIP archive and download its files — everything stays on your device."
            parentCategory="Archive Tools"
            parentHref="/"
            about={toolContent['zip-extract'].about}
            techSetup={toolContent['zip-extract'].techSetup}
            faqs={toolContent['zip-extract'].faqs}
            onSave={entries.length > 0 ? handleSave : undefined}
            saveDisabled={entries.length === 0 || isProcessing}
            saveLabel={`Extract All (${entries.length})`}
            isProcessing={isProcessing}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles={false}
                    acceptedFileTypes={['.zip', 'application/zip']}
                />
            }
            sidebar={
                <div className="space-y-5 mt-3">
                    {entries.length > 0 && (
                        <div className="px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
                            <span className="text-xs text-zinc-500">{entries.length} file{entries.length === 1 ? '' : 's'} · </span>
                            <span className="text-xs text-[#3A76F0] font-medium">{formatFileSize(totalSize)} uncompressed</span>
                        </div>
                    )}
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                        Click a file to download it individually, or use Extract All. Your browser may ask permission to download multiple files.
                    </p>
                </div>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Reading archive…" />
            ) : !file ? (
                <Dropzone onFilesAdded={handleFilesAdded} acceptedTypes={['.zip', 'application/zip']} />
            ) : (
                <div className="space-y-2">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400 mb-3">
                        <FileArchive className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="text-zinc-200 font-medium truncate max-w-[260px]">{file.name}</span>
                        <span>{formatFileSize(file.size)}</span>
                        <div className="ml-auto flex items-center gap-1.5">
                            <label className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 cursor-pointer transition-colors">
                                <RefreshCw className="w-3 h-3" /> Change file
                                <input
                                    type="file"
                                    accept=".zip,application/zip"
                                    className="hidden"
                                    onChange={(e) => {
                                        const picked = Array.from(e.target.files || []);
                                        if (picked.length) handleFilesAdded(picked);
                                        e.target.value = '';
                                    }}
                                />
                            </label>
                            <button
                                onClick={removeFile}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                                title="Remove file"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    {loadError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                            {loadError}
                        </div>
                    )}
                    {entries.map(entry => (
                        <button
                            key={entry.name}
                            onClick={() => downloadEntry(entry)}
                            className="w-full p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 rounded-lg flex items-center justify-between transition-colors group text-left"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                                <span className="text-sm text-zinc-200 truncate">{entry.name}</span>
                                <span className="text-xs text-zinc-500 shrink-0">{formatFileSize(entry.size)}</span>
                            </div>
                            <Download className="w-4 h-4 text-zinc-600 group-hover:text-[#3A76F0] transition-colors shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </ToolPageLayout>
    );
}
