'use client';

import { useState, useCallback, useEffect, useMemo, CSSProperties } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout, type AppliedChange } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { PDFJS_WORKER_SRC } from '@/lib/pdfjs-config';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface PDFFile {
    name: string;
    file: File;
    size: number;
    pageCount: number;
    pageWidthPt: number;
    pageHeightPt: number;
}

interface PagePreview {
    src: string;
    label: string;
    pageIndex: number; // 0-based index in the document
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

const PREVIEW_COUNT = 3;

export default function PageNumbersPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previews, setPreviews] = useState<PagePreview[]>([]);

    const [position, setPosition] = useState<Position>('bottom-center');
    const [format, setFormat] = useState<NumberFormat>('plain');
    const [fontSize, setFontSize] = useState(10);
    const [margin, setMargin] = useState(30);
    const [startFrom, setStartFrom] = useState(1);
    const [skipFirst, setSkipFirst] = useState(false);

    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(
        file?.name || 'output.pdf', '_numbered'
    );

    const handleFileAdded = useCallback(async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        setIsLoading(true);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        try {
            const arrayBuffer = await f.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();
            const firstPage = pdfDoc.getPage(0);
            const { width, height } = firstPage.getSize();

            setFile({
                name: f.name,
                file: f,
                size: f.size,
                pageCount,
                pageWidthPt: width,
                pageHeightPt: height,
            });

            // Render first 3 pages as thumbnails via pdfjs
            const pdfjs = await import('pdfjs-dist');
            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
            }
            const buf = await f.arrayBuffer();
            const pdfjsDoc = await pdfjs.getDocument({ data: buf }).promise;
            const count = Math.min(PREVIEW_COUNT, pageCount);
            const newPreviews: PagePreview[] = [];

            const labelFor = (idx: number, total: number) => {
                if (total === 1) return 'Page 1';
                if (idx === 0) return 'First Page';
                if (idx === total - 1 && idx < PREVIEW_COUNT) return 'Last Page';
                return `Page ${idx + 1}`;
            };

            for (let i = 0; i < count; i++) {
                const page = await pdfjsDoc.getPage(i + 1);
                const vp = page.getViewport({ scale: 1 });
                const scale = 400 / vp.width;
                const scaledVp = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                canvas.width = scaledVp.width;
                canvas.height = scaledVp.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    await page.render({ canvasContext: ctx, viewport: scaledVp }).promise;
                    newPreviews.push({
                        src: canvas.toDataURL(),
                        label: labelFor(i, pageCount),
                        pageIndex: i,
                    });
                }
            }

            pdfjsDoc.destroy();
            setPreviews(newPreviews);
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

    const removeFile = useCallback(() => {
        setFile(null);
        setPreviews([]);
    }, []);

    const formatPageNumber = (pageNum: number, total: number): string => {
        switch (format) {
            case 'page-x': return `Page ${pageNum}`;
            case 'x-of-y': return `${pageNum} of ${total}`;
            case 'dash': return `— ${pageNum} —`;
            default: return `${pageNum}`;
        }
    };

    /** Get CSS style for the overlaid page number on a preview card */
    const getOverlayStyle = (pageWidthPt: number, pageHeightPt: number): CSSProperties => {
        const marginXPct = (margin / pageWidthPt) * 100;
        const marginYPct = (margin / pageHeightPt) * 100;
        // cqw = 1% of the container's inline (width) size — scales with the card width
        const fontSizeCqw = (fontSize / pageWidthPt) * 100;

        const style: CSSProperties = {
            position: 'absolute',
            fontSize: `${fontSizeCqw}cqw`,
            lineHeight: 1,
            color: '#666',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
        };

        if (position.includes('top')) {
            style.top = `${marginYPct}%`;
        } else {
            style.bottom = `${marginYPct}%`;
        }

        if (position.includes('left')) {
            style.left = `${marginXPct}%`;
        } else if (position.includes('right')) {
            style.right = `${marginXPct}%`;
        } else {
            style.left = '50%';
            style.transform = 'translateX(-50%)';
        }

        return style;
    };

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file');
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

                if (position.includes('left')) {
                    x = margin;
                } else if (position.includes('right')) {
                    x = width - textWidth - margin;
                } else {
                    x = (width - textWidth) / 2;
                }

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
            return { blob, filename: sanitized };
        } catch (err) {
            console.error('Failed to add page numbers:', err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const moreCount = file ? Math.max(0, file.pageCount - PREVIEW_COUNT) : 0;

    const appliedChanges = useMemo<AppliedChange[]>(() => {
        if (!file) return [];
        const list: AppliedChange[] = [];
        if (position !== 'bottom-center') {
            list.push({ id: 'position', description: `Position: ${POSITIONS.find(p => p.value === position)?.label ?? position}`, onUndo: () => setPosition('bottom-center') });
        }
        if (format !== 'plain') {
            list.push({ id: 'format', description: `Format: ${FORMATS.find(f => f.value === format)?.label ?? format}`, onUndo: () => setFormat('plain') });
        }
        if (fontSize !== 10) {
            list.push({ id: 'fontSize', description: `Font size: ${fontSize}pt`, onUndo: () => setFontSize(10) });
        }
        if (margin !== 30) {
            list.push({ id: 'margin', description: `Margin: ${margin}pt`, onUndo: () => setMargin(30) });
        }
        if (startFrom !== 1) {
            list.push({ id: 'startFrom', description: `Start from: ${startFrom}`, onUndo: () => setStartFrom(1) });
        }
        if (skipFirst) {
            list.push({ id: 'skipFirst', description: 'Skip first page', onUndo: () => setSkipFirst(false) });
        }
        return list;
    }, [file, position, format, fontSize, margin, startFrom, skipFirst]);

    const handleReset = useCallback(() => {
        setPosition('bottom-center');
        setFormat('plain');
        setFontSize(10);
        setMargin(30);
        setStartFrom(1);
        setSkipFirst(false);
    }, []);

    return (
        <ToolPageLayout
            title="Add Page Numbers"
            description="Stamp page numbers on every page of your PDF document."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-page-numbers'].about}
            techSetup={toolContent['pdf-page-numbers'].techSetup}
            faqs={toolContent['pdf-page-numbers'].faqs}
            onSave={file ? handleSave : undefined}
            saveDisabled={!file || isProcessing}
            saveLabel="Add Page Numbers"
            appliedChanges={appliedChanges}
            onResetChanges={handleReset}
            isProcessing={isProcessing}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: file.pageCount }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-page-numbers'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-page-numbers'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <div className="space-y-3 mt-3">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Numbering Options</span>

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
                                <span className="text-xs text-[#3A76F0] font-medium">{margin}pt</span>
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
                    </div>
                </>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Importing file…" />
            ) : !file ? (
                <Dropzone
                    onFilesAdded={handleFileAdded}
                    acceptedTypes={['application/pdf']}
                    maxFiles={1}
                />
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key="preview"
                        className="space-y-4"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        {/* Live page previews */}
                        <div className={`grid gap-4 ${previews.length === 1 ? 'grid-cols-1 max-w-xs' : previews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {previews.map((preview) => {
                                const docPageNum = preview.pageIndex + startFrom;
                                const totalDisplayed = file.pageCount - (skipFirst ? 1 : 0) + startFrom - 1;
                                const showNumber = !(skipFirst && preview.pageIndex === 0);

                                return (
                                    <div key={preview.pageIndex} className="space-y-1.5">
                                        <div className="relative bg-white rounded-lg shadow-md overflow-hidden border border-zinc-200/30" style={{ containerType: 'inline-size' }}>
                                            <img
                                                src={preview.src}
                                                alt={preview.label}
                                                className="w-full h-auto block"
                                            />
                                            {showNumber && (
                                                <div style={getOverlayStyle(file.pageWidthPt, file.pageHeightPt)}>
                                                    {formatPageNumber(docPageNum, totalDisplayed)}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 text-center">{preview.label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {moreCount > 0 && (
                            <p className="text-xs text-zinc-600 text-center">
                                + {moreCount} more {moreCount === 1 ? 'page' : 'pages'} not shown
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </ToolPageLayout>
    );
}
