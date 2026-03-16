'use client';

import { FileText, Image as ImageIcon, FileCode2, Trash2, Plus, UploadCloud, X } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { useRef } from 'react';

export interface FileMetadata {
    name: string;
    size: number;
    type?: string;
    pageCount?: number;
}

interface ImportedFilesPanelProps {
    files: FileMetadata[];
    onRemoveFile: (index: number) => void;
    onAddFiles?: (files: File[]) => void;
    onClearAll?: () => void;
    acceptsMultipleFiles?: boolean;
    acceptedFileTypes?: string[];
}

export function ImportedFilesPanel({
    files,
    onRemoveFile,
    onAddFiles,
    onClearAll,
    acceptsMultipleFiles = false,
    acceptedFileTypes = ['application/pdf'],
}: ImportedFilesPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && onAddFiles) {
            onAddFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getFileIcon = (name: string, type?: string) => {
        const lowerName = name.toLowerCase();
        const lowerType = type?.toLowerCase() || '';
        if (lowerName.endsWith('.pdf') || lowerType.includes('pdf')) {
            return <FileText className="w-3.5 h-3.5 text-zinc-500" />;
        }
        if (lowerName.match(/\.(jpg|jpeg|png|webp|avif|heic|bmp|tiff)$/) || lowerType.startsWith('image/')) {
            return <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />;
        }
        return <FileCode2 className="w-3.5 h-3.5 text-zinc-500" />;
    };

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Imported Files</span>
                    <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        {files.length}
                    </span>
                </div>
                {onClearAll && files.length > 1 && (
                    <button
                        onClick={onClearAll}
                        className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:opacity-80"
                        style={{ color: '#A6192E' }}
                    >
                        <X className="w-3 h-3" />
                        Clear All
                    </button>
                )}
            </div>

            {files.length === 0 ? (
                <div className="text-center py-5 border border-dashed border-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500">No files imported yet.</p>
                </div>
            ) : (
                <div className="overflow-y-auto" style={{ maxHeight: '144px' }}>
                    {files.map((file, idx) => (
                        <div
                            key={`${file.name}-${idx}`}
                            className={`flex items-center gap-2 py-1.5 group ${idx < files.length - 1 ? 'border-b border-zinc-800/30' : ''}`}
                        >
                            <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800/80">
                                {getFileIcon(file.name, file.type)}
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col">
                                <span className="text-xs font-medium text-zinc-200 truncate" title={file.name}>
                                    {file.name}
                                </span>
                                <span className="text-[10px] text-zinc-500 truncate">
                                    {formatFileSize(file.size)}
                                    {file.pageCount ? ` • ${file.pageCount} pg${file.pageCount !== 1 ? 's' : ''}` : ''}
                                </span>
                            </div>
                            <button
                                onClick={() => onRemoveFile(idx)}
                                className="p-1.5 min-w-[28px] shrink-0 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                                title="Remove file"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {onAddFiles && (acceptsMultipleFiles || files.length === 0) && (
                <>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept={acceptedFileTypes.join(',')}
                        multiple={acceptsMultipleFiles}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-8 flex items-center justify-center gap-2 rounded border border-dashed border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800 hover:border-zinc-600 text-xs text-zinc-300 transition-colors mt-2"
                    >
                        {files.length === 0 ? (
                            <>
                                <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Browse Files</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Add more files</span>
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
    );
}
