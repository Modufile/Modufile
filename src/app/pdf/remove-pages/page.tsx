'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout, type AppliedChange } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { PdfPageSelector } from '@/components/pdf/PdfPageSelector';
import { AlertCircle, Eye, EyeOff, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFRemovePagesPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [showThumbnails, setShowThumbnails] = useState(true);
    const [pagesToRemoveText, setPagesToRemoveText] = useState('');
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const [thumbnailSize, setThumbnailSize] = useState(150);
    const THUMB_MIN = 80, THUMB_MAX = 260, THUMB_STEP = 20;

    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(
        file?.name || 'output.pdf', '_edited'
    );

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        setIsLoading(true);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
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
            setSelectedPages(new Set());
            // Auto-disable thumbnails for large files
            setShowThumbnails(pageCount <= 50);
        } catch (error) {
            console.error('Failed to load PDF', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
        setPagesToRemoveText('');
    }, []);

    const handlePageToggle = useCallback((index: number, isShiftKey: boolean) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            if (isShiftKey && lastSelectedIndex !== null) {
                const start = Math.min(lastSelectedIndex, index);
                const end = Math.max(lastSelectedIndex, index);
                for (let i = start; i <= end; i++) {
                    next.add(i);
                }
            } else {
                if (next.has(index)) {
                    next.delete(index);
                } else {
                    next.add(index);
                }
            }
            return next;
        });
        setLastSelectedIndex(index);
    }, [lastSelectedIndex]);

    // Parse text input for page numbers (when thumbnails disabled)
    const parsePages = (input: string, maxPages: number): number[] => {
        const chunks = input.split(',').map(s => s.trim()).filter(Boolean);
        const pages: number[] = [];
        for (const chunk of chunks) {
            if (chunk.includes('-')) {
                const [start, end] = chunk.split('-').map(Number);
                if (start && end) {
                    for (let i = start; i <= end; i++) pages.push(i);
                }
            } else {
                const p = Number(chunk);
                if (p) pages.push(p);
            }
        }
        return pages.filter(p => p >= 1 && p <= maxPages);
    };

    // Sync text input with visual selection
    useEffect(() => {
        if (showThumbnails && selectedPages.size > 0) {
            const sorted = Array.from(selectedPages).map(i => i + 1).sort((a, b) => a - b);
            setPagesToRemoveText(sorted.join(', '));
        }
    }, [selectedPages, showThumbnails]);

    const getEffectivePages = (): number[] => {
        if (showThumbnails) {
            return Array.from(selectedPages);
        }
        return parsePages(pagesToRemoveText, file?.pageCount || 0).map(p => p - 1);
    };

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file');
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();
            const pagesToRemoveList = getEffectivePages();

            if (pagesToRemoveList.length >= totalPages) {
                alert("You cannot remove all pages from the document.");
                setIsProcessing(false);
                throw new Error('Cannot remove all pages');
            }

            pagesToRemoveList
                .sort((a, b) => b - a)
                .forEach(pageIndex => pdfDoc.removePage(pageIndex));

            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            return { blob, filename: sanitized };
        } catch (error) {
            console.error('Remove pages failed:', error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const effectiveCount = getEffectivePages().length;

    const appliedChanges = useMemo<AppliedChange[]>(() => {
        const list: AppliedChange[] = [];
        if (selectedPages.size > 0) {
            list.push({
                id: 'selection',
                description: `${selectedPages.size} page${selectedPages.size !== 1 ? 's' : ''} marked for removal`,
                onUndo: () => setSelectedPages(new Set()),
            });
        }
        return list;
    }, [selectedPages]);

    const handleReset = useCallback(() => {
        setSelectedPages(new Set());
        setPagesToRemoveText('');
    }, []);

    return (
        <ToolPageLayout
            title="Remove Pages"
            description="Delete unwanted pages from your PDF document."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-remove-pages'].about}
            techSetup={toolContent['pdf-remove-pages'].techSetup}
            faqs={toolContent['pdf-remove-pages'].faqs}
            onSave={file && effectiveCount > 0 ? handleSave : undefined}
            saveDisabled={!file || effectiveCount === 0 || isProcessing}
            saveLabel="Remove Pages"
            centerControls={showThumbnails ? (
                <div className="flex items-center gap-1 bg-[#1F1F22] rounded border border-zinc-800/60 p-0.5 h-8">
                    <button
                        onClick={() => setThumbnailSize(s => Math.max(THUMB_MIN, s - THUMB_STEP))}
                        disabled={thumbnailSize <= THUMB_MIN}
                        className="p-1 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
                        title="Smaller thumbnails"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-zinc-400 font-medium w-10 text-center">{thumbnailSize}px</span>
                    <button
                        onClick={() => setThumbnailSize(s => Math.min(THUMB_MAX, s + THUMB_STEP))}
                        disabled={thumbnailSize >= THUMB_MAX}
                        className="p-1 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
                        title="Larger thumbnails"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : undefined}
            appliedChanges={appliedChanges}
            onResetChanges={handleReset}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: (file as any).pageCount }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-remove-pages'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-remove-pages'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <h3 className="text-sm font-medium text-zinc-100">Selection</h3>

                    {file && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500">Thumbnails</span>
                            <button
                                onClick={() => setShowThumbnails(!showThumbnails)}
                                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                {showThumbnails ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                {showThumbnails ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>
                    )}

                    {!showThumbnails && (
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                                Pages to Remove
                            </label>
                            <input
                                type="text"
                                value={pagesToRemoveText}
                                onChange={(e) => setPagesToRemoveText(e.target.value)}
                                placeholder="e.g. 1, 3-5, 8"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0] mb-2"
                            />
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Enter page numbers separated by commas. Ranges like 1-5 are supported.
                            </p>
                        </div>
                    )}

                    {effectiveCount > 0 && file && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-400">
                                {effectiveCount} page{effectiveCount !== 1 ? 's' : ''} will be removed.
                                {file.pageCount - effectiveCount} page{file.pageCount - effectiveCount !== 1 ? 's' : ''} will remain.
                            </p>
                        </div>
                    )}
                </>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Importing file..." />
            ) : !file ? (
                <Dropzone
                    onFilesAdded={handleFileAdded}
                    acceptedTypes={['application/pdf']}
                    maxFiles={1}
                />
            ) : (
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {showThumbnails && (
                        <PdfPageSelector
                            file={file.file}
                            selectedIndices={selectedPages}
                            onToggle={handlePageToggle}
                            mode="merge"
                            variant="exclude"
                            thumbnailSize={thumbnailSize}
                        />
                    )}
                </motion.div>
            )}
        </ToolPageLayout>
    );
}
