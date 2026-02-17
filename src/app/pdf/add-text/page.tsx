'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dropzone, FileProcessingOverlay, Logo } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolFaqs } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Type, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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

interface TextAnnotation {
    id: string;
    pageIndex: number;
    x: number;
    y: number;
    text: string;
    fontSize: number;
    fontName: string;
    color: string;
}

const WORKER_SRC = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const FONT_OPTIONS = [
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'TimesRoman', label: 'Times Roman' },
    { value: 'Courier', label: 'Courier' },
    { value: 'Helvetica-Bold', label: 'Helvetica Bold' },
    { value: 'TimesRoman-Bold', label: 'Times Bold' },
    { value: 'Courier-Bold', label: 'Courier Bold' },
];

const fontNameMap: Record<string, typeof StandardFonts[keyof typeof StandardFonts]> = {
    'Helvetica': StandardFonts.Helvetica,
    'TimesRoman': StandardFonts.TimesRoman,
    'Courier': StandardFonts.Courier,
    'Helvetica-Bold': StandardFonts.HelveticaBold,
    'TimesRoman-Bold': StandardFonts.TimesRomanBold,
    'Courier-Bold': StandardFonts.CourierBold,
};

export default function AddTextPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [textFontSize, setTextFontSize] = useState(16);
    const [textFont, setTextFont] = useState('Helvetica');
    const [textColor, setTextColor] = useState('#000000');
    const [pageRendered, setPageRendered] = useState(false);
    const [isPlacing, setIsPlacing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const pdfDocRef = useRef<any>(null);
    const pageScaleRef = useRef(1);

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
            setCurrentPage(0);
            setAnnotations([]);
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

    // Render current page
    useEffect(() => {
        if (!file) return;
        let cancelled = false;

        const render = async () => {
            setPageRendered(false);
            const pdfjs = await import('pdfjs-dist');
            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
            }

            if (!pdfDocRef.current) {
                const buf = await file.file.arrayBuffer();
                pdfDocRef.current = await pdfjs.getDocument({ data: buf }).promise;
            }

            const page = await pdfDocRef.current.getPage(currentPage + 1);
            const viewport = page.getViewport({ scale: 1.5 });
            pageScaleRef.current = 1.5;

            const canvas = canvasRef.current;
            if (!canvas || cancelled) return;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            await page.render({ canvasContext: ctx, viewport }).promise;
            if (!cancelled) setPageRendered(true);
        };

        render();
        return () => { cancelled = true; };
    }, [file, currentPage]);

    const removeFile = useCallback(() => {
        setFile(null);
        pdfDocRef.current?.destroy();
        pdfDocRef.current = null;
    }, []);

    // Click on canvas to place text
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!overlayRef.current || !isPlacing) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newAnnotation: TextAnnotation = {
            id: crypto.randomUUID(),
            pageIndex: currentPage,
            x, y,
            text: 'Double-click to edit',
            fontSize: textFontSize,
            fontName: textFont,
            color: textColor,
        };

        setAnnotations(prev => [...prev, newAnnotation]);
        setSelectedId(newAnnotation.id);
        setIsPlacing(false);
    };

    const updateAnnotation = (id: string, updates: Partial<TextAnnotation>) => {
        setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    const removeAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const currentPageAnnotations = annotations.filter(a => a.pageIndex === currentPage);

    const handleSave = async () => {
        if (!file || annotations.length === 0) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const scale = pageScaleRef.current;

            const hexToRgb = (hex: string) => {
                const r = parseInt(hex.slice(1, 3), 16) / 255;
                const g = parseInt(hex.slice(3, 5), 16) / 255;
                const b = parseInt(hex.slice(5, 7), 16) / 255;
                return rgb(r, g, b);
            };

            // Embed all needed fonts
            const fontCache = new Map();
            for (const ann of annotations) {
                if (!fontCache.has(ann.fontName)) {
                    const stdFont = fontNameMap[ann.fontName] || StandardFonts.Helvetica;
                    fontCache.set(ann.fontName, await pdfDoc.embedFont(stdFont));
                }
            }

            for (const ann of annotations) {
                const page = pages[ann.pageIndex];
                if (!page) continue;
                const { height: pageH } = page.getSize();
                const font = fontCache.get(ann.fontName);

                const pdfX = ann.x / scale;
                const pdfY = pageH - ann.y / scale;

                page.drawText(ann.text, {
                    x: pdfX,
                    y: pdfY,
                    size: ann.fontSize,
                    font,
                    color: hexToRgb(ann.color),
                });
            }

            const bytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            downloadBlob(blob, file.name.replace('.pdf', '_annotated.pdf'));
        } catch (err) {
            console.error('Failed to add text:', err);
            alert('Failed to save annotated PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const selected = selectedId ? annotations.find(a => a.id === selectedId) : null;

    return (
        <ToolPageLayout
            title="Add Text"
            description="Place text annotations anywhere on your PDF pages."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            faqs={toolFaqs['pdf-add-text']}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Text Settings</h3>

                    <button
                        onClick={() => setIsPlacing(!isPlacing)}
                        className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isPlacing
                            ? 'bg-[#3A76F0] text-white ring-2 ring-[#3A76F0]/50'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                    >
                        {isPlacing ? '📍 Click on page to place text' : '+ Place New Text'}
                    </button>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Font</label>
                        <select
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                            value={textFont}
                            onChange={(e) => {
                                setTextFont(e.target.value);
                                if (selected) updateAnnotation(selected.id, { fontName: e.target.value });
                            }}
                        >
                            {FONT_OPTIONS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs text-zinc-500 uppercase font-medium">Font Size</label>
                            <span className="text-xs text-[#3A76F0] font-medium">{textFontSize}pt</span>
                        </div>
                        <input
                            type="range"
                            min="8"
                            max="72"
                            value={textFontSize}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setTextFontSize(val);
                                if (selected) updateAnnotation(selected.id, { fontSize: val });
                            }}
                            className="w-full accent-[#3A76F0]"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#008000', '#FF6600'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setTextColor(c);
                                        if (selected) updateAnnotation(selected.id, { color: c });
                                    }}
                                    className={`w-7 h-7 rounded-md border-2 transition-all ${textColor === c ? 'border-[#3A76F0] scale-110' : 'border-zinc-600'
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => {
                                    setTextColor(e.target.value);
                                    if (selected) updateAnnotation(selected.id, { color: e.target.value });
                                }}
                                className="w-7 h-7 rounded-md border-2 border-zinc-600 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Selected text editing */}
                    {selected && (
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-[#3A76F0]/30 space-y-2">
                            <label className="text-xs text-[#3A76F0] uppercase font-medium block">Selected Text</label>
                            <textarea
                                value={selected.text}
                                onChange={(e) => updateAnnotation(selected.id, { text: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0] resize-none"
                                rows={3}
                            />
                            <button
                                onClick={() => removeAnnotation(selected.id)}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" /> Remove
                            </button>
                        </div>
                    )}

                    {annotations.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs text-zinc-500 uppercase font-medium">
                                    All Annotations ({annotations.length})
                                </label>
                                <button
                                    onClick={() => { setAnnotations([]); setSelectedId(null); }}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                                {annotations.map((a) => (
                                    <button
                                        key={a.id}
                                        onClick={() => {
                                            setSelectedId(a.id);
                                            setCurrentPage(a.pageIndex);
                                        }}
                                        className={`w-full flex items-center justify-between text-xs p-1.5 rounded transition-colors ${selectedId === a.id
                                            ? 'bg-[#3A76F0]/20 text-[#3A76F0]'
                                            : 'text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800'
                                            }`}
                                    >
                                        <span className="truncate max-w-[140px]">P{a.pageIndex + 1}: {a.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Loading PDF…" />
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
                    {/* File info */}
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
                        <button onClick={removeFile} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-zinc-500 hover:text-red-500" />
                        </button>
                    </div>

                    {/* Page navigation */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-30"
                        >
                            <ChevronLeft className="w-5 h-5 text-zinc-400" />
                        </button>
                        <span className="text-sm text-zinc-400">
                            Page {currentPage + 1} of {file.pageCount}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(file.pageCount - 1, p + 1))}
                            disabled={currentPage === file.pageCount - 1}
                            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-30"
                        >
                            <ChevronRight className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    {/* Canvas + text annotation overlay */}
                    <div className="relative mx-auto inline-block bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                        <canvas ref={canvasRef} className={`block max-w-full h-auto transition-opacity duration-300 ${pageRendered ? 'opacity-100' : 'opacity-0'}`} />
                        <div
                            ref={overlayRef}
                            className={`absolute inset-0 ${isPlacing ? 'cursor-crosshair' : ''}`}
                            onClick={handleCanvasClick}
                        >
                            {currentPageAnnotations.map(a => (
                                <div
                                    key={a.id}
                                    className={`absolute cursor-move select-none px-1 rounded ${selectedId === a.id ? 'ring-2 ring-[#3A76F0] bg-[#3A76F0]/10' : 'hover:ring-1 hover:ring-zinc-500'
                                        }`}
                                    style={{
                                        left: a.x,
                                        top: a.y - a.fontSize,
                                        fontSize: `${a.fontSize}px`,
                                        color: a.color,
                                        fontFamily: a.fontName.includes('Courier') ? 'monospace' :
                                            a.fontName.includes('Times') ? 'serif' : 'sans-serif',
                                        fontWeight: a.fontName.includes('Bold') ? 'bold' : 'normal',
                                        whiteSpace: 'pre',
                                    }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedId(a.id); }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        const newText = prompt('Edit text:', a.text);
                                        if (newText !== null) updateAnnotation(a.id, { text: newText });
                                    }}
                                >
                                    {a.text}
                                </div>
                            ))}
                        </div>

                        {!pageRendered && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center min-h-[300px]">
                                <Logo isProcessing className="w-12 h-12 text-[#3A76F0] mb-3" />
                                <p className="text-xs text-zinc-500">Rendering page…</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            <FloatingActionBar
                isVisible={!!file && annotations.length > 0}
                isProcessing={isProcessing}
                onAction={handleSave}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Save with Text ({annotations.length})
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
