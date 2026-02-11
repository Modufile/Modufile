'use client';

import { useState, useCallback } from 'react';
import { Dropzone } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, FolderInput } from 'lucide-react';
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

export default function PDFExtractPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pagesToExtract, setPagesToExtract] = useState('');

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
        setPagesToExtract('');
    }, []);

    // Helper to parse "1-3, 5" into [0, 1, 2, 4]
    const parsePages = (input: string, maxPages: number): number[] => {
        const chunks = input.split(',').map(s => s.trim()).filter(Boolean);
        const indices: number[] = [];

        for (const chunk of chunks) {
            if (chunk.includes('-')) {
                const [start, end] = chunk.split('-').map(Number);
                if (start && end) {
                    for (let i = start; i <= end; i++) indices.push(i - 1);
                }
            } else {
                const p = Number(chunk);
                if (p) indices.push(p - 1);
            }
        }

        // Deduplicate and filter valid
        return Array.from(new Set(indices)).filter(i => i >= 0 && i < maxPages).sort((a, b) => a - b);
    };

    const handleExtract = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const sourceDoc = await PDFDocument.load(arrayBuffer);
            const indices = parsePages(pagesToExtract, file.pageCount);

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
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Selection</h3>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                            Pages to Keep
                        </label>
                        <input
                            type="text"
                            value={pagesToExtract}
                            onChange={(e) => setPagesToExtract(e.target.value)}
                            placeholder="e.g. 1-5, 8"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0] mb-2"
                        />
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Only these pages will be included in the new file.
                        </p>
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
                isVisible={!!file && pagesToExtract.length > 0}
                isProcessing={isProcessing}
                onAction={handleExtract}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <FolderInput className="w-4 h-4" />
                        Extract Pages
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
