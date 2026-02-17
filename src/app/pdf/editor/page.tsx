'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dropzone, FileProcessingOverlay, Logo } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import {
    FileText, X, Type, ImagePlus, EyeOff, Save,
    ChevronLeft, ChevronRight, Trash2, Upload,
    MousePointer, Undo2, Redo2, ZoomIn, ZoomOut,
    Square, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PDFFile {
    name: string;
    file: File;
    size: number;
    pageCount: number;
}

type EditorTool = 'select' | 'text' | 'image' | 'redact';

interface BaseAnnotation {
    id: string;
    type: string;
    pageIndex: number;
    x: number;
    y: number;
}

interface TextAnnotation extends BaseAnnotation {
    type: 'text';
    text: string;
    fontSize: number;
    fontName: string;
    color: string;
}

interface ImageAnnotation extends BaseAnnotation {
    type: 'image';
    width: number;
    height: number;
    imageData: ArrayBuffer;
    imageType: 'png' | 'jpg';
    naturalWidth: number;
    naturalHeight: number;
    previewUrl: string;
    opacity: number;
}

interface RedactAnnotation extends BaseAnnotation {
    type: 'redact';
    width: number;
    height: number;
    color: string;
}

type Annotation = TextAnnotation | ImageAnnotation | RedactAnnotation;

interface HistoryEntry {
    annotations: Annotation[];
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

const TOOL_ITEMS: { tool: EditorTool; icon: typeof MousePointer; label: string; shortcut: string }[] = [
    { tool: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
    { tool: 'text', icon: Type, label: 'Text', shortcut: 'T' },
    { tool: 'image', icon: ImagePlus, label: 'Image', shortcut: 'I' },
    { tool: 'redact', icon: EyeOff, label: 'Redact', shortcut: 'R' },
];

/* ------------------------------------------------------------------ */
/*  Editor Component                                                   */
/* ------------------------------------------------------------------ */

export default function PDFEditorPage() {
    // File state
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Editor state
    const [activeTool, setActiveTool] = useState<EditorTool>('select');
    const [currentPage, setCurrentPage] = useState(0);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [pageRendered, setPageRendered] = useState(false);
    const [zoom, setZoom] = useState(1.5);

    // Text tool settings
    const [textFontSize, setTextFontSize] = useState(16);
    const [textFont, setTextFont] = useState('Helvetica');
    const [textColor, setTextColor] = useState('#000000');

    // Redact tool settings
    const [redactColor, setRedactColor] = useState('#000000');
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number } | null>(null);

    // Image dragging
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // History
    const [history, setHistory] = useState<HistoryEntry[]>([{ annotations: [] }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const pdfDocRef = useRef<any>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    /* ---- file loading ---- */
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
            setHistory([{ annotations: [] }]);
            setHistoryIndex(0);
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

    /* ---- render current page ---- */
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
            const viewport = page.getViewport({ scale: zoom });

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
    }, [file, currentPage, zoom]);

    /* ---- history management ---- */
    const pushHistory = useCallback((newAnnotations: Annotation[]) => {
        setHistory(prev => {
            const trimmed = prev.slice(0, historyIndex + 1);
            return [...trimmed, { annotations: newAnnotations }];
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex <= 0) return;
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setAnnotations(history[newIdx].annotations);
    }, [historyIndex, history]);

    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;
        const newIdx = historyIndex + 1;
        setHistoryIndex(newIdx);
        setAnnotations(history[newIdx].annotations);
    }, [historyIndex, history]);

