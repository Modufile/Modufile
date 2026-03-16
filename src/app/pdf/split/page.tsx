'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout, type AppliedChange } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { Scissors, Layers, Combine, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadBlob, downloadMultipleAsZip } from '@/lib/core/download';
import { PdfPageSelector } from '@/components/pdf/PdfPageSelector';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

type SplitMode = 'merge' | 'separate' | 'burst';

export default function PDFSplitPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [splitMode, setSplitMode] = useState<SplitMode>('separate');
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const [thumbnailSize, setThumbnailSize] = useState(150);
    const THUMB_MIN = 80, THUMB_MAX = 260, THUMB_STEP = 20;

    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(
        file?.name || 'output.pdf', '_split'
    );

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        setIsLoading(true);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        try {
            const { PDFDocument } = await import('pdf-lib');
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

            // Default: Select all for Split
            const all = new Set<number>();
            for (let i = 0; i < pageCount; i++) all.add(i);
            setSelectedPages(all);

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
    }, []);

    const handlePageToggle = (index: number, isShiftKey: boolean) => {
        const newSelected = new Set(selectedPages);

        if (isShiftKey && lastSelectedIndex !== null) {
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const shouldSelect = !selectedPages.has(index);

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

    const handleSave = async (): Promise<void> => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const { PDFDocument } = await import('pdf-lib');
            const arrayBuffer = await file.file.arrayBuffer();
            const sourceDoc = await PDFDocument.load(arrayBuffer);

            const sortedIndices = Array.from(selectedPages).sort((a, b) => a - b);
            if (sortedIndices.length === 0) return;

            // Mode 1: Burst (One file per selected page)
            if (splitMode === 'burst') {
                const outputFiles: { name: string, blob: Blob }[] = [];

                for (const i of sortedIndices) {
                    const newDoc = await PDFDocument.create();
                    const [copiedPage] = await newDoc.copyPages(sourceDoc, [i]);
                    newDoc.addPage(copiedPage);
                    const bytes = await newDoc.save();
                    const blob = new Blob([bytes as any], { type: 'application/pdf' });
                    outputFiles.push({
                        name: `${sanitized.replace('.pdf', '')}_page_${i + 1}.pdf`,
                        blob
                    });
                }
                await downloadMultipleAsZip(outputFiles, `${sanitized.replace('.pdf', '')}_burst`);
            }
            // Mode 2: Merge (One file for all selected)
            else if (splitMode === 'merge') {
                const newDoc = await PDFDocument.create();
                const copiedPages = await newDoc.copyPages(sourceDoc, sortedIndices);
                copiedPages.forEach(p => newDoc.addPage(p));
                const bytes = await newDoc.save();
                const blob = new Blob([bytes as any], { type: 'application/pdf' });
                downloadBlob(blob, sanitized);
            }
            // Mode 3: Separate (Clusters)
            else if (splitMode === 'separate') {
                // Determine clusters: e.g. [0,1,2, 5,6, 8] -> [[0,1,2], [5,6], [8]]
                const clusters: number[][] = [];
                let currentCluster: number[] = [];
                let prev = -999;

                for (const i of sortedIndices) {
                    if (i === prev + 1) {
                        currentCluster.push(i);
                    } else {
                        if (currentCluster.length > 0) clusters.push(currentCluster);
                        currentCluster = [i];
                    }
                    prev = i;
                }
                if (currentCluster.length > 0) clusters.push(currentCluster);

                if (clusters.length === 1) {
                    // Only one cluster found, just download single PDF
                    const newDoc = await PDFDocument.create();
                    const copiedPages = await newDoc.copyPages(sourceDoc, clusters[0]);
                    copiedPages.forEach(p => newDoc.addPage(p));
                    const bytes = await newDoc.save();
                    const blob = new Blob([bytes as any], { type: 'application/pdf' });
                    downloadBlob(blob, sanitized);
                } else {
                    const outputFiles: { name: string, blob: Blob }[] = [];
                    for (let i = 0; i < clusters.length; i++) {
                        const cluster = clusters[i];
                        const newDoc = await PDFDocument.create();
                        const copiedPages = await newDoc.copyPages(sourceDoc, cluster);
                        copiedPages.forEach(p => newDoc.addPage(p));
                        const bytes = await newDoc.save();
                        const blob = new Blob([bytes as any], { type: 'application/pdf' });

                        // Name: file_pg1-3.pdf
                        const rangeName = cluster.length > 1
                            ? `pg${cluster[0] + 1}-${cluster[cluster.length - 1] + 1}`
                            : `pg${cluster[0] + 1}`;

                        outputFiles.push({
                            name: `${sanitized.replace('.pdf', '')}_${rangeName}.pdf`,
                            blob
                        });
                    }
                    await downloadMultipleAsZip(outputFiles, `${sanitized.replace('.pdf', '')}_split`);
                }
            }

        } catch (error) {
            console.error('Split failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const appliedChanges = useMemo<AppliedChange[]>(() => {
        const list: AppliedChange[] = [];
        if (splitMode !== 'separate') {
            list.push({ id: 'mode', description: `Split mode: ${splitMode}`, onUndo: () => setSplitMode('separate') });
        }
        if (selectedPages.size > 0) {
            list.push({
                id: 'selection',
                description: `${selectedPages.size} page${selectedPages.size !== 1 ? 's' : ''} selected`,
                onUndo: () => setSelectedPages(new Set()),
            });
        }
        return list;
    }, [splitMode, selectedPages]);

    const handleReset = useCallback(() => {
        setSplitMode('separate');
        setSelectedPages(new Set());
    }, []);

    return (
        <ToolPageLayout
            title="Split / Extract PDF"
            description="Split into separate files or extract any selection of pages."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-split'].about}
            techSetup={toolContent['pdf-split'].techSetup}
            faqs={toolContent['pdf-split'].faqs}
            onSave={file && selectedPages.size > 0 ? handleSave : undefined}
            saveDisabled={!file || selectedPages.size === 0 || isProcessing}
            saveLabel="Split / Extract"
            centerControls={
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
            }
            appliedChanges={appliedChanges}
            onResetChanges={handleReset}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: file.pageCount }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-split'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-split'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <div>
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Split Options</span>

                        {/* Mode Selector */}
                        <div className="space-y-3 mt-3">
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => setSplitMode('merge')}
                                    className={`p-3 text-sm rounded-lg border transition-all flex items-start text-left gap-3 ${splitMode === 'merge'
                                        ? 'bg-[#3A76F0]/10 border-[#3A76F0] text-[#3A76F0]'
                                        : 'bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    <Combine className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="block font-medium mb-0.5">Merge Selected</span>
                                        <span className="text-xs opacity-80">Save all selected pages as one single file.</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSplitMode('separate')}
                                    className={`p-3 text-sm rounded-lg border transition-all flex items-start text-left gap-3 ${splitMode === 'separate'
                                        ? 'bg-[#3A76F0]/10 border-[#3A76F0] text-[#3A76F0]'
                                        : 'bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    <Scissors className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="block font-medium mb-0.5">Separate Clusters</span>
                                        <span className="text-xs opacity-80">Save each range (e.g. 1-3, 5-7) as a separate file.</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSplitMode('burst')}
                                    className={`p-3 text-sm rounded-lg border transition-all flex items-start text-left gap-3 ${splitMode === 'burst'
                                        ? 'bg-[#3A76F0]/10 border-[#3A76F0] text-[#3A76F0]'
                                        : 'bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    <Layers className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="block font-medium mb-0.5">Extract All Pages</span>
                                        <span className="text-xs opacity-80">Save every selected page as its own PDF.</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-zinc-500 uppercase font-medium block">
                                    Selected Pages
                                </label>
                                <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                                    {selectedPages.size} / {file?.pageCount || 0}
                                </span>
                            </div>

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
                                        All
                                    </button>
                                    <button
                                        onClick={() => setSelectedPages(new Set())}
                                        className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded border border-zinc-700 transition delay-75"
                                    >
                                        None
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            }
        >
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <FileProcessingOverlay message="Importing file..." />
                ) : !file ? (
                    <Dropzone
                        onFilesAdded={handleFileAdded}
                        acceptedTypes={['application/pdf']}
                        maxFiles={1}
                    />
                ) : (
                    <div className="space-y-4">
                        <motion.div
                            className="space-y-4"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <PdfPageSelector
                                file={file.file}
                                selectedIndices={selectedPages}
                                onToggle={handlePageToggle}
                                mode={splitMode}
                                thumbnailSize={thumbnailSize}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ToolPageLayout>
    );
}
