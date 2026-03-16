'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Dropzone, Logo, DownloadToast } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { useMuPDF, type AddAnnotationParams, type PageInfo, type AnnotationInfo } from '@/hooks/useMuPDF';
import { AnnotationToolbar, type AnnotationTool } from '@/components/pdf/AnnotationToolbar';
import { PropertyPanel, type AnnotationProperties } from '@/components/pdf/PropertyPanel';
import type { AppliedChange } from '@/components/tools/AppliedChangesPanel';
import { StampPicker, type StampOption } from '@/components/pdf/StampPicker';
import { screenToPdf, pdfToScreen, screenRectToPdfRect, type Rect } from '@/lib/pdf-coordinates';
import { TextEditOverlay, type TextCommitOptions } from '@/components/pdf/TextEditOverlay';
import { downloadBlob } from '@/lib/core/download';
import { formatFileSize } from '@/lib/core/format';
import Link from 'next/link';
import {
    FileText, X,
    ZoomIn, ZoomOut, Loader2, Download,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PDFFile {
    name: string;
    file: File;
    size: number;
    pageCount: number;
    pages: PageInfo[];
}

type DragMode = 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | null;

interface TextEditState {
    cssX: number;
    cssY: number;
    boxWidth?: number;
    pdfX: number;
    pdfY: number;
    pageIdx: number;
    /** Set when re-editing an existing annotation */
    annotIndex?: number;
    initialText?: string;
}

interface DragState {
    startX: number;
    startY: number;
    origRect: number[];
    origLinePoints?: number[];
    origInkList?: number[][][];
    origQuadPoints?: number[][];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

// Parse hex string stamp colors (StampOption uses hex strings)
function hexToRgb01(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
}

// Convert 0-255 property values to 0-1 for MuPDF
function rgb01(r: number, g: number, b: number): [number, number, number] {
    return [r / 255, g / 255, b / 255];
}

// Maps stamp labels to MuPDF predefined icon names
const STAMP_ICON_MAP: Record<string, string> = {
    'Approved': 'Approved',
    'Rejected': 'NotApproved',
    'Not Approved': 'NotApproved',
    'Draft': 'Draft',
    'Confidential': 'Confidential',
    'Final': 'Final',
    'Experimental': 'Experimental',
    'For Comment': 'ForComment',
    'Top Secret': 'TopSecret',
};

// Corner handle hit radius in canvas pixels
const HANDLE_HIT_PX = 10;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PDFEditorPage() {
    // File state
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Editor state
    const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
    const [currentPage, setCurrentPage] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [renderedPages, setRenderedPages] = useState<Map<number, { url: string; w: number; h: number }>>(new Map());
    const renderedUrlsRef = useRef<Map<number, string>>(new Map()); // for URL cleanup
    const [renderingPages, setRenderingPages] = useState<Set<number>>(new Set());
    const [pageAnnotations, setPageAnnotations] = useState<AnnotationInfo[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Selection
    const [selectedAnnotIndex, setSelectedAnnotIndex] = useState<number | null>(null);
    const selectedAnnotIndexRef = useRef<number | null>(null);
    useEffect(() => { selectedAnnotIndexRef.current = selectedAnnotIndex; }, [selectedAnnotIndex]);

    // Drag / resize state
    const [dragMode, setDragMode] = useState<DragMode>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const [dragPreviewPdfRect, setDragPreviewPdfRect] = useState<number[] | null>(null);
    const [hoverCursor, setHoverCursor] = useState<'move' | 'resize' | null>(null);

    // Download toast
    const [toastInfo, setToastInfo] = useState<{ filename: string; blobUrl: string } | null>(null);

    // Mobile panel
    const [mobilePanelCollapsed, setMobilePanelCollapsed] = useState(true);

    // Stamp picker
    const [showStampPicker, setShowStampPicker] = useState(false);
    const [selectedStamp, setSelectedStamp] = useState<StampOption | null>(null);

    // Properties (r/g/b in 0-255 range)
    const [properties, setProperties] = useState<AnnotationProperties>({
        r: 255, g: 255, b: 0,          // yellow stroke/bg
        textR: 0, textG: 0, textB: 0,  // black text
        textBgTransparent: true,
        opacity: 0.5,
        borderWidth: 2,
        fontSize: 14,
        fontName: 'Helv',
        text: '',
    });

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
    const [inkPoints, setInkPoints] = useState<Array<[number, number]>>([]);

    // Image stamp
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [pendingImage, setPendingImage] = useState<{ data: ArrayBuffer; name: string; width: number; height: number } | null>(null);

    // Rich text overlay
    const [textEditState, setTextEditState] = useState<TextEditState | null>(null);
    /** Ref to the active page container div, for positioning the overlay */
    const activePageDivRef = useRef<HTMLDivElement>(null);
    /** Client coords at the start of a freetext drag, for overlay positioning */
    const freeTextDragStartClientRef = useRef<{ x: number; y: number } | null>(null);

    // Refs
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

    // Output filename
    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(
        file?.name || 'output.pdf', '_annotated'
    );

    // MuPDF hook
    const mupdf = useMuPDF();
    useEffect(() => { mupdf.warmup(); }, [mupdf]);

    const dpi = useMemo(() => {
        const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        return Math.round(72 * zoom * dpr);
    }, [zoom]);

    /* ---- File loading ---- */
    const handleFileAdded = useCallback(async (files: File[]) => {
        const f = files[0];
        if (!f || f.type !== 'application/pdf') return;

        setIsLoading(true);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        try {
            const buffer = await f.arrayBuffer();
            const result = await mupdf.load(buffer);

            setFile({
                name: f.name,
                file: f,
                size: f.size,
                pageCount: result.pageCount,
                pages: result.pages,
            });
            setCurrentPage(0);
            setHasChanges(false);
            setSelectedAnnotIndex(null);
        } catch (err) {
            console.error('Failed to load PDF:', err);
            alert('Failed to load PDF. The file may be corrupted or password-protected.');
        } finally {
            setIsLoading(false);
        }
    }, [mupdf]);

    // Store integration
    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            const pdfs = storedFiles.filter(f => f.type === 'application/pdf');
            if (pdfs.length > 0) handleFileAdded(pdfs);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    /* ---- Render functions ---- */
    const renderPage = useCallback(async (idx: number) => {
        if (!file) return;
        setRenderingPages(prev => new Set([...prev, idx]));
        try {
            const result = await mupdf.renderPage(idx, dpi);
            const blob = new Blob([result.pngData], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            const oldUrl = renderedUrlsRef.current.get(idx);
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            renderedUrlsRef.current.set(idx, url);
            setRenderedPages(prev => {
                const next = new Map(prev);
                next.set(idx, { url, w: result.width, h: result.height });
                return next;
            });
        } catch (err) {
            console.error(`Failed to render page ${idx}:`, err);
        } finally {
            setRenderingPages(prev => { const next = new Set(prev); next.delete(idx); return next; });
        }
    }, [file, dpi, mupdf]);

    const refreshCurrentPage = useCallback(async () => {
        if (!file) return;
        await renderPage(currentPage);
        const annotsResult = await mupdf.getAnnotations(currentPage);
        setPageAnnotations(annotsResult.annotations);
        setSelectedAnnotIndex(null);
    }, [renderPage, currentPage, file, mupdf]);

    // Render all pages when file loads
    useEffect(() => {
        if (!file) return;
        setRenderedPages(new Map());
        setRenderingPages(new Set());
        // Revoke all old URLs
        renderedUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        renderedUrlsRef.current.clear();
        // Render all pages sequentially
        (async () => {
            for (let i = 0; i < file.pageCount; i++) {
                await renderPage(i);
            }
        })();
    }, [file?.name]); // eslint-disable-line

    // Re-render all pages on zoom change (after initial load)
    useEffect(() => {
        if (!file) return;
        (async () => {
            for (let i = 0; i < file.pageCount; i++) {
                await renderPage(i);
            }
        })();
    }, [dpi]); // eslint-disable-line

    // Fetch annotations when active page changes
    useEffect(() => {
        if (!file) return;
        mupdf.getAnnotations(currentPage).then(result => {
            setPageAnnotations(result.annotations);
            setSelectedAnnotIndex(null);
        }).catch(() => {});
        // Reset drawing state when switching pages
        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);
        setInkPoints([]);
        setDragMode(null);
        dragStateRef.current = null;
        setDragPreviewPdfRect(null);
        setHoverCursor(null);
    }, [currentPage, file?.name]); // eslint-disable-line

    /* ---- Cleanup ---- */
    const removeFile = useCallback(() => {
        setFile(null);
        renderedUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        renderedUrlsRef.current.clear();
        setRenderedPages(new Map());
        setRenderingPages(new Set());
        setPageAnnotations([]);
        setHasChanges(false);
        setSelectedAnnotIndex(null);
        mupdf.close().catch(() => { });
    }, [mupdf]);

    useEffect(() => {
        return () => {
            renderedUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    /* ---- Page dimensions ---- */
    const activePageInfo = file?.pages[currentPage];
    const scale = dpi / 72;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const activeRendered = renderedPages.get(currentPage);
    const renderWidth = activeRendered?.w ?? (activePageInfo ? Math.round(activePageInfo.width * scale) : 0);
    const renderHeight = activeRendered?.h ?? (activePageInfo ? Math.round(activePageInfo.height * scale) : 0);
    const displayWidth = Math.round(renderWidth / dpr);
    const displayHeight = Math.round(renderHeight / dpr);
    const pageHeight = activePageInfo?.height || 0;

    /* ---- Derived hex color for canvas drawing ---- */
    const hexColor = useMemo(() => {
        return '#' + [properties.r, properties.g, properties.b]
            .map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    }, [properties.r, properties.g, properties.b]);

    /* ---- Annotation operations ---- */
    const addAnnotationAndRefresh = useCallback(async (params: AddAnnotationParams) => {
        try {
            await mupdf.addAnnotation(params);
            setHasChanges(true);
            await refreshCurrentPage();
        } catch (err) {
            console.error('Failed to add annotation:', err);
        }
    }, [mupdf, refreshCurrentPage]);

    const deleteAnnotationAndRefresh = useCallback(async (annotIndex: number) => {
        try {
            await mupdf.deleteAnnotation(currentPage, annotIndex);
            setHasChanges(true);
            setSelectedAnnotIndex(null);
            await refreshCurrentPage();
        } catch (err) {
            console.error('Failed to delete annotation:', err);
        }
    }, [mupdf, currentPage, refreshCurrentPage]);

    const updateAnnotationAndRefresh = useCallback(async (
        annotIndex: number,
        updates: { color?: number[]; opacity?: number; contents?: string }
    ) => {
        try {
            await mupdf.updateAnnotation({ pageIndex: currentPage, annotIndex, ...updates });
            setHasChanges(true);
            await refreshCurrentPage();
        } catch (err) {
            console.error('Failed to update annotation:', err);
        }
    }, [mupdf, currentPage, refreshCurrentPage]);

    /* ---- Draw overlay ---- */
    const drawOverlay = useCallback(() => {
        const canvas = overlayCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = renderWidth;
        canvas.height = renderHeight;
        ctx.clearRect(0, 0, renderWidth, renderHeight);

        // Drag preview (shown while dragging instead of static selection)
        if (dragPreviewPdfRect) {
            const tl = pdfToScreen(dragPreviewPdfRect[0], dragPreviewPdfRect[1], pageHeight, scale);
            const br = pdfToScreen(dragPreviewPdfRect[2], dragPreviewPdfRect[3], pageHeight, scale);
            ctx.save();
            ctx.strokeStyle = '#3A76F0';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
            ctx.setLineDash([]);
            ctx.restore();
        } else if (selectedAnnotIndex !== null && pageAnnotations[selectedAnnotIndex]) {
            // Static selection handles
            const r = pageAnnotations[selectedAnnotIndex].rect;
            const tl = pdfToScreen(r[0], r[1], pageHeight, scale);
            const br = pdfToScreen(r[2], r[3], pageHeight, scale);
            ctx.save();
            ctx.strokeStyle = '#3A76F0';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
            ctx.setLineDash([]);
            const hs = 5;
            ctx.fillStyle = '#3A76F0';
            [[tl.x, tl.y], [br.x, tl.y], [tl.x, br.y], [br.x, br.y]].forEach(([hx, hy]) => {
                ctx.fillRect(hx - hs, hy - hs, hs * 2, hs * 2);
            });
            ctx.restore();
        }

        // Drawing feedback
        if (isDrawing && drawStart && drawCurrent) {
            const x = Math.min(drawStart.x, drawCurrent.x);
            const y = Math.min(drawStart.y, drawCurrent.y);
            const w = Math.abs(drawCurrent.x - drawStart.x);
            const h = Math.abs(drawCurrent.y - drawStart.y);

            if (activeTool === 'freetext') {
                ctx.strokeStyle = '#3A76F0';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 4]);
                ctx.strokeRect(x, y, w, h);
                ctx.setLineDash([]);
            } else if (activeTool === 'redact') {
                ctx.fillStyle = '#dc262640';
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 3]);
                ctx.fillRect(x, y, w, h);
                ctx.strokeRect(x, y, w, h);
                ctx.setLineDash([]);
            } else if (['highlight', 'underline', 'strikethrough'].includes(activeTool)) {
                ctx.fillStyle = hexColor + '44';
                ctx.strokeStyle = hexColor;
                ctx.lineWidth = 1;
                ctx.fillRect(x, y, w, h);
                ctx.strokeRect(x, y, w, h);
            } else if (activeTool === 'rectangle') {
                ctx.strokeStyle = hexColor;
                ctx.lineWidth = properties.borderWidth;
                ctx.strokeRect(x, y, w, h);
            } else if (activeTool === 'circle') {
                ctx.strokeStyle = hexColor;
                ctx.lineWidth = properties.borderWidth;
                ctx.beginPath();
                ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Line / arrow preview
        if (isDrawing && drawStart && drawCurrent && (activeTool === 'line' || activeTool === 'arrow')) {
            ctx.strokeStyle = hexColor;
            ctx.lineWidth = properties.borderWidth;
            ctx.beginPath();
            ctx.moveTo(drawStart.x, drawStart.y);
            ctx.lineTo(drawCurrent.x, drawCurrent.y);
            ctx.stroke();

            if (activeTool === 'arrow') {
                const angle = Math.atan2(drawCurrent.y - drawStart.y, drawCurrent.x - drawStart.x);
                const hl = 12;
                ctx.beginPath();
                ctx.moveTo(drawCurrent.x, drawCurrent.y);
                ctx.lineTo(drawCurrent.x - hl * Math.cos(angle - Math.PI / 6), drawCurrent.y - hl * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(drawCurrent.x, drawCurrent.y);
                ctx.lineTo(drawCurrent.x - hl * Math.cos(angle + Math.PI / 6), drawCurrent.y - hl * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
        }

        // Freehand path
        if (inkPoints.length > 1) {
            ctx.strokeStyle = hexColor;
            ctx.lineWidth = properties.borderWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(inkPoints[0][0], inkPoints[0][1]);
            for (let i = 1; i < inkPoints.length; i++) ctx.lineTo(inkPoints[i][0], inkPoints[i][1]);
            ctx.stroke();
        }
    }, [renderWidth, renderHeight, isDrawing, drawStart, drawCurrent, inkPoints, activeTool, hexColor, properties.borderWidth, selectedAnnotIndex, pageAnnotations, pageHeight, scale, dragPreviewPdfRect]);

    useEffect(() => { drawOverlay(); }, [drawOverlay]);

    /* ---- Mouse helpers ---- */
    const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const canvas = overlayCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
        const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    /* ---- Mouse handlers ---- */

    const handleMouseDown = (e: React.MouseEvent) => {
        const coords = getCanvasCoords(e);
        if (!coords) return;

        setMobilePanelCollapsed(true);
        if (textEditState) return; // let overlay handle input

        if (activeTool === 'select') {
            const p = screenToPdf(coords.x, coords.y, pageHeight, scale);

            // Check corner handles and body of selected annotation for drag/resize
            if (selectedAnnotIndex !== null && pageAnnotations[selectedAnnotIndex]) {
                const r = pageAnnotations[selectedAnnotIndex].rect;
                const tl = pdfToScreen(r[0], r[1], pageHeight, scale);
                const br = pdfToScreen(r[2], r[3], pageHeight, scale);

                const corners: Array<[DragMode, number, number]> = [
                    ['resize-tl', tl.x, tl.y],
                    ['resize-tr', br.x, tl.y],
                    ['resize-bl', tl.x, br.y],
                    ['resize-br', br.x, br.y],
                ];

                for (const [mode, cx, cy] of corners) {
                    if (Math.abs(coords.x - cx) <= HANDLE_HIT_PX && Math.abs(coords.y - cy) <= HANDLE_HIT_PX) {
                        setDragMode(mode);
                        dragStateRef.current = { startX: coords.x, startY: coords.y, origRect: [...r] };
                        mupdf.getAnnotationGeometry(currentPage, selectedAnnotIndex).then(geo => {
                            if (dragStateRef.current) {
                                dragStateRef.current.origLinePoints = geo.linePoints;
                                dragStateRef.current.origInkList = geo.inkList;
                                dragStateRef.current.origQuadPoints = geo.quadPoints;
                            }
                        }).catch(() => { });
                        return;
                    }
                }

                // Body drag — move
                if (p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3]) {
                    setDragMode('move');
                    dragStateRef.current = { startX: coords.x, startY: coords.y, origRect: [...r] };
                    mupdf.getAnnotationGeometry(currentPage, selectedAnnotIndex).then(geo => {
                        if (dragStateRef.current) {
                            dragStateRef.current.origLinePoints = geo.linePoints;
                            dragStateRef.current.origInkList = geo.inkList;
                            dragStateRef.current.origQuadPoints = geo.quadPoints;
                        }
                    }).catch(() => { });
                    return;
                }
            }

            // Hit test all annotations for selection
            let found = false;
            for (let i = pageAnnotations.length - 1; i >= 0; i--) {
                const r = pageAnnotations[i].rect;
                if (p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3]) {
                    setSelectedAnnotIndex(i);
                    found = true;
                    break;
                }
            }
            if (!found) setSelectedAnnotIndex(null);
            return;
        }

        if (activeTool === 'eraser') { handleEraserClick(coords); return; }
        if (activeTool === 'freetext') {
            // Start drag to define text area
            freeTextDragStartClientRef.current = { x: e.clientX, y: e.clientY };
            setIsDrawing(true);
            setDrawStart(coords);
            setDrawCurrent(coords);
            return;
        }
        if (activeTool === 'sticky-note') { handleStickyNoteClick(coords); return; }
        if (activeTool === 'stamp') { handleStampClick(coords); return; }
        if (activeTool === 'image-stamp') { handleImageStampClick(coords); return; }

        setIsDrawing(true);
        setDrawStart(coords);
        setDrawCurrent(coords);
        if (activeTool === 'freehand') setInkPoints([[coords.x, coords.y]]);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const coords = getCanvasCoords(e);
        if (!coords) return;

        // Handle drag/resize
        if (dragMode && dragStateRef.current && selectedAnnotIndex !== null) {
            const ds = dragStateRef.current;
            const dx = (coords.x - ds.startX) / scale;
            const dy = (coords.y - ds.startY) / scale;
            const orig = ds.origRect;

            let newRect: number[];
            if (dragMode === 'move') {
                newRect = [orig[0] + dx, orig[1] + dy, orig[2] + dx, orig[3] + dy];
            } else if (dragMode === 'resize-tl') {
                newRect = [orig[0] + dx, orig[1] + dy, orig[2], orig[3]];
            } else if (dragMode === 'resize-tr') {
                newRect = [orig[0], orig[1] + dy, orig[2] + dx, orig[3]];
            } else if (dragMode === 'resize-bl') {
                newRect = [orig[0] + dx, orig[1], orig[2], orig[3] + dy];
            } else {
                newRect = [orig[0], orig[1], orig[2] + dx, orig[3] + dy]; // resize-br
            }
            setDragPreviewPdfRect(newRect);
            return;
        }

        // Update hover cursor for select tool
        if (activeTool === 'select' && selectedAnnotIndex !== null && pageAnnotations[selectedAnnotIndex]) {
            const r = pageAnnotations[selectedAnnotIndex].rect;
            const tl = pdfToScreen(r[0], r[1], pageHeight, scale);
            const br = pdfToScreen(r[2], r[3], pageHeight, scale);
            const p = screenToPdf(coords.x, coords.y, pageHeight, scale);

            const onHandle = [[tl.x, tl.y], [br.x, tl.y], [tl.x, br.y], [br.x, br.y]]
                .some(([cx, cy]) => Math.abs(coords.x - cx) <= HANDLE_HIT_PX && Math.abs(coords.y - cy) <= HANDLE_HIT_PX);

            if (onHandle) {
                setHoverCursor('resize');
            } else if (p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3]) {
                setHoverCursor('move');
            } else {
                setHoverCursor(null);
            }
        } else if (activeTool === 'select') {
            setHoverCursor(null);
        }

        if (!isDrawing) return;
        setDrawCurrent(coords);
        if (activeTool === 'freehand') setInkPoints(prev => [...prev, [coords.x, coords.y]]);
    };

    const handleMouseUp = async () => {
        // Finalize drag/resize
        if (dragMode && dragStateRef.current && selectedAnnotIndex !== null && dragPreviewPdfRect) {
            const finalRect = dragPreviewPdfRect;
            const ds = dragStateRef.current;
            const capturedDragMode = dragMode;
            const savedIndex = selectedAnnotIndex;

            setDragMode(null);
            setDragPreviewPdfRect(null);
            dragStateRef.current = null;

            try {
                const updates: Parameters<typeof mupdf.updateAnnotation>[0] = {
                    pageIndex: currentPage,
                    annotIndex: savedIndex,
                    rect: finalRect,
                };

                if (capturedDragMode === 'move') {
                    const dx = finalRect[0] - ds.origRect[0];
                    const dy = finalRect[1] - ds.origRect[1];

                    if (ds.origLinePoints && ds.origLinePoints.length >= 4) {
                        updates.linePoints = [
                            ds.origLinePoints[0] + dx, ds.origLinePoints[1] + dy,
                            ds.origLinePoints[2] + dx, ds.origLinePoints[3] + dy,
                        ];
                    }
                    if (ds.origInkList) {
                        updates.inkList = ds.origInkList.map(stroke =>
                            stroke.map(pt => [pt[0] + dx, pt[1] + dy])
                        );
                    }
                    if (ds.origQuadPoints) {
                        updates.quadPoints = ds.origQuadPoints.map(quad => {
                            const result = [...quad];
                            for (let i = 0; i < result.length; i += 2) {
                                result[i] += dx;
                                result[i + 1] += dy;
                            }
                            return result;
                        });
                    }
                }

                await mupdf.updateAnnotation(updates);
                setHasChanges(true);
                await refreshCurrentPage();
            } catch (err) {
                console.error('Failed to update annotation geometry:', err);
            }
            return;
        }

        // Clear any incomplete drag
        if (dragMode) {
            setDragMode(null);
            setDragPreviewPdfRect(null);
            dragStateRef.current = null;
            return;
        }

        // Drawing tools
        if (!isDrawing || !drawStart || !drawCurrent) { setIsDrawing(false); return; }

        const s = drawStart;
        const c = drawCurrent;
        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);

        if (activeTool === 'freetext') {
            handleFreeTextClick(s, c);
        } else if (['highlight', 'underline', 'strikethrough'].includes(activeTool)) {
            await handleMarkupDone(s, c);
        } else if (activeTool === 'rectangle') {
            await handleShapeDone('Square', s, c);
        } else if (activeTool === 'circle') {
            await handleShapeDone('Circle', s, c);
        } else if (activeTool === 'line') {
            await handleLineDone(s, c, false);
        } else if (activeTool === 'arrow') {
            await handleLineDone(s, c, true);
        } else if (activeTool === 'redact') {
            await handleRedactDone(s, c);
        } else if (activeTool === 'freehand') {
            await handleInkDone();
        }
    };

    /* ---- Tool handlers ---- */

    const handleMarkupDone = async (start: { x: number; y: number }, end: { x: number; y: number }) => {
        const rect: Rect = {
            x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y),
        };
        if (rect.width < 5 || rect.height < 5) return;

        const pdfRect = screenRectToPdfRect(rect, pageHeight, scale);
        const typeMap: Record<string, string> = {
            highlight: 'Highlight', underline: 'Underline', strikethrough: 'StrikeOut',
        };

        const quad = [
            pdfRect.x, pdfRect.y,
            pdfRect.x + pdfRect.width, pdfRect.y,
            pdfRect.x, pdfRect.y + pdfRect.height,
            pdfRect.x + pdfRect.width, pdfRect.y + pdfRect.height,
        ];

        await addAnnotationAndRefresh({
            pageIndex: currentPage,
            type: typeMap[activeTool] as any,
            color: rgb01(properties.r, properties.g, properties.b),
            opacity: properties.opacity,
            quadPoints: [quad],
        });
    };

    const handleShapeDone = async (type: 'Square' | 'Circle', start: { x: number; y: number }, end: { x: number; y: number }) => {
        const rect: Rect = {
            x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y),
        };
        if (rect.width < 5 || rect.height < 5) return;

        const pdfRect = screenRectToPdfRect(rect, pageHeight, scale);
        await addAnnotationAndRefresh({
            pageIndex: currentPage, type,
            rect: [pdfRect.x, pdfRect.y, pdfRect.x + pdfRect.width, pdfRect.y + pdfRect.height],
            color: rgb01(properties.r, properties.g, properties.b),
            borderWidth: properties.borderWidth,
        });
    };

    const handleLineDone = async (start: { x: number; y: number }, end: { x: number; y: number }, isArrow: boolean) => {
        if (Math.hypot(end.x - start.x, end.y - start.y) < 5) return;

        const p1 = screenToPdf(start.x, start.y, pageHeight, scale);
        const p2 = screenToPdf(end.x, end.y, pageHeight, scale);

        await addAnnotationAndRefresh({
            pageIndex: currentPage,
            type: 'Line',
            color: rgb01(properties.r, properties.g, properties.b),
            borderWidth: properties.borderWidth,
            linePoints: [p1.x, p1.y, p2.x, p2.y],
            lineEndingEnd: isArrow ? 'ClosedArrow' : 'None',
        });
    };

    const handleRedactDone = async (start: { x: number; y: number }, end: { x: number; y: number }) => {
        const rect: Rect = {
            x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y),
        };
        if (rect.width < 5 || rect.height < 5) return;

        const pdfRect = screenRectToPdfRect(rect, pageHeight, scale);
        await addAnnotationAndRefresh({
            pageIndex: currentPage,
            type: 'Redact',
            rect: [pdfRect.x, pdfRect.y, pdfRect.x + pdfRect.width, pdfRect.y + pdfRect.height],
            color: rgb01(properties.r, properties.g, properties.b),
        });
    };

    const handleInkDone = async () => {
        if (inkPoints.length < 2) { setInkPoints([]); return; }

        const pdfPoints = inkPoints.map(([x, y]) => {
            const p = screenToPdf(x, y, pageHeight, scale);
            return [p.x, p.y] as [number, number];
        });

        await addAnnotationAndRefresh({
            pageIndex: currentPage,
            type: 'Ink',
            color: rgb01(properties.r, properties.g, properties.b),
            borderWidth: properties.borderWidth,
            inkList: [pdfPoints],
        });

        setInkPoints([]);
    };

    const handleFreeTextClick = (
        start: { x: number; y: number },
        end: { x: number; y: number },
    ) => {
        const pageDivEl = activePageDivRef.current;
        if (!pageDivEl) return;
        const pageRect = pageDivEl.getBoundingClientRect();

        // Use drag start client coords for overlay position
        const startClient = freeTextDragStartClientRef.current;
        const cssX = startClient ? startClient.x - pageRect.left : start.x / dpr;
        const cssY = startClient ? startClient.y - pageRect.top : start.y / dpr;
        freeTextDragStartClientRef.current = null;

        // If drag was intentional (>15px), use drag width; otherwise default
        const dragWidthCss = Math.abs(end.x - start.x) / dpr;
        const boxWidth = dragWidthCss > 15 ? dragWidthCss : undefined;

        const p = screenToPdf(start.x, start.y, pageHeight, scale);
        setTextEditState({
            cssX,
            cssY,
            boxWidth,
            pdfX: p.x,
            pdfY: p.y,
            pageIdx: currentPage,
        });
    };

    const handleTextEditCommit = useCallback(async (text: string, opts: TextCommitOptions) => {
        if (!textEditState) return;
        const saved = textEditState;
        setTextEditState(null);

        // Remove old annotation when re-editing
        if (saved.annotIndex !== undefined) {
            await mupdf.deleteAnnotation(saved.pageIdx, saved.annotIndex);
        }

        const { pdfX, pdfY, pageIdx, boxWidth } = saved;
        // Width: from drag (CSS px → PDF pts) or estimate from text length
        const pdfW = boxWidth
            ? boxWidth / zoom
            : Math.max(40, text.length * opts.fontSize * 0.6);
        const pdfH = opts.fontSize * 2;

        try {
            await mupdf.addAnnotation({
                pageIndex: pageIdx,
                type: 'FreeText',
                rect: [pdfX, pdfY, pdfX + pdfW, pdfY + pdfH],
                textColor: opts.textColor,
                transparent: true,
                contents: text,
                fontSize: opts.fontSize,
                fontName: opts.fontName,
            });
            setHasChanges(true);
            await refreshCurrentPage();
        } catch (err) {
            console.error('Failed to add text annotation:', err);
        }
    }, [textEditState, mupdf, zoom, refreshCurrentPage]);

    const handleTextEditCancel = useCallback(() => {
        setTextEditState(null);
    }, []);

    const handleStickyNoteClick = async (coords: { x: number; y: number }) => {
        const text = properties.text.trim();
        if (!text) return;

        const p = screenToPdf(coords.x, coords.y, pageHeight, scale);

        await addAnnotationAndRefresh({
            pageIndex: currentPage,
            type: 'Text',
            rect: [p.x, p.y, p.x + 24, p.y + 24],
            color: rgb01(properties.r, properties.g, properties.b),
            contents: text,
        });
    };

    const handleStampClick = async (coords: { x: number; y: number }) => {
        if (!selectedStamp) { setShowStampPicker(true); return; }

        const p = screenToPdf(coords.x, coords.y, pageHeight, scale);
        const w = selectedStamp.label.length * 10 + 40;
        const h = 30;

        await addAnnotationAndRefresh({
            pageIndex: currentPage,
            type: 'Stamp',
            rect: [p.x, p.y, p.x + w, p.y + h],
            contents: selectedStamp.label,
            color: hexToRgb01(selectedStamp.color),
            iconName: STAMP_ICON_MAP[selectedStamp.label],
        });
    };

    const handleImageStampClick = async (coords: { x: number; y: number }) => {
        if (!pendingImage) { imageInputRef.current?.click(); return; }

        const p = screenToPdf(coords.x, coords.y, pageHeight, scale);
        const maxDim = 200;
        const ratio = pendingImage.height / pendingImage.width;
        const w = Math.min(maxDim, pendingImage.width);
        const h = w * ratio;

        await addAnnotationAndRefresh({
            pageIndex: currentPage,
            type: 'Stamp',
            rect: [p.x, p.y, p.x + w, p.y + h],
            imageData: pendingImage.data,
        });
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (activeTool !== 'select' && activeTool !== 'freetext') return;
        const coords = getCanvasCoords(e);
        if (!coords) return;
        const p = screenToPdf(coords.x, coords.y, pageHeight, scale);

        for (let i = pageAnnotations.length - 1; i >= 0; i--) {
            const annot = pageAnnotations[i];
            if (annot.type !== 'FreeText') continue;
            const r = annot.rect;
            if (p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3]) {
                if (!activePageDivRef.current) return;
                const tl = pdfToScreen(r[0], r[1], pageHeight, scale);
                const cssX = tl.x / dpr;
                const cssY = tl.y / dpr;
                setTextEditState({
                    cssX,
                    cssY,
                    pdfX: r[0],
                    pdfY: r[1],
                    pageIdx: currentPage,
                    annotIndex: i,
                    initialText: annot.contents || '',
                });
                break;
            }
        }
    };

    const handleEraserClick = async (coords: { x: number; y: number }) => {
        const p = screenToPdf(coords.x, coords.y, pageHeight, scale);
        for (let i = pageAnnotations.length - 1; i >= 0; i--) {
            const r = pageAnnotations[i].rect;
            if (p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3]) {
                await deleteAnnotationAndRefresh(i);
                return;
            }
        }
    };

    // Image upload
    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const imageFile = e.target.files?.[0];
        if (!imageFile) return;

        if (!['image/png', 'image/jpeg'].includes(imageFile.type)) {
            alert('Only PNG and JPEG images are supported.');
            return;
        }

        const arrayBuffer = await imageFile.arrayBuffer();
        const img = new Image();
        const url = URL.createObjectURL(imageFile);
        img.src = url;
        await new Promise(resolve => { img.onload = resolve; });
        URL.revokeObjectURL(url);

        setPendingImage({
            data: arrayBuffer,
            name: imageFile.name,
            width: img.naturalWidth,
            height: img.naturalHeight,
        });

        e.target.value = '';
    }, []);

    /* ---- Keyboard shortcuts ---- */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if ((e.target as HTMLElement).isContentEditable) return;

            const key = e.key.toLowerCase();
            if (key === 'v') setActiveTool('select');
            else if (key === 'h') setActiveTool('highlight');
            else if (key === 'u') setActiveTool('underline');
            else if (key === 's' && !e.ctrlKey) setActiveTool('strikethrough');
            else if (key === 'd') setActiveTool('freehand');
            else if (key === 't') setActiveTool('freetext');
            else if (key === 'n') setActiveTool('sticky-note');
            else if (key === 'p') setActiveTool('stamp');
            else if (key === 'i') setActiveTool('image-stamp');
            else if (key === 'x') setActiveTool('redact');
            else if (key === 'e') setActiveTool('eraser');
            else if (key === '1') setActiveTool('rectangle');
            else if (key === '2') setActiveTool('circle');
            else if (key === '3') setActiveTool('line');
            else if (key === '4') setActiveTool('arrow');
            else if ((key === 'delete' || key === 'backspace') && selectedAnnotIndexRef.current !== null) {
                const idx = selectedAnnotIndexRef.current;
                deleteAnnotationAndRefresh(idx);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [deleteAnnotationAndRefresh]);

    /* ---- Save / Download ---- */
    const handleSave = useCallback(async () => {
        if (!file) return;
        setIsProcessing(true);
        try {
            // Auto-apply any redactions on current page before saving
            if (pageAnnotations.some(a => a.type === 'Redact')) {
                await mupdf.applyRedactions(currentPage);
            }
            const result = await mupdf.save();
            const safeBytes = new Uint8Array(result.buffer);
            const blob = new Blob([safeBytes], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            downloadBlob(blob, sanitized);
            setToastInfo({ filename: sanitized, blobUrl });
            setHasChanges(false);
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save annotated PDF.');
        } finally {
            setIsProcessing(false);
        }
    }, [mupdf, sanitized, file, currentPage, pageAnnotations]);

    const handleCloseToast = useCallback(() => {
        if (toastInfo?.blobUrl) URL.revokeObjectURL(toastInfo.blobUrl);
        setToastInfo(null);
    }, [toastInfo]);

    /* ---- Cursor ---- */
    const cursorClass = useMemo(() => {
        if (activeTool === 'select') {
            if (dragMode?.startsWith('resize') || hoverCursor === 'resize') return 'cursor-nwse-resize';
            if (dragMode === 'move' || hoverCursor === 'move') return 'cursor-move';
            return 'cursor-default';
        }
        switch (activeTool) {
            case 'freetext': return 'cursor-text';
            case 'freehand': return 'cursor-crosshair';
            case 'eraser': return 'cursor-pointer';
            case 'image-stamp': case 'stamp': case 'sticky-note': return 'cursor-copy';
            default: return 'cursor-crosshair';
        }
    }, [activeTool, dragMode, hoverCursor]);

    /* ---- Annotation → AppliedChange mapping ---- */
    const annotationChanges = useMemo<AppliedChange[]>(() => {
        const typeCounts: Record<string, number> = {};
        return pageAnnotations.map((annot, idx) => {
            typeCounts[annot.type] = (typeCounts[annot.type] || 0) + 1;
            const label = `${annot.type} ${typeCounts[annot.type]}`;
            const r = Math.round((annot.color?.[0] ?? 0) * 255);
            const g = Math.round((annot.color?.[1] ?? 0) * 255);
            const b = Math.round((annot.color?.[2] ?? 0) * 255);
            const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
            return {
                id: `annot-${idx}`,
                description: label,
                color: hex,
                isSelected: selectedAnnotIndex === idx,
                onClick: () => setSelectedAnnotIndex(prev => prev === idx ? null : idx),
                onUndo: () => deleteAnnotationAndRefresh(idx),
            };
        });
    }, [pageAnnotations, selectedAnnotIndex, deleteAnnotationAndRefresh]);

    const handleResetAnnotations = useCallback(async () => {
        for (let i = pageAnnotations.length - 1; i >= 0; i--) {
            await mupdf.deleteAnnotation(currentPage, i);
        }
        setHasChanges(true);
        setSelectedAnnotIndex(null);
        await refreshCurrentPage();
    }, [pageAnnotations, mupdf, currentPage, refreshCurrentPage]);

    /* ---- Render ---- */
    return (
        <div className="fixed inset-0 flex flex-col bg-[#09090B] text-zinc-100 overflow-hidden">

            {/* ── Top Bar ── */}
            <header className="h-[52px] border-b border-zinc-800 bg-[#141415] shrink-0 flex items-center justify-between px-4 z-40">
                {/* Left: branding + file info */}
                <div className="flex items-center gap-5 min-w-0">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
                        <div className="w-8 h-8 bg-[#3A76F0] rounded-lg flex items-center justify-center shadow-sm">
                            <Logo className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-zinc-100 text-[15px] tracking-tight">Modufile</span>
                    </Link>

                    <div className="h-6 w-px bg-zinc-800 shrink-0" />

                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        {file ? (
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="min-w-0">
                                    <p className="text-[13px] text-zinc-200 font-medium leading-tight truncate max-w-[160px] xl:max-w-[260px]">{file.name}</p>
                                    <p className="text-[11px] text-zinc-500 leading-tight">{formatFileSize(file.size)} · {file.pageCount}p</p>
                                </div>
                                <button onClick={removeFile} className="p-1 hover:bg-zinc-800 rounded transition-colors shrink-0">
                                    <X className="w-3.5 h-3.5 text-zinc-500" />
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-[13px] text-zinc-200 font-medium leading-tight">PDF Editor</p>
                                <p className="text-[11px] text-zinc-500 leading-tight">Annotate, draw, stamp PDFs in-browser</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center: zoom (desktop only) */}
                <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-[#1F1F22] rounded border border-zinc-800/60 p-0.5 h-8">
                        <button
                            onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] text-zinc-400 font-medium w-10 text-center">{Math.round(zoom * 100)}%</span>
                        <button
                            onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
                            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Right: nav links + save */}
                <div className="flex items-center gap-4 shrink-0">
                    <nav className="hidden lg:flex items-center gap-5">
                        <Link prefetch={false} href="/pdf" className="text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">PDF Tools</Link>
                        <Link prefetch={false} href="/image" className="text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Image Tools</Link>
                        <Link prefetch={false} href="/ocr" className="text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">OCR</Link>
                    </nav>

                    <button
                        onClick={handleSave}
                        disabled={isProcessing || !file}
                        className="h-8 px-4 inline-flex items-center justify-center gap-2 rounded-md bg-[#3A76F0] hover:bg-[#2563EB] text-white transition-colors text-[13px] font-medium disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        <span>Save</span>
                    </button>
                </div>
            </header>

            {/* ── Mobile: horizontal toolbar ── */}
            <div className="md:hidden shrink-0">
                <AnnotationToolbar
                    activeTool={activeTool}
                    direction="horizontal"
                    onToolChange={(tool) => {
                        setActiveTool(tool);
                        if (tool === 'stamp') setShowStampPicker(true);
                        else setShowStampPicker(false);
                    }}
                />
            </div>

            {/* ── Main workspace ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: vertical toolbar (desktop only) */}
                <div className="hidden md:flex shrink-0 p-2 relative flex-col">
                    <AnnotationToolbar
                        activeTool={activeTool}
                        direction="vertical"
                        onToolChange={(tool) => {
                            setActiveTool(tool);
                            if (tool === 'stamp') setShowStampPicker(true);
                            else setShowStampPicker(false);
                        }}
                    />
                    <AnimatePresence>
                        {showStampPicker && (
                            <StampPicker
                                onSelect={(stamp) => {
                                    setSelectedStamp(stamp);
                                    setActiveTool('stamp');
                                    setShowStampPicker(false);
                                }}
                                onClose={() => setShowStampPicker(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Canvas area — vertically scrollable, all pages stacked */}
                <div
                    ref={canvasContainerRef}
                    className="flex-1 overflow-auto bg-zinc-950 flex flex-col items-center py-6 px-4"
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Logo isProcessing className="w-16 h-16 text-[#3A76F0]" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-zinc-200 mb-1">Importing PDF...</p>
                                <p className="text-xs text-zinc-500">Preparing editor</p>
                            </div>
                        </div>
                    ) : !file ? (
                        <div className="w-full max-w-lg">
                            <Dropzone
                                onFilesAdded={handleFileAdded}
                                acceptedTypes={['application/pdf']}
                                maxFiles={1}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 w-full">
                            {Array.from({ length: file.pageCount }, (_, idx) => {
                                const rendered = renderedPages.get(idx);
                                const isRendering = renderingPages.has(idx);
                                const isActive = currentPage === idx;
                                const pageInfo = file.pages[idx];
                                const w = rendered?.w ?? Math.round((pageInfo?.width ?? 612) * scale);
                                const h = rendered?.h ?? Math.round((pageInfo?.height ?? 792) * scale);
                                const dispW = Math.round(w / dpr);
                                const dispH = Math.round(h / dpr);

                                return (
                                    <div key={idx} className="flex flex-col items-center">
                                        <span className="text-[10px] text-zinc-600 mb-1 tracking-wide">
                                            Page {idx + 1}
                                        </span>
                                        <div
                                            ref={isActive ? activePageDivRef : undefined}
                                            className={`relative inline-block shadow-2xl rounded-sm transition-all duration-150 ${
                                                isActive ? 'ring-2 ring-[#3A76F0]/60 ring-offset-2 ring-offset-zinc-950' : ''
                                            }`}
                                            onClick={() => {
                                                if (!isActive) setCurrentPage(idx);
                                            }}
                                        >
                                            {rendered ? (
                                                <img
                                                    src={rendered.url}
                                                    alt={`Page ${idx + 1}`}
                                                    style={{ width: dispW, height: dispH }}
                                                    className="block select-none"
                                                    draggable={false}
                                                />
                                            ) : (
                                                <div
                                                    style={{ width: dispW, height: dispH }}
                                                    className="bg-white flex items-center justify-center"
                                                >
                                                    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                                                </div>
                                            )}

                                            {/* Interactive canvas — only on active page */}
                                            {isActive && (
                                                <canvas
                                                    ref={overlayCanvasRef}
                                                    width={renderWidth}
                                                    height={renderHeight}
                                                    className={`absolute inset-0 ${textEditState ? 'pointer-events-none' : cursorClass}`}
                                                    style={{ width: displayWidth, height: displayHeight }}
                                                    onMouseDown={handleMouseDown}
                                                    onMouseMove={handleMouseMove}
                                                    onMouseUp={handleMouseUp}
                                                    onDoubleClick={handleDoubleClick}
                                                    onMouseLeave={() => {
                                                        setHoverCursor(null);
                                                        if (isDrawing && activeTool !== 'freehand') handleMouseUp();
                                                    }}
                                                />
                                            )}

                                            {/* Rich text overlay — shown when freetext tool is active */}
                                            {isActive && textEditState && textEditState.pageIdx === idx && (
                                                <TextEditOverlay
                                                    x={textEditState.cssX}
                                                    y={textEditState.cssY}
                                                    boxWidth={textEditState.boxWidth}
                                                    initialText={textEditState.initialText}
                                                    initialFontSize={properties.fontSize}
                                                    initialColor={`#${[properties.textR, properties.textG, properties.textB].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`}
                                                    onCommit={handleTextEditCommit}
                                                    onCancel={handleTextEditCancel}
                                                />
                                            )}

                                            {isRendering && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 rounded-sm">
                                                    <Logo isProcessing className="w-10 h-10 text-[#3A76F0] mb-2" />
                                                    <p className="text-xs text-zinc-500">Rendering...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: Properties panel */}
                <PropertyPanel
                    activeTool={activeTool}
                    properties={properties}
                    onPropertiesChange={(updates) => setProperties(prev => ({ ...prev, ...updates }))}
                    onImageUpload={() => imageInputRef.current?.click()}
                    pendingImageName={pendingImage?.name}
                    onClearImage={() => setPendingImage(null)}
                    annotations={pageAnnotations}
                    selectedAnnotationIndex={selectedAnnotIndex}
                    onSelectAnnotation={setSelectedAnnotIndex}
                    onDeleteAnnotation={deleteAnnotationAndRefresh}
                    onUpdateAnnotation={updateAnnotationAndRefresh}
                    appliedChanges={annotationChanges}
                    onResetChanges={pageAnnotations.length > 0 ? handleResetAnnotations : undefined}
                    outputFilename={outputFilename}
                    onFilenameChange={setOutputFilename}
                    collapsed={mobilePanelCollapsed}
                    onToggleCollapse={() => setMobilePanelCollapsed(p => !p)}
                />
            </div>

            {/* Hidden image input */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleImageUpload}
            />

            {/* Download toast */}
            <AnimatePresence>
                {toastInfo && (
                    <DownloadToast
                        filename={toastInfo.filename}
                        blobUrl={toastInfo.blobUrl}
                        onClose={handleCloseToast}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