    /* ---- keyboard shortcuts ---- */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'v' || e.key === 'V') setActiveTool('select');
            else if (e.key === 't' || e.key === 'T') setActiveTool('text');
            else if (e.key === 'i' || e.key === 'I') setActiveTool('image');
            else if (e.key === 'r' || e.key === 'R') setActiveTool('redact');
            else if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
            else if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
            else if (e.key === 'Delete' && selectedId) {
                removeAnnotation(selectedId);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undo, redo, selectedId]);

    const removeFile = useCallback(() => {
        setFile(null);
        pdfDocRef.current?.destroy();
        pdfDocRef.current = null;
        annotations.forEach(a => {
            if (a.type === 'image') URL.revokeObjectURL(a.previewUrl);
        });
        setAnnotations([]);
    }, [annotations]);

    /* ---- annotation operations ---- */
    const addAnnotation = (ann: Annotation) => {
        const newAnns = [...annotations, ann];
        setAnnotations(newAnns);
        pushHistory(newAnns);
    };

    const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
        const newAnns = annotations.map(a => a.id === id ? { ...a, ...updates } as Annotation : a);
        setAnnotations(newAnns);
    };

    const removeAnnotation = (id: string) => {
        const ann = annotations.find(a => a.id === id);
        if (ann?.type === 'image') URL.revokeObjectURL((ann as ImageAnnotation).previewUrl);
        const newAnns = annotations.filter(a => a.id !== id);
        setAnnotations(newAnns);
        pushHistory(newAnns);
        if (selectedId === id) setSelectedId(null);
    };

    /* ---- canvas interaction handlers ---- */
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!overlayRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'text') {
            const ann: TextAnnotation = {
                id: crypto.randomUUID(),
                type: 'text',
                pageIndex: currentPage,
                x, y,
                text: 'Edit me',
                fontSize: textFontSize,
                fontName: textFont,
                color: textColor,
            };
            addAnnotation(ann);
            setSelectedId(ann.id);
        } else if (activeTool === 'image') {
            imageInputRef.current?.click();
        } else if (activeTool === 'select') {
            setSelectedId(null);
        }
    };

    // Redact drawing
    const handleMouseDown = (e: React.MouseEvent) => {
        if (activeTool !== 'redact' || !overlayRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();
        setIsDrawing(true);
        setDrawStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setCurrentDraw({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!overlayRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();

        if (isDrawing && activeTool === 'redact') {
            setCurrentDraw({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            return;
        }

        if (isDragging && selectedId) {
            const x = e.clientX - rect.left - dragOffset.x;
            const y = e.clientY - rect.top - dragOffset.y;
            updateAnnotation(selectedId, { x, y });
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && drawStart && currentDraw && activeTool === 'redact') {
            const x = Math.min(drawStart.x, currentDraw.x);
            const y = Math.min(drawStart.y, currentDraw.y);
            const w = Math.abs(currentDraw.x - drawStart.x);
            const h = Math.abs(currentDraw.y - drawStart.y);

            if (w > 5 && h > 5) {
                const ann: RedactAnnotation = {
                    id: crypto.randomUUID(),
                    type: 'redact',
                    pageIndex: currentPage,
                    x, y, width: w, height: h,
                    color: redactColor,
                };
                addAnnotation(ann);
            }
        }

        if (isDragging && selectedId) {
            pushHistory(annotations);
        }

        setIsDrawing(false);
        setDrawStart(null);
        setCurrentDraw(null);
        setIsDragging(false);
    };

    // Image upload
    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const imageFile = e.target.files?.[0];
        if (!imageFile) return;

        const isJpg = imageFile.type === 'image/jpeg';
        const isPng = imageFile.type === 'image/png';
        if (!isJpg && !isPng) {
            alert('Only PNG and JPEG images are supported.');
            return;
        }

        const arrayBuffer = await imageFile.arrayBuffer();
        const img = new Image();
        const url = URL.createObjectURL(imageFile);
        img.src = url;
        await new Promise(resolve => { img.onload = resolve; });

        const displayWidth = Math.min(200, img.naturalWidth);
        const scaleRatio = displayWidth / img.naturalWidth;
        const displayHeight = img.naturalHeight * scaleRatio;

        const ann: ImageAnnotation = {
            id: crypto.randomUUID(),
            type: 'image',
            pageIndex: currentPage,
            x: 50, y: 50,
            width: displayWidth,
            height: displayHeight,
            imageData: arrayBuffer,
            imageType: isJpg ? 'jpg' : 'png',
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            previewUrl: url,
            opacity: 1,
        };

        addAnnotation(ann);
        setSelectedId(ann.id);
        e.target.value = '';
    }, [currentPage, annotations, pushHistory]);

    // Image drag start
    const handleAnnotationMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (activeTool !== 'select') return;
        const ann = annotations.find(a => a.id === id);
        if (!ann) return;
        setSelectedId(id);
        setIsDragging(true);
        const parentRect = overlayRef.current?.getBoundingClientRect();
        if (parentRect) {
            setDragOffset({
                x: e.clientX - parentRect.left - ann.x,
                y: e.clientY - parentRect.top - ann.y,
            });
        }
    };

    /* ---- save ---- */
    const handleSave = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const buf = await file.file.arrayBuffer();
            const bufCopy1 = buf.slice(0);
            const bufCopy2 = buf.slice(0);

            // Group annotations by page
            const annotsByPage = new Map<number, Annotation[]>();
            for (const ann of annotations) {
                const list = annotsByPage.get(ann.pageIndex) || [];
                list.push(ann);
                annotsByPage.set(ann.pageIndex, list);
            }

            // Check which pages have redact annotations (need rasterization)
            const redactPages = new Set<number>();
            for (const [pageIdx, anns] of annotsByPage) {
                if (anns.some(a => a.type === 'redact')) redactPages.add(pageIdx);
            }

            // Load pdfjs for rasterization
            const pdfjs = await import('pdfjs-dist');
            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
            }
            const pdfjsDoc = await pdfjs.getDocument({ data: new Uint8Array(bufCopy1) }).promise;

            const srcDoc = await PDFDocument.load(bufCopy2);
            const outDoc = await PDFDocument.create();
            const totalPages = srcDoc.getPageCount();

            const hexToRgb = (hex: string) => {
                const r = parseInt(hex.slice(1, 3), 16) / 255;
                const g = parseInt(hex.slice(3, 5), 16) / 255;
                const b = parseInt(hex.slice(5, 7), 16) / 255;
                return rgb(r, g, b);
            };

            const RENDER_SCALE = 2;
            const fontCache = new Map();

            for (let i = 0; i < totalPages; i++) {
                const pageAnns = annotsByPage.get(i) || [];
                const srcPage = srcDoc.getPages()[i];
                const { width: origW, height: origH } = srcPage.getSize();

                if (redactPages.has(i)) {
                    // ---- RASTERIZE: render page + ALL annotations onto canvas ----
                    const pjPage = await pdfjsDoc.getPage(i + 1);
                    const viewport = pjPage.getViewport({ scale: RENDER_SCALE });

                    const offscreen = document.createElement('canvas');
                    offscreen.width = viewport.width;
                    offscreen.height = viewport.height;
                    const ctx = offscreen.getContext('2d')!;

                    // Render original page content
                    await pjPage.render({ canvasContext: ctx, viewport }).promise;

                    const ratio = RENDER_SCALE / zoom;

                    // Draw all annotations on this page onto the canvas
                    for (const ann of pageAnns) {
                        if (ann.type === 'redact') {
                            ctx.fillStyle = ann.color;
                            ctx.fillRect(ann.x * ratio, ann.y * ratio, ann.width * ratio, ann.height * ratio);
                        } else if (ann.type === 'text') {
                            ctx.fillStyle = ann.color;
                            const family = ann.fontName.includes('Courier') ? 'monospace' :
                                ann.fontName.includes('Times') ? 'serif' : 'sans-serif';
                            const weight = ann.fontName.includes('Bold') ? 'bold' : 'normal';
                            ctx.font = `${weight} ${ann.fontSize * (RENDER_SCALE / zoom)}px ${family}`;
                            ctx.fillText(ann.text, ann.x * ratio, ann.y * ratio);
                        } else if (ann.type === 'image') {
                            const img = new Image();
                            img.src = ann.previewUrl;
                            await new Promise(resolve => { img.onload = resolve; });
                            ctx.globalAlpha = ann.opacity;
                            ctx.drawImage(img, ann.x * ratio, ann.y * ratio, ann.width * ratio, ann.height * ratio);
                            ctx.globalAlpha = 1;
                        }
                    }

                    // Convert canvas to PNG and embed as flat page
                    const pngDataUrl = offscreen.toDataURL('image/png');
                    const pngBase64 = pngDataUrl.split(',')[1];
                    const pngBytes = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));

                    const pngImage = await outDoc.embedPng(pngBytes);
                    const newPage = outDoc.addPage([origW, origH]);
                    newPage.drawImage(pngImage, { x: 0, y: 0, width: origW, height: origH });

                } else if (pageAnns.length > 0) {
                    // ---- NO REDACTION: use pdf-lib directly (preserves text/vectors) ----
                    const [copiedPage] = await outDoc.copyPages(srcDoc, [i]);
                    outDoc.addPage(copiedPage);
                    const outPage = outDoc.getPages()[outDoc.getPageCount() - 1];

                    for (const ann of pageAnns) {
                        if (ann.type === 'text') {
                            const stdFont = fontNameMap[ann.fontName] || StandardFonts.Helvetica;
                            if (!fontCache.has(ann.fontName)) {
                                fontCache.set(ann.fontName, await outDoc.embedFont(stdFont));
                            }
                            outPage.drawText(ann.text, {
                                x: ann.x / zoom,
                                y: origH - ann.y / zoom,
                                size: ann.fontSize,
                                font: fontCache.get(ann.fontName),
                                color: hexToRgb(ann.color),
                            });
                        } else if (ann.type === 'image') {
                            const embeddedImage = ann.imageType === 'png'
                                ? await outDoc.embedPng(ann.imageData)
                                : await outDoc.embedJpg(ann.imageData);
                            const pdfW = ann.width / zoom;
                            const pdfH = ann.height / zoom;
                            outPage.drawImage(embeddedImage, {
                                x: ann.x / zoom,
                                y: origH - ann.y / zoom - pdfH,
                                width: pdfW,
                                height: pdfH,
                                opacity: ann.opacity,
                            });
                        }
                    }
                } else {
                    // ---- NO ANNOTATIONS: copy page as-is ----
                    const [copiedPage] = await outDoc.copyPages(srcDoc, [i]);
                    outDoc.addPage(copiedPage);
                }
            }

            // Preserve metadata
            outDoc.setTitle(srcDoc.getTitle() ?? '');
            outDoc.setAuthor(srcDoc.getAuthor() ?? '');
            outDoc.setSubject(srcDoc.getSubject() ?? '');

            const bytes = await outDoc.save();
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            downloadBlob(blob, file.name.replace('.pdf', '_edited.pdf'));

            pdfjsDoc.destroy();
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save edited PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const currentPageAnnotations = annotations.filter(a => a.pageIndex === currentPage);
    const selected = selectedId ? annotations.find(a => a.id === selectedId) : null;

    /* ---- No file loaded ---- */
    if (!file) {
        return (
            <div className="min-h-screen bg-[#09090B] text-zinc-100">
                <div className="border-b border-zinc-800 bg-[#09090B]">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
                        <a href="/pdf" className="text-sm text-zinc-400 hover:text-white">PDF Tools</a>
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                        <span className="text-sm text-zinc-100 font-medium">PDF Editor</span>
                    </div>
                </div>
                <div className="max-w-3xl mx-auto px-6 py-16">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-3">PDF Editor</h1>
                        <p className="text-zinc-400">Add text, images, and redact content — all in one place.</p>
                    </div>
                    {isLoading ? (
                        <FileProcessingOverlay message="Loading your PDF…" />
                    ) : (
                        <Dropzone
                            onFilesAdded={handleFileAdded}
                            acceptedTypes={['application/pdf']}
                            maxFiles={1}
                        />
                    )}
                </div>
            </div>
        );
    }

    /* ---- Editor UI ---- */
    return (
        <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
            {/* Top bar */}
            <div className="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between gap-4">
                    {/* Left: file info */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-red-500/10 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">{file.name}</p>
                            <p className="text-xs text-zinc-500">{formatFileSize(file.size)} • {file.pageCount} pages</p>
                        </div>
                        <button onClick={removeFile} className="p-1 hover:bg-zinc-800 rounded transition-colors flex-shrink-0">
                            <X className="w-4 h-4 text-zinc-500" />
                        </button>
                    </div>

                    {/* Center: tools */}
                    <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-1">
                        {TOOL_ITEMS.map(({ tool, icon: Icon, label, shortcut }) => (
                            <button
                                key={tool}
                                onClick={() => setActiveTool(tool)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTool === tool
                                    ? 'bg-[#3A76F0] text-white shadow-lg shadow-[#3A76F0]/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                                    }`}
                                title={`${label} (${shortcut})`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-1">
                            <button
                                onClick={undo}
                                disabled={historyIndex <= 0}
                                className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={redo}
                                disabled={historyIndex >= history.length - 1}
                                className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                                title="Redo (Ctrl+Y)"
                            >
                                <Redo2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-1">
                            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-zinc-500 w-10 text-center">{Math.round(zoom * 100 / 1.5 * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isProcessing || annotations.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-[#3A76F0] hover:bg-[#2563EB] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Properties panel (left sidebar) */}
                <AnimatePresence>
                    <motion.div
                        className="w-72 border-r border-zinc-800 bg-zinc-900/50 overflow-y-auto flex-shrink-0"
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-4 space-y-5">
                            {/* Tool-specific settings */}
                            {activeTool === 'text' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Text Settings</h3>

                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Font</label>
                                        <select
                                            className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                            value={textFont}
                                            onChange={(e) => {
                                                setTextFont(e.target.value);
                                                if (selected?.type === 'text') updateAnnotation(selected.id, { fontName: e.target.value });
                                            }}
                                        >
                                            {FONT_OPTIONS.map(f => (
                                                <option key={f.value} value={f.value}>{f.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <label className="text-xs text-zinc-500">Size</label>
                                            <span className="text-xs text-[#3A76F0]">{textFontSize}pt</span>
                                        </div>
                                        <input
                                            type="range" min="8" max="72" value={textFontSize}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setTextFontSize(val);
                                                if (selected?.type === 'text') updateAnnotation(selected.id, { fontSize: val });
                                            }}
                                            className="w-full accent-[#3A76F0]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Color</label>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#008000', '#FF6600'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        setTextColor(c);
                                                        if (selected?.type === 'text') updateAnnotation(selected.id, { color: c });
                                                    }}
                                                    className={`w-6 h-6 rounded border-2 transition-all ${textColor === c ? 'border-[#3A76F0] scale-110' : 'border-zinc-600'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                            <input
                                                type="color" value={textColor}
                                                onChange={(e) => {
                                                    setTextColor(e.target.value);
                                                    if (selected?.type === 'text') updateAnnotation(selected.id, { color: e.target.value });
                                                }}
                                                className="w-6 h-6 rounded border-2 border-zinc-600 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <p className="text-xs text-zinc-600">Click on the page to place text</p>
                                </div>
                            )}

                            {activeTool === 'image' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Image Settings</h3>
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        Upload Image
                                    </button>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                    <p className="text-xs text-zinc-600">Or click on the page after selecting the Image tool</p>
                                </div>
                            )}

                            {activeTool === 'redact' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Redact Settings</h3>
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Color</label>
                                        <div className="flex gap-1.5">
                                            {['#000000', '#FFFFFF', '#FF0000', '#808080'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setRedactColor(c)}
                                                    className={`w-7 h-7 rounded border-2 transition-all ${redactColor === c ? 'border-[#3A76F0] scale-110' : 'border-zinc-600'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-600">Click and drag on the page to redact an area</p>
                                </div>
                            )}

                            {activeTool === 'select' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Selection</h3>
                                    <p className="text-xs text-zinc-600">Click to select an annotation, drag to move.</p>
                                    <p className="text-xs text-zinc-600">Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Delete</kbd> to remove selected.</p>
                                </div>
                            )}

                            {/* Selected annotation properties */}
                            {selected && (
                                <div className="pt-4 border-t border-zinc-800 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs text-[#3A76F0] uppercase font-semibold tracking-wider">Selected</h3>
                                        <button
                                            onClick={() => removeAnnotation(selected.id)}
                                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>

                                    {selected.type === 'text' && (
                                        <textarea
                                            value={(selected as TextAnnotation).text}
                                            onChange={(e) => updateAnnotation(selected.id, { text: e.target.value })}
                                            className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:border-[#3A76F0] resize-none"
                                            rows={3}
                                        />
                                    )}

                                    {selected.type === 'image' && (
                                        <div className="space-y-2">
                                            <img src={(selected as ImageAnnotation).previewUrl} alt="" className="w-full h-16 object-cover rounded border border-zinc-700" />
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <label className="text-xs text-zinc-500">Size</label>
                                                    <span className="text-xs text-zinc-400">{Math.round((selected as ImageAnnotation).width)}px</span>
                                                </div>
                                                <input
                                                    type="range" min="20" max="800"
                                                    value={(selected as ImageAnnotation).width}
                                                    onChange={(e) => {
                                                        const imgAnn = selected as ImageAnnotation;
                                                        const newW = Number(e.target.value);
                                                        const ratio = imgAnn.naturalHeight / imgAnn.naturalWidth;
                                                        updateAnnotation(selected.id, { width: newW, height: newW * ratio });
                                                    }}
                                                    className="w-full accent-[#3A76F0]"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <label className="text-xs text-zinc-500">Opacity</label>
                                                    <span className="text-xs text-zinc-400">{Math.round((selected as ImageAnnotation).opacity * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range" min="10" max="100"
                                                    value={(selected as ImageAnnotation).opacity * 100}
                                                    onChange={(e) => updateAnnotation(selected.id, { opacity: Number(e.target.value) / 100 })}
                                                    className="w-full accent-[#3A76F0]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Annotation list */}
                            {annotations.length > 0 && (
                                <div className="pt-4 border-t border-zinc-800 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">
                                            Layers ({annotations.length})
                                        </h3>
                                        <button
                                            onClick={() => {
                                                annotations.forEach(a => { if (a.type === 'image') URL.revokeObjectURL((a as ImageAnnotation).previewUrl); });
                                                setAnnotations([]);
                                                pushHistory([]);
                                                setSelectedId(null);
                                            }}
                                            className="text-xs text-red-400 hover:text-red-300"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="space-y-0.5 max-h-40 overflow-y-auto">
                                        {annotations.map((a) => (
                                            <button
                                                key={a.id}
                                                onClick={() => { setSelectedId(a.id); setCurrentPage(a.pageIndex); }}
                                                className={`w-full flex items-center gap-2 text-xs p-1.5 rounded transition-colors ${selectedId === a.id
                                                    ? 'bg-[#3A76F0]/20 text-[#3A76F0]'
                                                    : 'text-zinc-400 hover:bg-zinc-800'
                                                    }`}
                                            >
                                                {a.type === 'text' && <Type className="w-3 h-3" />}
                                                {a.type === 'image' && <ImagePlus className="w-3 h-3" />}
                                                {a.type === 'redact' && <Square className="w-3 h-3" />}
                                                <span className="truncate">
                                                    P{a.pageIndex + 1}: {
                                                        a.type === 'text' ? (a as TextAnnotation).text :
                                                            a.type === 'image' ? 'Image' : 'Redaction'
                                                    }
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Canvas area */}
                <div className="flex-1 overflow-auto bg-zinc-950 flex flex-col items-center py-6 px-4">
                    {/* Page navigation */}
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="p-1.5 rounded hover:bg-zinc-800 transition-colors disabled:opacity-30"
                        >
                            <ChevronLeft className="w-5 h-5 text-zinc-400" />
                        </button>
                        <span className="text-sm text-zinc-400">
                            Page {currentPage + 1} of {file.pageCount}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(file.pageCount - 1, p + 1))}
                            disabled={currentPage === file.pageCount - 1}
                            className="p-1.5 rounded hover:bg-zinc-800 transition-colors disabled:opacity-30"
                        >
                            <ChevronRight className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    {/* Canvas container */}
                    <div className="relative inline-block shadow-2xl rounded-sm">
                        <canvas ref={canvasRef} className={`block transition-opacity duration-300 ${pageRendered ? 'opacity-100' : 'opacity-0'}`} />
                        <div
                            ref={overlayRef}
                            className={`absolute inset-0 ${activeTool === 'redact' ? 'cursor-crosshair' :
                                activeTool === 'text' ? 'cursor-text' :
                                    activeTool === 'image' ? 'cursor-copy' :
                                        'cursor-default'
                                }`}
                            onClick={handleCanvasClick}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {/* Render annotations */}
                            {currentPageAnnotations.map(a => {
                                if (a.type === 'text') {
                                    const ta = a as TextAnnotation;
                                    return (
                                        <div
                                            key={a.id}
                                            className={`absolute select-none px-0.5 rounded ${selectedId === a.id ? 'ring-2 ring-[#3A76F0] bg-[#3A76F0]/10' : 'hover:ring-1 hover:ring-zinc-400'
                                                }`}
                                            style={{
                                                left: ta.x,
                                                top: ta.y - ta.fontSize,
                                                fontSize: `${ta.fontSize}px`,
                                                color: ta.color,
                                                fontFamily: ta.fontName.includes('Courier') ? 'monospace' :
                                                    ta.fontName.includes('Times') ? 'serif' : 'sans-serif',
                                                fontWeight: ta.fontName.includes('Bold') ? 'bold' : 'normal',
                                                whiteSpace: 'pre',
                                                cursor: activeTool === 'select' ? 'move' : 'default',
                                            }}
                                            onMouseDown={(e) => handleAnnotationMouseDown(e, a.id)}
                                            onClick={(e) => { e.stopPropagation(); setSelectedId(a.id); }}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                const newText = prompt('Edit text:', ta.text);
                                                if (newText !== null) {
                                                    updateAnnotation(a.id, { text: newText });
                                                    pushHistory(annotations.map(ann => ann.id === a.id ? { ...ann, text: newText } as Annotation : ann));
                                                }
                                            }}
                                        >
                                            {ta.text}
                                        </div>
                                    );
                                }

                                if (a.type === 'image') {
                                    const ia = a as ImageAnnotation;
                                    return (
                                        <img
                                            key={a.id}
                                            src={ia.previewUrl}
                                            alt="overlay"
                                            className={`absolute select-none ${selectedId === a.id ? 'ring-2 ring-[#3A76F0]' : 'hover:ring-1 hover:ring-zinc-400'
                                                }`}
                                            style={{
                                                left: ia.x,
                                                top: ia.y,
                                                width: ia.width,
                                                height: ia.height,
                                                opacity: ia.opacity,
                                                cursor: activeTool === 'select' ? 'move' : 'default',
                                            }}
                                            onMouseDown={(e) => handleAnnotationMouseDown(e, a.id)}
                                            onClick={(e) => { e.stopPropagation(); setSelectedId(a.id); }}
                                            draggable={false}
                                        />
                                    );
                                }

                                if (a.type === 'redact') {
                                    const ra = a as RedactAnnotation;
                                    return (
                                        <div
                                            key={a.id}
                                            className={`absolute ${selectedId === a.id ? 'ring-2 ring-[#3A76F0]' : ''
                                                }`}
                                            style={{
                                                left: ra.x,
                                                top: ra.y,
                                                width: ra.width,
                                                height: ra.height,
                                                backgroundColor: ra.color,
                                                opacity: 0.85,
                                                cursor: activeTool === 'select' ? 'move' : 'default',
                                            }}
                                            onMouseDown={(e) => handleAnnotationMouseDown(e, a.id)}
                                            onClick={(e) => { e.stopPropagation(); setSelectedId(a.id); }}
                                        />
                                    );
                                }

                                return null;
                            })}

                            {/* Currently drawing redact rect */}
                            {isDrawing && drawStart && currentDraw && (
                                <div
                                    className="absolute border-2 border-dashed border-red-500"
                                    style={{
                                        left: Math.min(drawStart.x, currentDraw.x),
                                        top: Math.min(drawStart.y, currentDraw.y),
                                        width: Math.abs(currentDraw.x - drawStart.x),
                                        height: Math.abs(currentDraw.y - drawStart.y),
                                        backgroundColor: redactColor,
                                        opacity: 0.4,
                                    }}
                                />
                            )}
                        </div>

                        {!pageRendered && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center min-h-[300px] bg-zinc-900/80 rounded-sm">
                                <Logo isProcessing className="w-12 h-12 text-[#3A76F0] mb-3" />
                                <p className="text-xs text-zinc-500">Rendering page…</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
