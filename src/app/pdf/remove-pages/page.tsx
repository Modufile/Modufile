'use client';

import { useState, useCallback } from 'react';
import { Dropzone } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Trash2, AlertCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
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
    const [pagesToRemove, setPagesToRemove] = useState('');

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

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
        } catch (error) {
            console.error('Failed to load PDF', error);
        }
    }, []);

    const removeFile = useCallback(() => {
        setFile(null);
        setPagesToRemove('');
    }, []);

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

    const handleRemove = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            // Get indices to remove (0-based)
            const pagesToRemoveList = parsePages(pagesToRemove, totalPages).map(p => p - 1);

            // Validate we aren't removing ALL pages
            if (pagesToRemoveList.length >= totalPages) {
                alert("You cannot remove all pages from the document.");
                setIsProcessing(false);
                return;
            }

            // pdf-lib's removePage re-indexes pages after each removal
            // So we must remove in descending order of index
            pagesToRemoveList
                .sort((a, b) => b - a)
                .forEach(pageIndex => {
                    pdfDoc.removePage(pageIndex);
                });

            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            downloadBlob(blob, `edited_${file.name}`);

        } catch (error) {
            console.error('Remove pages failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Remove Pages"
            description="Delete unwanted pages from your PDF document."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Selection</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                                Pages to Remove
                            </label>
                            <input
                                type="text"
                                value={pagesToRemove}
                                onChange={(e) => setPagesToRemove(e.target.value)}
                                placeholder="e.g. 1, 3-5, 8"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0] mb-2"
                            />
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Enter page numbers separated by commas. Ranges like 1-5 are supported.
                            </p>
                        </div>

                        {pagesToRemove && file && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-red-400">
                                    Selected pages will be permanently deleted from the output file.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            }
        >
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
                isVisible={!!file && pagesToRemove.length > 0}
                isProcessing={isProcessing}
                onAction={handleRemove}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Remove Selected Pages
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
