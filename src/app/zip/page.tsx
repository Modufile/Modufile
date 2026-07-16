'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { formatFileSize } from '@/lib/core/format';
import { createZip, type ZipLevel } from '@/lib/core/archive';
import { FileArchive, X } from 'lucide-react';

interface StagedFile {
    id: string;
    file: File;
    name: string;
    size: number;
}

export default function CreateZipPage() {
    const [files, setFiles] = useState<StagedFile[]>([]);
    const [level, setLevel] = useState<ZipLevel>(6);
    const [isProcessing, setIsProcessing] = useState(false);

    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename('archive.zip', '');

    const handleFilesAdded = useCallback((newFiles: File[]) => {
        setFiles(prev => [
            ...prev,
            ...newFiles.map(file => ({
                id: crypto.randomUUID(),
                file,
                name: file.name,
                size: file.size,
            })),
        ]);
    }, []);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFilesAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFilesAdded, setStoredFiles]);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (files.length === 0) throw new Error('No files');
        setIsProcessing(true);
        try {
            const entries = await Promise.all(
                files.map(async f => ({
                    name: f.name,
                    data: new Uint8Array(await f.file.arrayBuffer()),
                })),
            );
            const blob = await createZip(entries, level);
            return { blob, filename: sanitized.endsWith('.zip') ? sanitized : `${sanitized}.zip` };
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Create ZIP"
            description="Bundle files into a ZIP archive — compressed locally, never uploaded."
            parentCategory="Archive Tools"
            parentHref="/"
            about={toolContent['zip-create'].about}
            techSetup={toolContent['zip-create'].techSetup}
            faqs={toolContent['zip-create'].faqs}
            onSave={files.length > 0 ? handleSave : undefined}
            saveDisabled={files.length === 0 || isProcessing}
            saveLabel="Create ZIP"
            isProcessing={isProcessing}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={files.map(f => ({ name: f.name, size: f.size }))}
                    onRemoveFile={(idx) => removeFile(files[idx].id)}
                    onClearAll={files.length > 1 ? () => setFiles([]) : undefined}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles
                    acceptedFileTypes={['*/*']}
                />
            }
            sidebar={
                <div className="space-y-5 mt-3">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Compression</span>
                        <select
                            value={level}
                            onChange={(e) => setLevel(Number(e.target.value) as ZipLevel)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        >
                            <option value={6}>Balanced (recommended)</option>
                            <option value={9}>Smallest file (slower)</option>
                            <option value={0}>Store only (fastest)</option>
                        </select>
                        <p className="text-[11px] text-zinc-600 leading-relaxed">
                            Already-compressed files (JPG, MP4, ZIP) barely shrink — &quot;Store only&quot; is fastest for those.
                        </p>
                    </div>

                    {files.length > 0 && (
                        <div className="px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
                            <span className="text-xs text-zinc-500">{files.length} file{files.length === 1 ? '' : 's'} · </span>
                            <span className="text-xs text-[#3A76F0] font-medium">{formatFileSize(totalSize)}</span>
                        </div>
                    )}
                </div>
            }
        >
            {files.length === 0 ? (
                <Dropzone onFilesAdded={handleFilesAdded} acceptedTypes={['*/*']} />
            ) : (
                <div className="space-y-2">
                    {files.map(f => (
                        <div key={f.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileArchive className="w-4 h-4 text-zinc-500 shrink-0" />
                                <span className="text-sm text-zinc-200 truncate">{f.name}</span>
                                <span className="text-xs text-zinc-500 shrink-0">{formatFileSize(f.size)}</span>
                            </div>
                            <button
                                onClick={() => removeFile(f.id)}
                                className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors shrink-0"
                                aria-label={`Remove ${f.name}`}
                            >
                                <X className="w-4 h-4 text-zinc-500 hover:text-red-500" />
                            </button>
                        </div>
                    ))}
                    <label className="block w-full p-4 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-sm text-center cursor-pointer">
                        + Add more files
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFilesAdded(Array.from(e.target.files || []))}
                        />
                    </label>
                </div>
            )}
        </ToolPageLayout>
    );
}
