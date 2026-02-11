'use client';

import { useState, useCallback } from 'react';
import { Dropzone } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Scissors, Layers, Copy } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob, downloadMultipleAsZip } from '@/lib/core/download';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFSplitPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageRange, setPageRange] = useState('');
    const [splitMode, setSplitMode] = useState<'extract' | 'burst'>('extract');

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        // Load page count
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
            // Default range: all pages
            setPageRange(`1-${pageCount}`);
        } catch (error) {
            console.error('Failed to load PDF', error);
        }
    }, []);

    const removeFile = useCallback(() => {
        setFile(null);
        setPageRange('');
    }, []);

    const parseRanges = (rangeStr: string, maxPages: number): number[][] => {
        // Returns array of arrays of zero-based page indices
        // e.g. "1-2, 4" -> [[0, 1], [3]]

        const chunks = rangeStr.split(',').map(s => s.trim()).filter(Boolean);
        const ranges: number[][] = [];

        for (const chunk of chunks) {
            const indices: number[] = [];
            if (chunk.includes('-')) {
                const [start, end] = chunk.split('-').map(Number);
                if (start && end) {
                    for (let i = start; i <= end; i++) indices.push(i - 1);
                }
            } else {
                const page = Number(chunk);
                if (page) indices.push(page - 1);
            }
            // Filter out-of-bounds
            const validIndices = indices.filter(i => i >= 0 && i < maxPages);
            if (validIndices.length > 0) ranges.push(validIndices);
        }

        return ranges;
    };


    const handleSplit = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const { PDFDocument } = await import('pdf-lib');
            const arrayBuffer = await file.file.arrayBuffer();
            const sourceDoc = await PDFDocument.load(arrayBuffer);

            // Mode 1: Burst (Every page becomes a separate PDF)
            if (splitMode === 'burst') {
                const outputFiles: { name: string, blob: Blob }[] = [];
                const pageCount = sourceDoc.getPageCount();

                for (let i = 0; i < pageCount; i++) {
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
            // Mode 2: Extract (Specific ranges)
            else {
                const ranges = parseRanges(pageRange, file.pageCount);
                if (ranges.length === 0) return;

                const newDoc = await PDFDocument.create();
                // Flatten all indices from all ranges into one new doc
                const allIndices = ranges.flat();
                // Remove duplicates if any? Standard behavior is to keep them if user asked for "1,1"

                const copiedPages = await newDoc.copyPages(sourceDoc, allIndices);
                copiedPages.forEach(page => newDoc.addPage(page));

                const bytes = await newDoc.save();
                const blob = new Blob([bytes as any], { type: 'application/pdf' });
                downloadBlob(blob, `split_${file.name}`);
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
            description="Extract pages from your PDF or save each page as a separate document."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Split Options</h3>

                    {/* Mode Selector */}
                    <div className="space-y-3">
                        <label className="text-xs text-zinc-500 uppercase font-medium">Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setSplitMode('extract')}
                                className={`p-3 text-sm rounded-lg border transition-all ${splitMode === 'extract'
                                    ? 'bg-[#3A76F0]/10 border-[#3A76F0] text-[#3A76F0]'
                                    : 'bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Scissors className="w-5 h-5" />
                                    <span>Extract</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setSplitMode('burst')}
                                className={`p-3 text-sm rounded-lg border transition-all ${splitMode === 'burst'
                                    ? 'bg-[#3A76F0]/10 border-[#3A76F0] text-[#3A76F0]'
                                    : 'bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Layers className="w-5 h-5" />
                                    <span>Burst All</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Range Input (Only for Extract mode) */}
                    {splitMode === 'extract' && (
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 uppercase font-medium">Page Ranges</label>
                            <input
                                type="text"
                                value={pageRange}
                                onChange={(e) => setPageRange(e.target.value)}
                                placeholder="e.g. 1-5, 8, 11-13"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                            />
                            <p className="text-xs text-zinc-500">
                                Enter page numbers/ranges separated by commas.
                            </p>
                        </div>
                    )}
                </div>
            }
        >
            {/* File Drop/Preview Area */}
            {!file ? (
                <Dropzone
                    onFilesAdded={handleFileAdded}
                    acceptedTypes={['application/pdf']}
                    maxFiles={1}
                />
            ) : (
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
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
                </div>
            )}

            <FloatingActionBar
                isVisible={!!file}
                isProcessing={isProcessing}
                onAction={handleSplit}
                actionLabel={
                    <div className="flex items-center gap-2">
                        {splitMode === 'extract' ? <Copy className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                        {splitMode === 'extract' ? 'Extract Pages' : 'Burst All Pages'}
                    </div>
                }
                subtitle={splitMode === 'burst' ? `Creates ${file?.pageCount} files` : undefined}
            />
        </ToolPageLayout>
    );
}
