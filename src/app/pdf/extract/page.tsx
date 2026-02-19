'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, FolderInput } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { PDFDocument } from 'pdf-lib';
import { PdfPageSelector } from '@/components/pdf/PdfPageSelector';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFExtractPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        setIsLoading(true);

        try {
            const arrayBuffer = await uploadedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();

            setFile({
                id: crypto.randomUUID(),
                file: uploadedFile,
                name: uploadedFile.name,
                size: uploadedFile.size,
                pageCount
            });
            // Default: empty selection (extract means picking specific pages)
            setSelectedPages(new Set());
        } catch (error) {
            console.error('Failed to load PDF', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check for files coming from homepage dropzone
    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFileAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    const removeFile = useCallback(() => {
        setFile(null);
        setSelectedPages(new Set());
    }, []);

    const handlePageToggle = (index: number, isShiftKey: boolean) => {
        const newSelected = new Set(selectedPages);

        if (isShiftKey && lastSelectedIndex !== null) {
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const shouldSelect = !selectedPages.has(index);

            // Range logic: force state of target to range
            for (let i = start; i <= end; i++) {
                if (shouldSelect) newSelected.add(i);
                else newSelected.delete(i);
            }
        } else {
            if (newSelected.has(index)) {
                newSelected.delete(index);
            } else {
                newSelected.add(index);
            }
        }

        setSelectedPages(newSelected);
        setLastSelectedIndex(index);
    };

    const handleExtract = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const sourceDoc = await PDFDocument.load(arrayBuffer);
            const indices = Array.from(selectedPages).sort((a, b) => a - b);

            if (indices.length === 0) return;

            const newDoc = await PDFDocument.create();
            const copiedPages = await newDoc.copyPages(sourceDoc, indices);
            copiedPages.forEach(p => newDoc.addPage(p));

            const bytes = await newDoc.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            downloadBlob(blob, `extracted_${file.name}`);

        } catch (error) {
            console.error('Extraction failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Extract Pages"
            description="Create a new PDF containing only specific pages from your document."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-extract'].about}
            techSetup={toolContent['pdf-extract'].techSetup}
            faqs={toolContent['pdf-extract'].faqs}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Selection</h3>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-500 uppercase font-medium block">
                                Selected Pages
                            </label>
                            <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                                {selectedPages.size} / {file?.pageCount || 0}
                            </span>
                        </div>

                        <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                            Click thumbnails to select. Hold Shift for ranges.
                        </p>

                        {file && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const all = new Set<number>();
                                        for (let i = 0; i < file.pageCount; i++) all.add(i);
                                        setSelectedPages(all);
                                    }}
                                    className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded border border-zinc-700 transition delay-75"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={() => setSelectedPages(new Set())}
                                    className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded border border-zinc-700 transition delay-75"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Reading PDF pages…" />
            ) : !file ? (
                <Dropzone
                    onFilesAdded={handleFileAdded}
                    acceptedTypes={['application/pdf']}
                    maxFiles={1}
                />
            ) : (
                <div className="space-y-4">
                    <motion.div
                        className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-medium text-zinc-100">{file.name}</h3>
                                <p className="text-sm text-zinc-500">
                                    {formatFileSize(file.size)} • {file.pageCount} pages
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-500 hover:text-red-500" />
                        </button>
                    </motion.div>

                    <PdfPageSelector
                        file={file.file}
                        selectedIndices={selectedPages}
                        onToggle={handlePageToggle}
                        mode="merge"
                    />
                </div>
            )}

            <FloatingActionBar
                isVisible={!!file && selectedPages.size > 0}
                isProcessing={isProcessing}
                onAction={handleExtract}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <FolderInput className="w-4 h-4" />
                        Extract {selectedPages.size} Page{selectedPages.size !== 1 ? 's' : ''}
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
