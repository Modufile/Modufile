'use client';

import { useState, useCallback } from 'react';
import { Dropzone } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Stamp } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFWatermarkPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Watermark State
    const [text, setText] = useState('CONFIDENTIAL');
    const [opacity, setOpacity] = useState(0.5);
    const [size, setSize] = useState(50);
    const [rotation, setRotation] = useState(-45);
    const [color, setColor] = useState('#FF0000'); // Hex color

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

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
        } catch (error) {
            console.error('Failed to load PDF', error);
        }
    }, []);

    const removeFile = useCallback(() => {
        setFile(null);
    }, []);

    // Helper to convert hex to rgb (0-1)
    const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
    };

    const handleWatermark = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const pages = pdfDoc.getPages();
            const { r, g, b } = hexToRgb(color);

            pages.forEach(page => {
                const { width, height } = page.getSize();

                // Draw text centered
                page.drawText(text, {
                    x: width / 2 - (size * text.length) / 4, // Rough centering estimate
                    y: height / 2,
                    size: size,
                    font: font,
                    color: rgb(r, g, b),
                    opacity: opacity,
                    rotate: degrees(rotation),
                });
            });

            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            downloadBlob(blob, `watermarked_${file.name}`);

        } catch (error) {
            console.error('Watermark failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Add Watermark"
            description="Overlay text watermarks on your PDF pages."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Watermark Settings</h3>

                    {/* Text Input */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Text</label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#3A76F0]"
                        />
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                                Size ({size})
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={size}
                                onChange={(e) => setSize(Number(e.target.value))}
                                className="w-full accent-[#3A76F0]"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                                Opacity ({opacity.toFixed(1)})
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={opacity}
                                onChange={(e) => setOpacity(Number(e.target.value))}
                                className="w-full accent-[#3A76F0]"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                                Rotation ({rotation}°)
                            </label>
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                value={rotation}
                                onChange={(e) => setRotation(Number(e.target.value))}
                                className="w-full accent-[#3A76F0]"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                                Color
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                />
                                <span className="text-xs text-zinc-500 font-mono">{color}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            {!file ? (
                <Dropzone
                    onFilesAdded={handleFileAdded}
                    acceptedTypes={['application/pdf']}
                    maxFiles={1}
                />
            ) : (
                <div className="space-y-6">
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
                        <button
                            onClick={removeFile}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-500 hover:text-red-500" />
                        </button>
                    </div>

                    {/* Preview (Approximation) */}
                    <div className="relative w-full aspect-[1/1.4] bg-white rounded shadow-lg overflow-hidden flex items-center justify-center border border-zinc-200">
                        <div
                            className="text-center font-bold pointer-events-none select-none text-nowrap"
                            style={{
                                fontSize: `${size}px`,
                                color: color,
                                opacity: opacity,
                                transform: `rotate(${rotation}deg)`
                            }}
                        >
                            {text}
                        </div>
                        <div className="absolute bottom-4 right-4 text-xs text-gray-400">Preview (Approximation)</div>
                    </div>
                </div>
            )}

            <FloatingActionBar
                isVisible={!!file && text.length > 0}
                isProcessing={isProcessing}
                onAction={handleWatermark}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <Stamp className="w-4 h-4" />
                        Apply Watermark
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
