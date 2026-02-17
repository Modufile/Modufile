'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolFaqs } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Scissors, Layers, Copy, Combine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
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

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        setIsLoading(true);

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

    const handleSplit = async () => {
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
                        name: `${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`,
                        blob
                    });
                }
                await downloadMultipleAsZip(outputFiles, `${file.name.replace('.pdf', '')}_burst`);
            }
            // Mode 2: Merge (One file for all selected)
            else if (splitMode === 'merge') {
                const newDoc = await PDFDocument.create();
                const copiedPages = await newDoc.copyPages(sourceDoc, sortedIndices);
                copiedPages.forEach(p => newDoc.addPage(p));
                const bytes = await newDoc.save();
                const blob = new Blob([bytes as any], { type: 'application/pdf' });
                downloadBlob(blob, `split_${file.name}`);
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
                    downloadBlob(blob, `split_${file.name}`);
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
                            name: `${file.name.replace('.pdf', '')}_${rangeName}.pdf`,
                            blob
                        });
                    }
                    await downloadMultipleAsZip(outputFiles, `${file.name.replace('.pdf', '')}_split`);
                }
            }

        } catch (error) {
            console.error('Split failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Split PDF"
            description="Break your PDF into smaller documents by selecting pages."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            faqs={toolFaqs['pdf-split']}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Split Options</h3>

                    {/* Mode Selector */}
                    <div className="space-y-3">
                        <label className="text-xs text-zinc-500 uppercase font-medium">Output Mode</label>
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
                                    <span className="block font-medium mb-0.5">Burst All</span>
                                    <span className="text-xs opacity-80">Save every selected page as its own PDF.</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div>
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
            }
        >
            <AnimatePresence mode="wait">
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
                            mode={splitMode}
                        />
                    </div>
                )}
            </AnimatePresence>

            <FloatingActionBar
                isVisible={!!file && selectedPages.size > 0}
                isProcessing={isProcessing}
                onAction={handleSplit}
                actionLabel={
                    <div className="flex items-center gap-2">
                        {splitMode === 'merge' && <Combine className="w-4 h-4" />}
                        {splitMode === 'separate' && <Scissors className="w-4 h-4" />}
                        {splitMode === 'burst' && <Layers className="w-4 h-4" />}

                        {splitMode === 'merge' && 'Merge Selected'}
                        {splitMode === 'separate' && 'Separate Clusters'}
                        {splitMode === 'burst' && 'Burst Pages'}
                    </div>
                }
                subtitle={
                    splitMode === 'burst'
                        ? `Creates ${selectedPages.size} files`
                        : splitMode === 'separate'
                            ? 'Creates files for each group' // could calculate number of clusters if needed
                            : 'Creates 1 file'
                }
            />
        </ToolPageLayout>
    );
}
