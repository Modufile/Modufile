'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface PDFFile {
    name: string;
    file: File;
    size: number;
    pageCount: number;
}

type Position = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
type NumberFormat = 'plain' | 'page-x' | 'x-of-y' | 'dash';

const POSITIONS: { value: Position; label: string }[] = [
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
];

const FORMATS: { value: NumberFormat; label: string; example: string }[] = [
    { value: 'plain', label: 'Plain Number', example: '1' },
    { value: 'page-x', label: 'Page X', example: 'Page 1' },
    { value: 'x-of-y', label: 'X of Y', example: '1 of 10' },
    { value: 'dash', label: '— X —', example: '— 1 —' },
];

export default function PageNumbersPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [position, setPosition] = useState<Position>('bottom-center');
    const [format, setFormat] = useState<NumberFormat>('plain');
    const [fontSize, setFontSize] = useState(10);
    const [margin, setMargin] = useState(30);
    const [startFrom, setStartFrom] = useState(1);
    const [skipFirst, setSkipFirst] = useState(false);

    const handleFileAdded = useCallback(async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        setIsLoading(true);
        try {
            const arrayBuffer = await f.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            setFile({
                name: f.name,
                file: f,
                size: f.size,
                pageCount: pdfDoc.getPageCount(),
            });
        } catch (err) {
            console.error('Failed to load PDF:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            const pdfs = storedFiles.filter(f => f.type === 'application/pdf');
            if (pdfs.length > 0) handleFileAdded(pdfs);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    const removeFile = useCallback(() => setFile(null), []);

    const formatPageNumber = (pageNum: number, total: number): string => {
        switch (format) {
            case 'page-x': return `Page ${pageNum}`;
            case 'x-of-y': return `${pageNum} of ${total}`;
            case 'dash': return `— ${pageNum} —`;
            default: return `${pageNum}`;
        }
    };

    const handleSave = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();
            const total = pages.length;

            for (let i = 0; i < pages.length; i++) {
                if (skipFirst && i === 0) continue;

                const page = pages[i];
                const { width, height } = page.getSize();
                const num = i + startFrom;
                const text = formatPageNumber(num, total - (skipFirst ? 1 : 0) + startFrom - 1);
                const textWidth = font.widthOfTextAtSize(text, fontSize);

                let x: number;
                let y: number;

                // Compute X position
                if (position.includes('left')) {
                    x = margin;
                } else if (position.includes('right')) {
                    x = width - textWidth - margin;
                } else {
                    x = (width - textWidth) / 2;
                }

                // Compute Y position
                if (position.includes('top')) {
                    y = height - margin;
                } else {
                    y = margin;
                }

                page.drawText(text, {
                    x,
                    y,
                    size: fontSize,
                    font,
                    color: rgb(0.4, 0.4, 0.4),
                });
            }

            const bytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            downloadBlob(blob, file.name.replace('.pdf', '_numbered.pdf'));
        } catch (err) {
            console.error('Failed to add page numbers:', err);
            alert('Failed to process PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Add Page Numbers"
            description="Stamp page numbers on every page of your PDF document."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-page-numbers'].about}
            techSetup={toolContent['pdf-page-numbers'].techSetup}
            faqs={toolContent['pdf-page-numbers'].faqs}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Numbering Options</h3>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Position</label>
                        <select
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                            value={position}
                            onChange={(e) => setPosition(e.target.value as Position)}
                        >
                            {POSITIONS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Format</label>
                        <div className="space-y-2">
                            {FORMATS.map(f => (
                                <label key={f.value} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="format"
                                        value={f.value}
                                        checked={format === f.value}
                                        onChange={() => setFormat(f.value)}
                                        className="accent-[#3A76F0]"
                                    />
                                    <span className="text-sm text-zinc-300 group-hover:text-white">{f.label}</span>
                                    <span className="text-xs text-zinc-600 ml-auto">{f.example}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs text-zinc-500 uppercase font-medium">Font Size</label>
                            <span className="text-xs text-[#3A76F0] font-medium">{fontSize}pt</span>
                        </div>
                        <input
                            type="range"
                            min="6"
                            max="24"
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="w-full accent-[#3A76F0]"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs text-zinc-500 uppercase font-medium">Margin</label>
                            <span className="text-xs text-[#3A76F0] font-medium">{margin}px</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="80"
                            value={margin}
                            onChange={(e) => setMargin(Number(e.target.value))}
                            className="w-full accent-[#3A76F0]"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Start From</label>
                        <input
                            type="number"
                            min="1"
                            value={startFrom}
                            onChange={(e) => setStartFrom(Math.max(1, Number(e.target.value)))}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={skipFirst}
                            onChange={(e) => setSkipFirst(e.target.checked)}
                            className="accent-[#3A76F0] rounded"
                        />
                        <span className="text-sm text-zinc-300">Skip first page (title page)</span>
                    </label>

                    {/* Position Visualizer */}
                    {file && (
                        <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                            <p className="text-xs text-zinc-500 mb-3 text-center">Preview Position</p>
                            <div className="relative w-full aspect-[1/1.4] bg-white rounded shadow-sm mx-auto max-w-[120px]">
                                <div
                                    className={`absolute text-[8px] font-medium text-zinc-500 ${position.includes('top') ? 'top-1.5' : 'bottom-1.5'
                                        } ${position.includes('left') ? 'left-1.5' :
                                            position.includes('right') ? 'right-1.5' :
                                                'left-1/2 -translate-x-1/2'
                                        }`}
                                >
                                    {formatPageNumber(1, file.pageCount)}
                                </div>
                            </div>
                        </div>
                    )}
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
            )}

            <FloatingActionBar
                isVisible={!!file}
                isProcessing={isProcessing}
                onAction={handleSave}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Add Page Numbers
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
