'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout, type AppliedChange } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { PDFJS_WORKER_SRC } from '@/lib/pdfjs-config';
import { FileText, X, Upload, Trash2, Move, ImageIcon, Type } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

type WatermarkMode = 'text' | 'image';

interface ImageWatermark {
    data: ArrayBuffer;
    type: 'png' | 'jpg';
    previewUrl: string;
    naturalWidth: number;
    naturalHeight: number;
}

export default function PDFWatermarkPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<WatermarkMode>('text');

    // Text watermark state
    const [text, setText] = useState('CONFIDENTIAL');
    const [opacity, setOpacity] = useState(0.5);
    const [size, setSize] = useState(50);
    const [rotation, setRotation] = useState(-45);
    const [color, setColor] = useState('#FF0000');
    const [textX, setTextX] = useState(50); // % from left
    const [textY, setTextY] = useState(50); // % from top

    // Image watermark state
    const [imageWatermark, setImageWatermark] = useState<ImageWatermark | null>(null);
    const [imgX, setImgX] = useState(50); // percentage from left
    const [imgY, setImgY] = useState(50); // percentage from top
    const [imgScale, setImgScale] = useState(30); // percentage of page width
    const [imgOpacity, setImgOpacity] = useState(0.5);
    const [isDragging, setIsDragging] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    // Page previews
    const [pageThumbs, setPageThumbs] = useState<string[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(
        file?.name || 'output.pdf', '_watermarked'
    );

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        setIsLoading(true);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
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

            // Generate thumbnails for first, middle, and last page
            const pagesToRender = [0];
            if (pageCount > 2) pagesToRender.push(Math.floor(pageCount / 2));
            if (pageCount > 1) pagesToRender.push(pageCount - 1);

            const pdfjs = await import('pdfjs-dist');
            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
            }
            const buf = await uploadedFile.arrayBuffer();
            const doc = await pdfjs.getDocument({ data: buf }).promise;
            const thumbs: string[] = [];

            for (const idx of pagesToRender) {
                const page = await doc.getPage(idx + 1);
                const scale = 300 / page.getViewport({ scale: 1 }).width;
                const vp = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                canvas.width = vp.width;
                canvas.height = vp.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    await page.render({ canvasContext: ctx, viewport: vp }).promise;
                    thumbs.push(canvas.toDataURL());
                }
            }
            doc.destroy();
            setPageThumbs(thumbs);
        } catch (error) {
            console.error('Failed to load PDF', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFileAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    const removeFile = useCallback(() => {
        setFile(null);
        setPageThumbs([]);
        if (imageWatermark) URL.revokeObjectURL(imageWatermark.previewUrl);
        setImageWatermark(null);
    }, [imageWatermark]);

    const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
    };

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

        if (imageWatermark) URL.revokeObjectURL(imageWatermark.previewUrl);
        setImageWatermark({
            data: arrayBuffer,
            type: isJpg ? 'jpg' : 'png',
            previewUrl: url,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
        });
        setMode('image');
        e.target.value = '';
    }, [imageWatermark]);

    // Drag to position image watermark on preview
    const handlePreviewMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'image' || !previewRef.current) return;
        setIsDragging(true);
        updatePosition(e);
    };

    const handlePreviewMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !previewRef.current) return;
        updatePosition(e);
    };

    const updatePosition = (e: React.MouseEvent) => {
        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setImgX(Math.max(0, Math.min(100, x)));
        setImgY(Math.max(0, Math.min(100, y)));
    };

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file');
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            if (mode === 'text') {
                const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                const { r, g, b } = hexToRgb(color);

                pages.forEach(page => {
                    const { width, height } = page.getSize();
                    const textWidth = font.widthOfTextAtSize(text, size);
                    // Convert top-% to PDF bottom-left Y; center text around the position
                    const xPos = (textX / 100) * width - textWidth / 2;
                    const yPos = (1 - textY / 100) * height;
                    page.drawText(text, {
                        x: xPos,
                        y: yPos,
                        size: size,
                        font: font,
                        color: rgb(r, g, b),
                        opacity: opacity,
                        // CSS rotate(N deg) is CW positive; pdf-lib degrees(N) is CCW positive — negate to match
                        rotate: degrees(-rotation),
                    });
                });
            } else if (mode === 'image' && imageWatermark) {
                const embeddedImage = imageWatermark.type === 'png'
                    ? await pdfDoc.embedPng(imageWatermark.data)
                    : await pdfDoc.embedJpg(imageWatermark.data);

                pages.forEach(page => {
                    const { width, height } = page.getSize();
                    const imgW = (imgScale / 100) * width;
                    const ratio = imageWatermark.naturalHeight / imageWatermark.naturalWidth;
                    const imgH = imgW * ratio;
                    const pdfX = (imgX / 100) * width - imgW / 2;
                    const pdfY = height - (imgY / 100) * height - imgH / 2;

                    page.drawImage(embeddedImage, {
                        x: pdfX,
                        y: pdfY,
                        width: imgW,
                        height: imgH,
                        opacity: imgOpacity,
                    });
                });
            }

            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            return { blob, filename: sanitized };
        } finally {
            setIsProcessing(false);
        }
    };

    const appliedChanges = useMemo<AppliedChange[]>(() => {
        if (!file) return [];
        if (mode === 'text') {
            return [{
                id: 'watermark-text',
                description: `Text: "${text.slice(0, 20)}${text.length > 20 ? '…' : ''}"`,
                onUndo: () => setText('CONFIDENTIAL'),
            }];
        }
        if (mode === 'image' && imageWatermark) {
            return [{
                id: 'watermark-image',
                description: 'Image watermark applied',
                onUndo: () => setImageWatermark(null),
            }];
        }
        return [];
    }, [file, mode, text, imageWatermark]);

    const handleReset = useCallback(() => {
        setText('CONFIDENTIAL');
        setOpacity(0.5);
        setSize(50);
        setRotation(-45);
        setColor('#FF0000');
        setTextX(50);
        setTextY(50);
        setImageWatermark(null);
        setImgOpacity(0.5);
        setImgScale(30);
        setImgX(50);
        setImgY(50);
        setMode('text');
    }, []);

    const canApply = mode === 'text' ? text.length > 0 : !!imageWatermark;
    const pageLabels = file
        ? file.pageCount <= 2
            ? ['First Page', 'Last Page'].slice(0, file.pageCount)
            : ['First Page', 'Middle Page', 'Last Page']
        : [];

    return (
        <ToolPageLayout
            title="Add Watermark"
            description="Overlay text or image watermarks on your PDF pages."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-watermark'].about}
            techSetup={toolContent['pdf-watermark'].techSetup}
            faqs={toolContent['pdf-watermark'].faqs}
            onSave={file && canApply ? handleSave : undefined}
            saveDisabled={!file || !canApply || isProcessing}
            saveLabel="Apply Watermark"
            appliedChanges={appliedChanges}
            onResetChanges={handleReset}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: (file as any).pageCount }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-watermark'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-watermark'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Watermark Settings</span>

                    {/* Mode toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode('text')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'text' ? 'bg-[#3A76F0] text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                        >
                            <Type className="w-3.5 h-3.5" /> Text
                        </button>
                        <button
                            onClick={() => setMode('image')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'image' ? 'bg-[#3A76F0] text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                        >
                            <ImageIcon className="w-3.5 h-3.5" /> Image
                        </button>
                    </div>

                    {mode === 'text' ? (
                        <>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Text</label>
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Size ({size})</label>
                                    <input type="range" min="10" max="200" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-[#3A76F0]" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Opacity ({opacity.toFixed(1)})</label>
                                    <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-[#3A76F0]" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Rotation ({rotation}°)</label>
                                    <input type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-[#3A76F0]" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                                        <span className="text-xs text-zinc-500 font-mono">{color}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">X Position ({textX}%)</label>
                                    <input type="range" min="0" max="100" value={textX} onChange={(e) => setTextX(Number(e.target.value))} className="w-full accent-[#3A76F0]" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Y Position ({textY}%)</label>
                                    <input type="range" min="0" max="100" value={textY} onChange={(e) => setTextY(Number(e.target.value))} className="w-full accent-[#3A76F0]" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => imageInputRef.current?.click()}
                                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                {imageWatermark ? 'Change Image' : 'Upload Image (PNG / JPEG)'}
                            </button>
                            <input ref={imageInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImageUpload} />

                            {imageWatermark && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <img src={imageWatermark.previewUrl} alt="watermark" className="w-10 h-10 object-contain rounded border border-zinc-700" />
                                        <span className="text-xs text-zinc-400">{imageWatermark.naturalWidth}×{imageWatermark.naturalHeight}</span>
                                        <button onClick={() => { URL.revokeObjectURL(imageWatermark.previewUrl); setImageWatermark(null); }} className="ml-auto text-xs text-red-400 hover:text-red-300">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Size ({imgScale}%)</label>
                                        <input type="range" min="5" max="80" value={imgScale} onChange={(e) => setImgScale(Number(e.target.value))} className="w-full accent-[#3A76F0]" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Opacity ({Math.round(imgOpacity * 100)}%)</label>
                                        <input type="range" min="10" max="100" value={imgOpacity * 100} onChange={(e) => setImgOpacity(Number(e.target.value) / 100)} className="w-full accent-[#3A76F0]" />
                                    </div>
                                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                                        <Move className="w-3 h-3" /> Drag on preview to position
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Importing file..." />
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
                                <p className="text-sm text-zinc-500">{formatFileSize(file.size)} · {file.pageCount} pages</p>
                            </div>
                        </div>
                        <button onClick={removeFile} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-zinc-500 hover:text-red-500" />
                        </button>
                    </div>

                    {/* Page previews with watermark overlay */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {pageThumbs.map((src, i) => (
                            <div key={i} className="space-y-2">
                                <div
                                    ref={i === 0 ? previewRef : undefined}
                                    className="relative bg-white rounded-lg shadow-lg overflow-hidden border border-zinc-200 cursor-crosshair"
                                    onMouseDown={i === 0 ? handlePreviewMouseDown : undefined}
                                    onMouseMove={i === 0 ? handlePreviewMouseMove : undefined}
                                    onMouseUp={() => setIsDragging(false)}
                                    onMouseLeave={() => setIsDragging(false)}
                                >
                                    <img src={src} alt={pageLabels[i]} className="w-full h-auto" />

                                    {/* Watermark overlay */}
                                    {mode === 'text' && text && (
                                        <div
                                            className="absolute pointer-events-none font-bold whitespace-nowrap"
                                            style={{
                                                fontSize: `${Math.max(8, size * 0.3)}px`,
                                                color: color,
                                                opacity: opacity,
                                                left: `${textX}%`,
                                                top: `${textY}%`,
                                                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                                            }}
                                        >
                                            {text}
                                        </div>
                                    )}

                                    {mode === 'image' && imageWatermark && (
                                        <div
                                            className="absolute pointer-events-none"
                                            style={{
                                                left: `${imgX}%`,
                                                top: `${imgY}%`,
                                                transform: 'translate(-50%, -50%)',
                                                width: `${imgScale}%`,
                                                opacity: imgOpacity,
                                            }}
                                        >
                                            <img src={imageWatermark.previewUrl} alt="watermark" className="w-full h-auto" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 text-center">{pageLabels[i]}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </ToolPageLayout>
    );
}
