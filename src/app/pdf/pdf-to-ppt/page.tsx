'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Presentation, AlertTriangle, FileOutput, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { loadMuPDF } from '@/lib/core/mupdf-loader';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFToPptPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const f = newFiles[0];
        if (!f || f.type !== 'application/pdf') return;
        setIsLoading(true);
        setResult(null);
        try {
            const { PDFDocument } = await import('pdf-lib');
            const buf = await f.arrayBuffer();
            const doc = await PDFDocument.load(buf);
            setFile({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size, pageCount: doc.getPageCount() });
        } catch (err) {
            console.error('Failed to load PDF', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFileAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    const handleConvert = useCallback(async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const mupdf = await loadMuPDF();
            const buf = await file.file.arrayBuffer();
            const doc = mupdf.Document.openDocument(new Uint8Array(buf), 'application/pdf');
            const pageCount = doc.countPages();

            const PptxGenJS = (await import('pptxgenjs')).default;
            const pptx = new PptxGenJS();

            for (let i = 0; i < pageCount; i++) {
                try {
                    const page = doc.loadPage(i);
                    const scale = 150 / 72;
                    const pixmap = page.toPixmap(
                        mupdf.Matrix.scale(scale, scale),
                        mupdf.ColorSpace.DeviceRGB,
                        false, // no alpha — produces 3-channel RGB
                        true   // annots
                    );

                    // Use pixmap's own dimensions for accuracy
                    const pw = pixmap.getWidth();
                    const ph = pixmap.getHeight();
                    const stride = pixmap.getStride();
                    const n = pixmap.getNumberOfComponents(); // 3 for RGB, 4 for RGBA
                    const rawPixels = pixmap.getPixels();

                    // Canvas requires RGBA (4 channels), so expand if needed
                    const canvas = document.createElement('canvas');
                    canvas.width = pw;
                    canvas.height = ph;
                    const ctx = canvas.getContext('2d')!;

                    let rgba: Uint8ClampedArray;
                    if (n === 4) {
                        rgba = new Uint8ClampedArray(rawPixels.slice());
                    } else {
                        // Expand RGB to RGBA
                        rgba = new Uint8ClampedArray(pw * ph * 4);
                        for (let y = 0; y < ph; y++) {
                            for (let x = 0; x < pw; x++) {
                                const srcIdx = y * stride + x * n;
                                const dstIdx = (y * pw + x) * 4;
                                rgba[dstIdx] = rawPixels[srcIdx];       // R
                                rgba[dstIdx + 1] = rawPixels[srcIdx + 1]; // G
                                rgba[dstIdx + 2] = rawPixels[srcIdx + 2]; // B
                                rgba[dstIdx + 3] = 255;                   // A
                            }
                        }
                    }
                    pixmap.destroy();

                    const imgData = new ImageData(new Uint8ClampedArray(rgba.buffer.slice(0) as ArrayBuffer), pw, ph);
                    ctx.putImageData(imgData, 0, 0);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    const slide = pptx.addSlide();
                    slide.addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
                } catch (pageErr) {
                    console.warn(`Failed to render page ${i + 1}:`, pageErr);
                }
            }
            doc.destroy();

            const pptxBlob = await pptx.write({ outputType: 'blob' }) as Blob;
            setResult(pptxBlob);
        } catch (err) {
            console.error('PDF to PPT conversion failed:', err);
            setError(err instanceof Error ? err.message : 'Conversion failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }, [file]);

    const handleDownload = useCallback(() => {
        if (!result || !file) return;
        const base = file.name.replace(/\.pdf$/i, '');
        downloadBlob(result, `${base}.pptx`);
    }, [result, file]);

    const content = toolContent['pdf-to-ppt'];

    return (
        <ToolPageLayout
            title="PDF to PowerPoint"
            description="Convert PDF pages into a PowerPoint presentation"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            sidebar={
                <div className="space-y-6">
                    <div className="bg-amber-500/5 border border-amber-800/30 rounded-xl p-4">
                        <div className="flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300/80">Each PDF page becomes an image-based slide. Text won&apos;t be directly editable in the resulting PowerPoint file.</p>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <h3 className="font-medium text-sm text-zinc-100 mb-3">Output details</h3>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li>📊 Standard .pptx format</li>
                            <li>🖼️ 150 DPI rendering per slide</li>
                            <li>📐 Full-bleed page images</li>
                        </ul>
                    </div>
                </div>
            }
            about={content?.about}
            techSetup={content?.techSetup}
            faqs={content?.faqs}
        >
            {isLoading ? (
                <FileProcessingOverlay message="Reading PDF…" />
            ) : !file ? (
                <Dropzone
                    onFilesAdded={handleFileAdded}
                    acceptedTypes={['application/pdf']}
                    maxFiles={1}
                />
            ) : (
                <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-lg"><Presentation className="w-5 h-5 text-orange-400" /></div>
                                <div>
                                    <p className="text-sm font-medium text-white truncate max-w-[300px]">{file.name}</p>
                                    <p className="text-xs text-zinc-500">{formatFileSize(file.size)} · {file.pageCount} page{file.pageCount > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => { setFile(null); setResult(null); setError(null); }}
                                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                    </motion.div>

                    {isProcessing && <FileProcessingOverlay message="Creating presentation…" />}

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-800/30 rounded-xl text-sm text-red-300">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </motion.div>
                    )}

                    {result && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-green-800/50 rounded-xl p-6 text-center">
                            <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                                <FileOutput className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Conversion Complete!</h3>
                            <p className="text-sm text-zinc-400 mb-4">Your presentation is ready.</p>
                            <button onClick={handleDownload}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors">
                                Download .pptx
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            <FloatingActionBar
                isVisible={!!file && !result && !isProcessing}
                isProcessing={isProcessing}
                onAction={handleConvert}
                actionLabel={<><Presentation className="w-4 h-4" /> Convert to PowerPoint</>}
            />
        </ToolPageLayout>
    );
}
