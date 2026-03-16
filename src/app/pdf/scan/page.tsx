'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileProcessingOverlay } from '@/components/ui';
import { Camera, Image, X, Sun, Contrast, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadBlob } from '@/lib/core/download';
import { PDFDocument } from 'pdf-lib';

interface ScannedImage {
    id: string;
    original: string;
    file: File;
}

export default function ScanToPdfPage() {
    const [images, setImages] = useState<ScannedImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [enhance, setEnhance] = useState(true);
    const [grayscale, setGrayscale] = useState(false);
    const [contrast, setContrast] = useState(1.2);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        const newImages: ScannedImage[] = [];
        for (const f of Array.from(files)) {
            if (!f.type.startsWith('image/')) continue;
            const url = URL.createObjectURL(f);
            newImages.push({ id: crypto.randomUUID(), original: url, file: f });
        }
        setImages(prev => [...prev, ...newImages]);
    }, []);

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const processImage = async (file: File): Promise<Uint8Array> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                if (grayscale) ctx.filter = `grayscale(1) contrast(${contrast})`;
                else if (enhance) ctx.filter = `contrast(${contrast}) brightness(1.05)`;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    blob?.arrayBuffer().then(buf => resolve(new Uint8Array(buf)));
                }, 'image/jpeg', 0.92);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleCreatePdf = useCallback(async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        try {
            const pdfDoc = await PDFDocument.create();
            for (const img of images) {
                const imgBytes = await processImage(img.file);
                const embeddedImg = await pdfDoc.embedJpg(imgBytes);
                const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
                page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
            }
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });
            downloadBlob(blob, 'scanned-document.pdf');
        } catch (err) {
            console.error('Scan to PDF failed:', err);
        } finally {
            setIsProcessing(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images, grayscale, enhance, contrast]);

    const content = toolContent['pdf-scan'];

    return (
        <ToolPageLayout
            title="Scan to PDF"
            description="Capture images from your camera or gallery and create a PDF document"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            importedFilesPanel={
                <ImportedFilesPanel
                    files={[]}
                    onRemoveFile={() => { }}
                    onAddFiles={handleFiles}
                    acceptsMultipleFiles={toolContent['pdf-scan'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-scan'].acceptedFileTypes}
                />
            }
            sidebar={
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                        <h3 className="font-medium text-sm text-zinc-100">Enhancement Options</h3>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="flex items-center gap-2 text-sm text-zinc-400"><Zap className="w-4 h-4" /> Auto-enhance</span>
                            <input type="checkbox" checked={enhance} onChange={e => setEnhance(e.target.checked)} className="sr-only peer" />
                            <div className="relative w-10 h-5 bg-zinc-700 rounded-full peer-checked:bg-[#3A76F0] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="flex items-center gap-2 text-sm text-zinc-400"><Sun className="w-4 h-4" /> Grayscale</span>
                            <input type="checkbox" checked={grayscale} onChange={e => setGrayscale(e.target.checked)} className="sr-only peer" />
                            <div className="relative w-10 h-5 bg-zinc-700 rounded-full peer-checked:bg-[#3A76F0] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                        <div>
                            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2"><Contrast className="w-4 h-4" /> Contrast: {contrast.toFixed(1)}×</label>
                            <input type="range" min="0.5" max="2.0" step="0.1" value={contrast} onChange={e => setContrast(parseFloat(e.target.value))} className="w-full accent-[#3A76F0]" />
                        </div>
                    </div>
                </div>
            }
            about={content?.about}
            techSetup={content?.techSetup}
            faqs={content?.faqs}
        >
            <div className="space-y-4">
                <div className="flex gap-3">
                    <button onClick={() => fileRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-zinc-700 hover:border-[#3A76F0] rounded-xl text-zinc-400 hover:text-white transition-all bg-zinc-900/50">
                        <Image className="w-5 h-5" /><span className="text-sm font-medium">Choose Images</span>
                    </button>
                    <button onClick={() => {
                        const inp = document.createElement('input');
                        inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment'; inp.multiple = true;
                        inp.onchange = () => inp.files && handleFiles(inp.files); inp.click();
                    }}
                        className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-zinc-700 hover:border-[#3A76F0] rounded-xl text-zinc-400 hover:text-white transition-all bg-zinc-900/50">
                        <Camera className="w-5 h-5" /><span className="text-sm font-medium">Take Photo</span>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => e.target.files && handleFiles(e.target.files)} />
                </div>

                {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((img, i) => (
                            <motion.div key={img.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                                <img src={img.original} alt={`Scan ${i + 1}`} className="w-full h-40 object-cover" />
                                <button onClick={() => removeImage(img.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3 text-white" />
                                </button>
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-xs text-zinc-300">Page {i + 1}</div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {images.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Capture or select images to create a PDF</p>
                    </div>
                )}

                {isProcessing && <FileProcessingOverlay message="Creating PDF from scans…" />}
            </div>

            <FloatingActionBar
                isVisible={images.length > 0 && !isProcessing}
                isProcessing={isProcessing}
                onAction={handleCreatePdf}
                actionLabel={<><Camera className="w-4 h-4" /> Create PDF ({images.length} page{images.length > 1 ? 's' : ''})</>}
            />
        </ToolPageLayout>
    );
}
