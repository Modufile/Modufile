'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dropzone, FileProcessingOverlay, Logo } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolFaqs } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, EyeOff, ChevronLeft, ChevronRight, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { PDFDocument, rgb } from 'pdf-lib';

interface PDFFile {
    name: string;
    file: File;
    size: number;
    pageCount: number;
}

interface RedactRect {
    id: string;
    pageIndex: number;
    // Coordinates stored in canvas-pixel space (matches PDF.js render viewport)
    x: number;
    y: number;
    width: number;
    height: number;
    // Canvas internal dimensions at draw time for accurate coordinate mapping
    canvasWidth: number;
    canvasHeight: number;
}

const WORKER_SRC = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

export default function RedactPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [redactAreas, setRedactAreas] = useState<RedactRect[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number } | null>(null);
    const [pageRendered, setPageRendered] = useState(false);
    const [redactColor, setRedactColor] = useState('#000000');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const pdfDocRef = useRef<any>(null);
    const pageScaleRef = useRef(1);

    const handleFileAdded = useCallback(async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        setIsLoading(true);
        // Yield two frames so React can paint the loading overlay before heavy work
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
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
            setRedactAreas([]);
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

    // Render current page using pdfjs-dist
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

    const [hoveredRedactId, setHoveredRedactId] = useState<string | null>(null);
    const [selectedRedactId, setSelectedRedactId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<{
        type: 'move' | 'resize';
        id: string;
        startX: number;
        startY: number;
        initialRect: RedactRect;
        handle?: string; // 'nw', 'ne', 'sw', 'se'
    } | null>(null);

    // Global drag handler — deltas are converted to canvas-pixel space
    useEffect(() => {
        if (!dragState) return;

        const handleGlobalMove = (e: MouseEvent) => {
            if (!overlayRef.current || !canvasRef.current) return;
            const overlayRect = overlayRef.current.getBoundingClientRect();
            const canvas = canvasRef.current;

            // CSS-to-canvas ratio for converting mouse deltas
            const cssToCanvasX = canvas.width / overlayRect.width;
            const cssToCanvasY = canvas.height / overlayRect.height;

            // Calculate delta in canvas-pixel space
            const dx = (e.clientX - dragState.startX) * cssToCanvasX;
            const dy = (e.clientY - dragState.startY) * cssToCanvasY;

            setRedactAreas(prev => prev.map(r => {
                if (r.id !== dragState.id) return r;

                let newR = { ...r };
                const init = dragState.initialRect;

                if (dragState.type === 'move') {
                    newR.x = init.x + dx;
                    newR.y = init.y + dy;
                    // Clamp to canvas bounds
                    newR.x = Math.max(0, Math.min(newR.x, canvas.width - newR.width));
                    newR.y = Math.max(0, Math.min(newR.y, canvas.height - newR.height));
                } else if (dragState.type === 'resize' && dragState.handle) {
                    // Resize logic (all in canvas-pixel space)
                    if (dragState.handle.includes('e')) {
                        newR.width = Math.max(10, init.width + dx);
                    }
                    if (dragState.handle.includes('s')) {
                        newR.height = Math.max(10, init.height + dy);
                    }
                    if (dragState.handle.includes('w')) {
                        const maxDelta = init.width - 10;
                        const validDx = Math.min(dx, maxDelta);
                        newR.x = init.x + validDx;
                        newR.width = init.width - validDx;
                    }
                    if (dragState.handle.includes('n')) {
                        const maxDelta = init.height - 10;
                        const validDy = Math.min(dy, maxDelta);
                        newR.y = init.y + validDy;
                        newR.height = init.height - validDy;
                    }
                }
                return newR;
            }));
        };

        const handleGlobalUp = () => {
            setDragState(null);
        };

        window.addEventListener('mousemove', handleGlobalMove);
        window.addEventListener('mouseup', handleGlobalUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
        };
    }, [dragState]);

    const startDrag = (e: React.MouseEvent, id: string, type: 'move' | 'resize', handle?: string) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent text selection
        const r = redactAreas.find(area => area.id === id);
        if (!r) return;

        setSelectedRedactId(id);
        setDragState({
            type,
            id,
            startX: e.clientX,
            startY: e.clientY,
            initialRect: { ...r },
            handle
        });
    };

    // Drawing handlers — coordinates are stored in canvas-pixel space
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drawing if we are NOT interacting with a box
        if (dragState) return;

        if (!overlayRef.current || !canvasRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;
        const cssToCanvasX = canvas.width / rect.width;
        const cssToCanvasY = canvas.height / rect.height;

        // Deselect if clicking empty space
        setSelectedRedactId(null);

        setIsDrawing(true);
        setDrawStart({ x: (e.clientX - rect.left) * cssToCanvasX, y: (e.clientY - rect.top) * cssToCanvasY });
        setCurrentDraw({ x: (e.clientX - rect.left) * cssToCanvasX, y: (e.clientY - rect.top) * cssToCanvasY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !overlayRef.current || !canvasRef.current) return;
        const rect = overlayRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;
        const cssToCanvasX = canvas.width / rect.width;
        const cssToCanvasY = canvas.height / rect.height;
        setCurrentDraw({ x: (e.clientX - rect.left) * cssToCanvasX, y: (e.clientY - rect.top) * cssToCanvasY });
    };

    const handleMouseUp = () => {
        if (!isDrawing || !drawStart || !currentDraw) {
            setIsDrawing(false);
            return;
        }

        const x = Math.min(drawStart.x, currentDraw.x);
        const y = Math.min(drawStart.y, currentDraw.y);
        const w = Math.abs(currentDraw.x - drawStart.x);
        const h = Math.abs(currentDraw.y - drawStart.y);

        if (w > 5 && h > 5) {
            const canvas = canvasRef.current;
            setRedactAreas(prev => [...prev, {
                id: crypto.randomUUID(),
                pageIndex: currentPage,
                x, y, width: w, height: h,
                canvasWidth: canvas?.width ?? 1,
                canvasHeight: canvas?.height ?? 1,
            }]);
        }

        setIsDrawing(false);
        setDrawStart(null);
        setCurrentDraw(null);
    };

    const removeRedact = (id: string) => {
        setRedactAreas(prev => prev.filter(r => r.id !== id));
    };

    const currentPageRedacts = redactAreas.filter(r => r.pageIndex === currentPage);

    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<{
        pageIndex: number,
        rects: { x: number, y: number, width: number, height: number }[]
    }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const handleSearch = async () => {
        if (!file || !searchText.trim()) return;
        setIsSearching(true);
        setSearchResults([]);
        setShowSearchResults(true);

        try {
            const pdfjs = await import('pdfjs-dist');
            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
            }

            const results: { pageIndex: number, rects: any[] }[] = [];

            let doc = pdfDocRef.current;
            if (!doc) {
                const buf = await file.file.arrayBuffer();
                doc = await pdfjs.getDocument({ data: buf }).promise;
                pdfDocRef.current = doc;
            }

            const query = searchText.toLowerCase();

            for (let i = 0; i < file.pageCount; i++) {
                const page = await doc.getPage(i + 1);
                const textContent = await page.getTextContent();
                const viewport = page.getViewport({ scale: 1.5 });

                // Build full page string and map indices to items
                let fullText = '';
                const itemMap: { index: number, startChar: number, endChar: number, item: any }[] = [];

                for (const item of textContent.items as any[]) {
                    // Normalize checking: insert space if items are far apart? 
                    // For now, simple concatenation. Ideally check relative coords for spaces.
                    // Or usually PDF text items might have spaces at end.
                    const startChar = fullText.length;
                    const str = item.str;
                    fullText += str;
                    itemMap.push({
                        index: itemMap.length,
                        startChar,
                        endChar: startChar + str.length,
                        item
                    });
                    // Heuristic: If x distance > char width, append space? 
                    // Let's rely on PDF content often having spaces or being separate words.
                    // A safer "Find" often ignores whitespace differences or strictly matches chars.
                    // Let's stick to strict char sequence for now, but maybe ignore case.
                }

                const pageRects: any[] = [];
                const lowerFullText = fullText.toLowerCase();
                let searchIndex = 0;

                while (true) {
                    const foundIndex = lowerFullText.indexOf(query, searchIndex);
                    if (foundIndex === -1) break;

                    const endIndex = foundIndex + query.length;

                    // Find which items this match covers
                    const affectedItems = itemMap.filter(m =>
                        (m.startChar <= foundIndex && m.endChar > foundIndex) || // Starts in this item
                        (m.startChar >= foundIndex && m.endChar <= endIndex) || // Fully inside
                        (m.startChar < endIndex && m.endChar >= endIndex)       // Ends in this item
                    );

                    for (const m of affectedItems) {
                        // Calculate overlap
                        const matchStartInItem = Math.max(0, foundIndex - m.startChar);
                        const matchEndInItem = Math.min(m.item.str.length, endIndex - m.startChar);

                        // Calculate sub-rect width based on char approximation
                        // item.width is total width.
                        const charWidth = m.item.width / m.item.str.length;

                        // Transform is [scaleX, skewY, skewX, scaleY, x, y]
                        // PDF coordinates. x increases to right.
                        const tx = m.item.transform;
                        const itemX = tx[4];
                        const itemY = tx[5];
                        // Height: approx from transform scaleY (tx[3]) or scaleX (tx[0]) if rotate
                        const itemH = Math.hypot(tx[2], tx[3]);

                        // Calculate offset X and width of the substring
                        // This assumes horizontal LTR text.
                        const subX = itemX + (matchStartInItem * charWidth);
                        const subW = (matchEndInItem - matchStartInItem) * charWidth;

                        const pdfRect = [subX, itemY, subX + subW, itemY + itemH];
                        const viewRect = viewport.convertToViewportRectangle(pdfRect);

                        // Normalize: convertToViewportRectangle can return Y-swapped values
                        // because PDF Y-axis (bottom-up) → viewport Y-axis (top-down)
                        const left = Math.min(viewRect[0], viewRect[2]);
                        const top = Math.min(viewRect[1], viewRect[3]);
                        const right = Math.max(viewRect[0], viewRect[2]);
                        const bottom = Math.max(viewRect[1], viewRect[3]);

                        pageRects.push({
                            x: left,
                            y: top,
                            width: right - left,
                            height: bottom - top
                        });
                    }

                    searchIndex = foundIndex + 1;
                }

                if (pageRects.length > 0) {
                    results.push({ pageIndex: i, rects: pageRects });
                }
            }
            setSearchResults(results);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };




    const handleApplyAll = async () => {
        if (!file) return;
        setIsProcessing(true);
        try {
            const pdfjs = await import('pdfjs-dist');
            let doc = pdfDocRef.current;
            if (!doc) {
                const buf = await file.file.arrayBuffer();
                doc = await pdfjs.getDocument({ data: buf }).promise;
            }

            const newAreas: RedactRect[] = [...redactAreas];

            for (const res of searchResults) {
                const page = await doc.getPage(res.pageIndex + 1);
                const viewport = page.getViewport({ scale: 1.5 });

                res.rects.forEach(r => {
                    newAreas.push({
                        id: crypto.randomUUID(),
                        pageIndex: res.pageIndex,
                        x: r.x,
                        y: r.y,
                        width: r.width,
                        height: r.height,
                        canvasWidth: viewport.width,
                        canvasHeight: viewport.height
                    });
                });
            }
            setRedactAreas(newAreas);
            setSearchResults([]);
            setShowSearchResults(false);
        } catch (e) { console.error(e) }
        finally { setIsProcessing(false); }
    };





    const applySearchResults = () => {
        // This function is superseded by handleApplyAll which is async.
        // Kept as a no-op to avoid dead references.
    };




    const handleSave = async () => {
        if (!file || redactAreas.length === 0) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();

            // Import MuPDF dynamically from public to bypass Webpack bundling issues
            // @ts-ignore
            const mupdf = await import(/* webpackIgnore: true */ '/lib/mupdf/mupdf.js');

            // Also import pdfjs for coordinate conversion
            const pdfjs = await import('pdfjs-dist');
            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
            }
            const pdfjsDoc = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise; // slice to copy?

            // Create MuPDF document
            const docGeneric = mupdf.Document.openDocument(new Uint8Array(arrayBuffer), 'application/pdf');
            const doc = docGeneric.asPDF();
            if (!doc) throw new Error('Document is not a valid PDF');

            const redactsByPage = new Map<number, RedactRect[]>();
            redactAreas.forEach(r => {
                const list = redactsByPage.get(r.pageIndex) || [];
                list.push(r);
                redactsByPage.set(r.pageIndex, list);
            });

            // Parse hex color once
            const cr = parseInt(redactColor.slice(1, 3), 16) / 255;
            const cg = parseInt(redactColor.slice(3, 5), 16) / 255;
            const cb = parseInt(redactColor.slice(5, 7), 16) / 255;

            // Iterate over pages that have redactions
            for (const [pageIndex, areas] of redactsByPage) {
                const page = doc.loadPage(pageIndex) as any;

                // Get PDF.js page to reconstruct the viewport that matches the user's view
                const pdfjsPage = await pdfjsDoc.getPage(pageIndex + 1);

                // Get unscaled viewport to determine base dimensions
                const unscaledViewport = pdfjsPage.getViewport({ scale: 1.0 });

                for (const rect of areas) {
                    // rect coordinates are in canvas-pixel space (matches PDF.js render viewport).
                    // canvasWidth = viewport.width at render time, so:
                    //   scaleFactor = canvasWidth / unscaledViewport.width
                    // This correctly reconstructs the exact viewport used during rendering.
                    const scaleFactor = (rect.canvasWidth && unscaledViewport.width)
                        ? rect.canvasWidth / unscaledViewport.width
                        : 1.5; // fallback to default render scale

                    const renderViewport = pdfjsPage.getViewport({ scale: scaleFactor });

                    // Convert canvas-pixel coordinates to standard PDF points (bottom-left origin, Y-up).
                    // convertToPdfPoint is the canonical way — keeps coords usable by any PDF library.
                    const p1 = renderViewport.convertToPdfPoint(rect.x, rect.y) as [number, number];
                    const p2 = renderViewport.convertToPdfPoint(rect.x + rect.width, rect.y + rect.height) as [number, number];

                    // Normalize to ensure x1<x2, y1<y2 in standard PDF space
                    const pdfX1 = Math.min(p1[0], p2[0]);
                    const pdfY1 = Math.min(p1[1], p2[1]);
                    const pdfX2 = Math.max(p1[0], p2[0]);
                    const pdfY2 = Math.max(p1[1], p2[1]);

                    // MuPDF uses top-left origin (Y increases downward),
                    // but convertToPdfPoint returns bottom-left origin (Y increases upward).
                    // Flip Y: mupdfY = pageHeight - pdfY
                    const bounds = page.getBounds();  // [x0, y0, x1, y1] — MuPDF page rect
                    const pageHeight = bounds[3] - bounds[1];

                    const annotRect = [
                        pdfX1,
                        pageHeight - pdfY2,  // top edge (smaller Y in top-left space)
                        pdfX2,
                        pageHeight - pdfY1,  // bottom edge (larger Y in top-left space)
                    ];

                    const annot = page.createAnnotation('Redact');
                    annot.setRect(annotRect);
                    annot.setColor([cr, cg, cb]);
                }

                page.applyRedactions();

            }

            // Save the document
            // 'linearize' is no longer supported. Use 'garbage=4,compress' for max optimization.
            const reducedBuffer = doc.saveToBuffer('garbage=4,compress');
            const asUint8 = reducedBuffer.asUint8Array();

            const blob = new Blob([asUint8 as any], { type: 'application/pdf' });
            downloadBlob(blob, file.name.replace('.pdf', '_redacted.pdf'));
        } catch (err) {
            console.error('Failed to redact:', err);
            alert('Failed to redact PDF. Please check console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Redact PDF"
            description="Redact sensitive text and images permanently from your PDF. Works by deleting underlying text and graphics in the chosen area at the PDF content-stream level, not just covering them visually."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            faqs={toolFaqs['pdf-redact']}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Redaction</h3>
                    <p className="text-xs text-zinc-500">
                        Click and drag over areas you want to redact. Redactions are professionally applied, permanently removing underlying text and images.
                    </p>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Redact Color</label>
                        <div className="flex gap-2">
                            {['#000000', '#FFFFFF', '#FF0000', '#808080'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setRedactColor(c)}
                                    className={`w-8 h-8 rounded-md border-2 transition-all ${redactColor === c ? 'border-[#3A76F0] scale-110' : 'border-zinc-600'
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Search UI */}
                    <div className="mb-6 pt-4 border-t border-zinc-800">
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Find & Redact</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search text..."
                                className="flex-1 bg-zinc-800 border-zinc-700 rounded text-xs px-2 py-1 text-zinc-200 focus:outline-none focus:border-[#3A76F0]"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isSearching || !searchText.trim()}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded transition-colors disabled:opacity-50"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search Results Summary */}
                        {showSearchResults && (searchResults.length > 0 || isSearching) && (
                            <div className="mb-4 space-y-2">
                                <div className="text-xs text-zinc-400 flex justify-between items-center">
                                    <span>
                                        {isSearching ? 'Searching...' :
                                            `Found ${searchResults.reduce((acc, p) => acc + p.rects.length, 0)} matches`}
                                    </span>
                                    {searchResults.length > 0 && (
                                        <button
                                            onClick={() => { setSearchResults([]); setShowSearchResults(false); }}
                                            className="text-zinc-500 hover:text-zinc-300"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {searchResults.length > 0 && (
                                    <button
                                        onClick={handleApplyAll}
                                        disabled={isProcessing}
                                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        Redact All Occurrences
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {redactAreas.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs text-zinc-500 uppercase font-medium">
                                    Areas ({redactAreas.length})
                                </label>
                                <button
                                    onClick={() => setRedactAreas([])}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {redactAreas.map((r, i) => (
                                    <div
                                        key={r.id}
                                        className={`flex items-center justify-between text-xs p-1.5 rounded transition-colors cursor-pointer ${selectedRedactId === r.id || hoveredRedactId === r.id
                                            ? 'bg-zinc-800 text-zinc-200 ring-1 ring-[#3A76F0]'
                                            : 'text-zinc-400 hover:bg-zinc-800/50'
                                            }`}
                                        onClick={() => setSelectedRedactId(r.id)}
                                        onMouseEnter={() => setHoveredRedactId(r.id)}
                                        onMouseLeave={() => setHoveredRedactId(null)}
                                    >
                                        <span>Page {r.pageIndex + 1} — Area {i + 1}</span>
                                        <button onClick={(e) => { e.stopPropagation(); removeRedact(r.id); }} className="text-red-400 hover:text-red-300 p-1">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-xs text-emerald-400">
                            🔒 <strong>Professional Redaction.</strong> Content under the redaction bars is permanently removed from the file. Text and images are scrubbed from the internal data stream and cannot be recovered.
                        </p>
                    </div>
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

                    {/* Canvas + redaction overlay */}
                    <div className="relative mx-auto inline-block bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                        <canvas ref={canvasRef} className={`block max-w-full h-auto transition-opacity duration-300 ${pageRendered ? 'opacity-100' : 'opacity-0'}`} />
                        {!pageRendered && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center min-h-[300px]">
                                <Logo isProcessing className="w-12 h-12 text-[#3A76F0] mb-3" />
                                <p className="text-xs text-zinc-500">Rendering page…</p>
                            </div>
                        )}
                        <div
                            ref={overlayRef}
                            className="absolute inset-0 cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {/* Search Results Overlay — coords are in canvas-pixel space, convert to CSS */}
                            {showSearchResults && (() => {
                                const canvas = canvasRef.current;
                                const overlayBounds = overlayRef.current?.getBoundingClientRect();
                                const canvasToCssX = canvas && overlayBounds ? overlayBounds.width / canvas.width : 1;
                                const canvasToCssY = canvas && overlayBounds ? overlayBounds.height / canvas.height : 1;
                                return searchResults.find(r => r.pageIndex === currentPage)?.rects.map((r, i) => (
                                    <div
                                        key={`search-${i}`}
                                        className="absolute border-2 border-yellow-500/50 bg-yellow-500/20"
                                        style={{
                                            left: r.x * canvasToCssX,
                                            top: r.y * canvasToCssY,
                                            width: r.width * canvasToCssX,
                                            height: r.height * canvasToCssY,
                                            pointerEvents: 'none'
                                        }}
                                    />
                                ));
                            })()}

                            {/* Existing redact areas for current page — canvas coords converted to CSS */}
                            {(() => {
                                const canvas = canvasRef.current;
                                const overlayBounds = overlayRef.current?.getBoundingClientRect();
                                const canvasToCssX = canvas && overlayBounds ? overlayBounds.width / canvas.width : 1;
                                const canvasToCssY = canvas && overlayBounds ? overlayBounds.height / canvas.height : 1;
                                return currentPageRedacts.map((r, i) => {
                                    const isSelected = selectedRedactId === r.id;
                                    const isHovered = hoveredRedactId === r.id;
                                    const isActive = isSelected || isHovered;

                                    // Find global index for label
                                    const globalIndex = redactAreas.findIndex(area => area.id === r.id) + 1;

                                    // Convert canvas-pixel coords to CSS for display
                                    const cssX = r.x * canvasToCssX;
                                    const cssY = r.y * canvasToCssY;
                                    const cssW = r.width * canvasToCssX;
                                    const cssH = r.height * canvasToCssY;

                                    return (
                                        <div
                                            key={r.id}
                                            className={`absolute group select-none ${isSelected ? 'z-20' : 'z-10'}`}
                                            style={{
                                                left: cssX,
                                                top: cssY,
                                                width: cssW,
                                                height: cssH,
                                                touchAction: 'none'
                                            }}
                                            onMouseDown={(e) => startDrag(e, r.id, 'move')}
                                            onMouseEnter={() => setHoveredRedactId(r.id)}
                                            onMouseLeave={() => setHoveredRedactId(null)}
                                        >
                                            {/* Main Box */}
                                            <div
                                                className={`w-full h-full transition-all duration-200 ${isActive ? 'ring-2 ring-[#3A76F0] shadow-lg' : ''
                                                    }`}
                                                style={{ backgroundColor: redactColor, opacity: isActive ? 0.7 : 0.85 }}
                                            />

                                            {/* Label Tag */}
                                            {isActive && (
                                                <div className="absolute -top-6 left-0 bg-[#3A76F0] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
                                                    Area {globalIndex}
                                                </div>
                                            )}

                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeRedact(r.id); }}
                                                className={`absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-all z-30 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
                                                    }`}
                                                title="Delete Redaction"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>

                                            {/* Resize Handles - Only when selected */}
                                            {isSelected && (
                                                <>
                                                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#3A76F0] rounded-full cursor-nw-resize z-30"
                                                        onMouseDown={(e) => startDrag(e, r.id, 'resize', 'nw')} />
                                                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3A76F0] rounded-full cursor-ne-resize z-30"
                                                        onMouseDown={(e) => startDrag(e, r.id, 'resize', 'ne')} />
                                                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#3A76F0] rounded-full cursor-sw-resize z-30"
                                                        onMouseDown={(e) => startDrag(e, r.id, 'resize', 'sw')} />
                                                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3A76F0] rounded-full cursor-se-resize z-30"
                                                        onMouseDown={(e) => startDrag(e, r.id, 'resize', 'se')} />
                                                    <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-[#3A76F0] rounded-full cursor-w-resize z-30 transform -translate-y-1/2"
                                                        onMouseDown={(e) => startDrag(e, r.id, 'resize', 'w')} />
                                                    <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-[#3A76F0] rounded-full cursor-e-resize z-30 transform -translate-y-1/2"
                                                        onMouseDown={(e) => startDrag(e, r.id, 'resize', 'e')} />
                                                    <div className="absolute -top-1.5 left-1/2 w-3 h-3 bg-white border-2 border-[#3A76F0] rounded-full cursor-n-resize z-30 transform -translate-x-1/2"
                                                        onMouseDown={(e) => startDrag(e, r.id, 'resize', 'n')} />
                                                    <div className="absolute -bottom-1.5 left-1/2 w-3 h-3 bg-white border-2 border-[#3A76F0] rounded-full cursor-s-resize z-30 transform -translate-x-1/2"
                                                        onMouseDown={(e) => startDrag(e, r.id, 'resize', 's')} />
                                                </>
                                            )}
                                        </div>
                                    );
                                });
                            })()}

                            {/* Currently drawing rect — canvas coords converted to CSS */}
                            {isDrawing && drawStart && currentDraw && (() => {
                                const canvas = canvasRef.current;
                                const overlayBounds = overlayRef.current?.getBoundingClientRect();
                                const canvasToCssX = canvas && overlayBounds ? overlayBounds.width / canvas.width : 1;
                                const canvasToCssY = canvas && overlayBounds ? overlayBounds.height / canvas.height : 1;
                                return (
                                    <div
                                        className="absolute border-2 border-dashed border-red-500"
                                        style={{
                                            left: Math.min(drawStart.x, currentDraw.x) * canvasToCssX,
                                            top: Math.min(drawStart.y, currentDraw.y) * canvasToCssY,
                                            width: Math.abs(currentDraw.x - drawStart.x) * canvasToCssX,
                                            height: Math.abs(currentDraw.y - drawStart.y) * canvasToCssY,
                                            backgroundColor: redactColor,
                                            opacity: 0.4,
                                        }}
                                    />
                                );
                            })()}
                        </div>


                    </div>
                </motion.div>
            )}

            <FloatingActionBar
                isVisible={!!file && redactAreas.length > 0}
                isProcessing={isProcessing}
                onAction={handleSave}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        Apply Redaction ({redactAreas.length} area{redactAreas.length !== 1 ? 's' : ''})
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
