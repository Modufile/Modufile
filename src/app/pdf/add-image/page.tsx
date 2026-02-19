'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dropzone, FileProcessingOverlay, Logo } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, ImageIcon, ChevronLeft, ChevronRight, Trash2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { PDFDocument } from 'pdf-lib';

interface PDFFile {
    name: string;
    file: File;
    size: number;
    pageCount: number;
}

interface ImageOverlay {
    id: string;
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    imageData: ArrayBuffer;
    imageType: 'png' | 'jpg';
    naturalWidth: number;
    naturalHeight: number;
    previewUrl: string;
    opacity: number;
}

const WORKER_SRC = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

export default function AddImagePage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [overlays, setOverlays] = useState<ImageOverlay[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [pageRendered, setPageRendered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayDivRef = useRef<HTMLDivElement>(null);
    const pdfDocRef = useRef<any>(null);
    const pageScaleRef = useRef(1);
    const imageInputRef = useRef<HTMLInputElement>(null);

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
            setOverlays([]);
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
        overlays.forEach(o => URL.revokeObjectURL(o.previewUrl));
        setOverlays([]);
    }, [overlays]);

    // Add image overlay
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

        // Get natural dimensions
        const img = new Image();
        const url = URL.createObjectURL(imageFile);
        img.src = url;
        await new Promise(resolve => { img.onload = resolve; });

        const displayWidth = Math.min(200, img.naturalWidth);
        const scale = displayWidth / img.naturalWidth;
        const displayHeight = img.naturalHeight * scale;

        const overlay: ImageOverlay = {
            id: crypto.randomUUID(),
            pageIndex: currentPage,
            x: 50,
            y: 50,
            width: displayWidth,
            height: displayHeight,
            imageData: arrayBuffer,
            imageType: isJpg ? 'jpg' : 'png',
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            previewUrl: url,
            opacity: 1,
        };

        setOverlays(prev => [...prev, overlay]);
        setSelectedId(overlay.id);
        e.target.value = '';
    }, [currentPage]);

    const updateOverlay = (id: string, updates: Partial<ImageOverlay>) => {
        setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    };

    const removeOverlay = (id: string) => {
        const overlay = overlays.find(o => o.id === id);
        if (overlay) URL.revokeObjectURL(overlay.previewUrl);
        setOverlays(prev => prev.filter(o => o.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const currentPageOverlays = overlays.filter(o => o.pageIndex === currentPage);

    // Drag handlers for image positioning
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const overlay = overlays.find(o => o.id === id);
        if (!overlay) return;
        setSelectedId(id);
        setIsDragging(true);
        setDragOffset({ x: e.clientX - overlay.x, y: e.clientY - overlay.y });
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !selectedId) return;
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        updateOverlay(selectedId, { x, y });
    }, [isDragging, selectedId, dragOffset]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleSave = async () => {
        if (!file || overlays.length === 0) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const scale = pageScaleRef.current;

            for (const ovl of overlays) {
                const page = pages[ovl.pageIndex];
                if (!page) continue;
                const { height: pageH } = page.getSize();

                const embeddedImage = ovl.imageType === 'png'
                    ? await pdfDoc.embedPng(ovl.imageData)
                    : await pdfDoc.embedJpg(ovl.imageData);

                const pdfX = ovl.x / scale;
                const pdfW = ovl.width / scale;
                const pdfH = ovl.height / scale;
                const pdfY = pageH - ovl.y / scale - pdfH;

                page.drawImage(embeddedImage, {
                    x: pdfX,
                    y: pdfY,
                    width: pdfW,
                    height: pdfH,
                    opacity: ovl.opacity,
                });
            }

            const bytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            downloadBlob(blob, file.name.replace('.pdf', '_with_image.pdf'));
        } catch (err) {
            console.error('Failed to add images:', err);
            alert('Failed to save PDF with images.');
        } finally {
            setIsProcessing(false);
        }
    };

    const selected = selectedId ? overlays.find(o => o.id === selectedId) : null;

    return (
        <ToolPageLayout
            title="Add Image"
            description="Overlay images onto your PDF pages — logos, stamps, signatures, and more."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-add-image'].about}
            techSetup={toolContent['pdf-add-image'].techSetup}
            faqs={toolContent['pdf-add-image'].faqs}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Image Overlay</h3>

                    <button
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Image (PNG / JPEG)
                    </button>
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleImageUpload}
                    />

                    <p className="text-xs text-zinc-500">
                        Upload an image, then drag to position it on the PDF page.
                    </p>

                    {selected && (
                        <div className="p-3 bg-zinc-800/50 rounded-lg border border-[#3A76F0]/30 space-y-3">
                            <label className="text-xs text-[#3A76F0] uppercase font-medium block">Selected Image</label>

                            <div className="flex gap-3 items-center">
                                <img
                                    src={selected.previewUrl}
                                    alt="preview"
                                    className="w-12 h-12 object-cover rounded border border-zinc-700"
                                />
                                <div className="text-xs text-zinc-400">
                                    <p>{selected.naturalWidth} × {selected.naturalHeight}</p>
                                    <p>{Math.round(selected.width)} × {Math.round(selected.height)} display</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs text-zinc-500">Size</label>
                                    <span className="text-xs text-zinc-400">{Math.round(selected.width)}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="800"
                                    value={selected.width}
                                    onChange={(e) => {
                                        const newW = Number(e.target.value);
                                        const ratio = selected.naturalHeight / selected.naturalWidth;
                                        updateOverlay(selected.id, { width: newW, height: newW * ratio });
                                    }}
                                    className="w-full accent-[#3A76F0]"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs text-zinc-500">Opacity</label>
                                    <span className="text-xs text-zinc-400">{Math.round(selected.opacity * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={selected.opacity * 100}
                                    onChange={(e) => updateOverlay(selected.id, { opacity: Number(e.target.value) / 100 })}
                                    className="w-full accent-[#3A76F0]"
                                />
                            </div>

                            <button
                                onClick={() => removeOverlay(selected.id)}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" /> Remove Image
                            </button>
                        </div>
                    )}

                    {overlays.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs text-zinc-500 uppercase font-medium">
                                    All Images ({overlays.length})
                                </label>
                                <button
                                    onClick={() => { overlays.forEach(o => URL.revokeObjectURL(o.previewUrl)); setOverlays([]); setSelectedId(null); }}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                                {overlays.map((o, i) => (
                                    <button
                                        key={o.id}
                                        onClick={() => {
                                            setSelectedId(o.id);
                                            setCurrentPage(o.pageIndex);
                                        }}
                                        className={`w-full flex items-center gap-2 text-xs p-1.5 rounded transition-colors ${selectedId === o.id
                                            ? 'bg-[#3A76F0]/20 text-[#3A76F0]'
                                            : 'text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800'
                                            }`}
                                    >
                                        <img src={o.previewUrl} alt="" className="w-6 h-6 object-cover rounded" />
                                        <span>Page {o.pageIndex + 1} — Image {i + 1}</span>
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

                    {/* Canvas + image overlays */}
                    <div className="relative mx-auto inline-block bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                        <canvas ref={canvasRef} className={`block max-w-full h-auto transition-opacity duration-300 ${pageRendered ? 'opacity-100' : 'opacity-0'}`} />
                        <div
                            ref={overlayDivRef}
                            className="absolute inset-0"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {currentPageOverlays.map(o => (
                                <img
                                    key={o.id}
                                    src={o.previewUrl}
                                    alt="overlay"
                                    className={`absolute cursor-move select-none ${selectedId === o.id ? 'ring-2 ring-[#3A76F0]' : 'hover:ring-1 hover:ring-zinc-500'
                                        }`}
                                    style={{
                                        left: o.x,
                                        top: o.y,
                                        width: o.width,
                                        height: o.height,
                                        opacity: o.opacity,
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, o.id)}
                                    draggable={false}
                                />
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
                isVisible={!!file && overlays.length > 0}
                isProcessing={isProcessing}
                onAction={handleSave}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Save with Images ({overlays.length})
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
