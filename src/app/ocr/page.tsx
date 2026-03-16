'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { Image as ImageIcon, X, FileText, Copy, Download, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import Tesseract from 'tesseract.js';

interface ImageFile {
    id: string;
    file: File;
    name: string;
    size: number;
    preview?: string;
    text?: string;
    progress?: number;
    status: 'pending' | 'processing' | 'completed' | 'error';
}

export default function OCRPage() {
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [language, setLanguage] = useState('eng');

    const handleFilesAdded = useCallback((newFiles: File[]) => {
        const imageFiles = newFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            status: 'pending' as const
        }));
        setFiles(prev => [...prev, ...imageFiles]);
    }, []);

    // Check for files coming from homepage dropzone
    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFilesAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFilesAdded, setStoredFiles]);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file?.preview) URL.revokeObjectURL(file.preview);
            return prev.filter(f => f.id !== id);
        });
    }, []);

    const processFile = async (id: string) => {
        const file = files.find(f => f.id === id);
        if (!file || file.status === 'processing' || file.status === 'completed') return;

        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing', progress: 0 } : f));

        try {
            const result = await Tesseract.recognize(
                file.file,
                language,
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: m.progress * 100 } : f));
                        }
                    }
                }
            );

            setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'completed', text: result.data.text } : f));

        } catch (error) {
            console.error('OCR Error:', error);
            setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error' } : f));
        }
    };

    const handleRunAll = async () => {
        setIsProcessing(true);
        // Sequential to avoid browser lag, but could be parallel
        for (const f of files) {
            if (f.status === 'pending') {
                await processFile(f.id);
            }
        }
        setIsProcessing(false);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const handleDownload = (text: string, filename: string) => {
        const blob = new Blob([text], { type: 'text/plain' });
        downloadBlob(blob, `${filename}.txt`);
    };

    return (
        <ToolPageLayout
            title="Image to Text (OCR)"
            description="Extract text from images using optical character recognition."
            parentCategory="Tools"
            parentHref="/"
            about={toolContent['ocr'].about}
            techSetup={toolContent['ocr'].techSetup}
            faqs={toolContent['ocr'].faqs}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={files.map(f => ({ name: f.name, size: f.size, pageCount: (f as any).pageCount }))}
                    onRemoveFile={(idx) => removeFile(files[idx].id)}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles={toolContent['ocr'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['ocr'].acceptedFileTypes}
                />
            }
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Settings</h3>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Language</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        >
                            <option value="eng">English</option>
                            <option value="spa">Spanish</option>
                            <option value="fra">French</option>
                            <option value="deu">German</option>
                            <option value="chi_sim">Chinese (Simplified)</option>
                            <option value="jpn">Japanese</option>
                        </select>
                    </div>

                    <div className="p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-500">
                        Higher resolution images yield better results. Tesseract runs entirely in your browser.
                    </div>
                </div>
            }
        >
            {files.length === 0 ? (
                <Dropzone onFilesAdded={handleFilesAdded} acceptedTypes={['image/*']} />
            ) : (
                <div className="space-y-6">
                    {files.map(file => (
                        <div key={file.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded overflow-hidden">
                                        {file.preview ? (
                                            <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-blue-500 m-2" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-zinc-100">{file.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500">{formatFileSize(file.size)}</span>
                                            {file.status === 'processing' && (
                                                <span className="text-xs text-[#3A76F0] flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    {Math.round(file.progress || 0)}%
                                                </span>
                                            )}
                                            {file.status === 'completed' && <span className="text-xs text-green-500">Done</span>}
                                            {file.status === 'error' && <span className="text-xs text-red-500">Failed</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {file.status === 'completed' && file.text && (
                                        <>
                                            <button
                                                onClick={() => handleCopy(file.text!)}
                                                className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                                                title="Copy"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(file.text!, file.name)}
                                                className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => removeFile(file.id)}
                                        className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Result Area */}
                            {file.status === 'completed' && file.text && (
                                <div className="relative group">
                                    <pre className="w-full h-64 bg-[#0c0c0c] p-6 text-sm text-zinc-300 font-mono overflow-auto whitespace-pre-wrap outline-none border-t border-zinc-800">
                                        {file.text}
                                    </pre>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button
                                            onClick={() => handleCopy(file.text!)}
                                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded shadow-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
                                        >
                                            <Copy className="w-3 h-3" />
                                            Copy Text
                                        </button>
                                    </div>
                                    <div className="absolute bottom-2 right-4 text-xs text-zinc-600 font-mono pointer-events-none">
                                        {file.text.length} chars
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={() => document.getElementById('add-more-ocr')?.click()}
                        className="w-full p-4 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-sm"
                    >
                        + Add more images
                        <input
                            id="add-more-ocr"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFilesAdded(Array.from(e.target.files || []))}
                        />
                    </button>
                </div>
            )}

            <FloatingActionBar
                isVisible={files.length > 0 && files.some(f => f.status === 'pending')}
                isProcessing={isProcessing}
                onAction={handleRunAll}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Recognize Text
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
