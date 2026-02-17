'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface PdfPageSelectorProps {
    file: File;
    selectedIndices: Set<number>;
    onToggle: (index: number, isShiftKey: boolean) => void;
    mode?: 'merge' | 'separate' | 'single' | 'burst'; // For coloring logic
}

export function PdfPageSelector({ file, selectedIndices, onToggle, mode = 'merge' }: PdfPageSelectorProps) {
    const [pageCount, setPageCount] = useState<number>(0);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

    useEffect(() => {
        let isCancelled = false;

        const loadPdf = async () => {
            try {
                //Dynamic import for pdfjs same as in redact page
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                setPageCount(pdf.numPages);

                // Render thumbnails sequentially to avoid memory spikes
                // or just placeholder for now and lazy load?
                // Let's try rendering small ones (150px wide)

                const thumbUrls: string[] = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    if (isCancelled) return;

                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnail using standard 72dpi
                    // Adjust scale to match desired width (e.g. 150px)
                    // Standard letter is ~600pt. 0.25 scale -> 150px.
                    const desiredWidth = 150;
                    const scale = desiredWidth / page.getViewport({ scale: 1.0 }).width;
                    const scaledViewport = page.getViewport({ scale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = scaledViewport.width;
                    canvas.height = scaledViewport.height;

                    if (context) {
                        await page.render({
                            canvasContext: context,
                            viewport: scaledViewport
                        }).promise;
                        thumbUrls.push(canvas.toDataURL());
                    }
                    setLoadingProgress(Math.round((i / pdf.numPages) * 100));
                }

                if (!isCancelled) setThumbnails(thumbUrls);

            } catch (error) {
                console.error("Error generating thumbnails:", error);
            }
        };

        if (file) {
            loadPdf();
        }

        return () => { isCancelled = true; };
    }, [file]);

    // Helper to determine cluster color
    const getClusterColor = (index: number) => {
        if (mode !== 'separate') return 'bg-blue-500/20 border-blue-500'; // Default selection color

        // Logic: continuous ranges get same color
        // Sort selected indices
        const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
        if (!sorted.includes(index)) return '';

        let clusterIndex = 0;
        let prev = sorted[0];

        for (const i of sorted) {
            if (i === index) break;
            if (i > prev + 1) clusterIndex++;
            prev = i;
        }

        const colors = [
            'bg-blue-500/20 border-blue-500',
            'bg-green-500/20 border-green-500',
            'bg-purple-500/20 border-purple-500',
            'bg-yellow-500/20 border-yellow-500',
            'bg-pink-500/20 border-pink-500',
            'bg-indigo-500/20 border-indigo-500',
        ];
        return colors[clusterIndex % colors.length];
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
            {loadingProgress < 100 && thumbnails.length === 0 && (
                <div className="col-span-full text-center py-10 text-zinc-500">
                    Generating thumbnails... {loadingProgress}%
                </div>
            )}

            {thumbnails.map((src, i) => {
                const isSelected = selectedIndices.has(i);
                const colorClass = isSelected ? getClusterColor(i) : '';

                return (
                    <div
                        key={i}
                        onClick={(e) => onToggle(i, e.shiftKey)}
                        className={`
                            relative group cursor-pointer transition-all duration-200
                            rounded-lg overflow-hidden border-2
                            ${isSelected ? `${colorClass} scale-[1.02] shadow-lg` : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-600'}
                        `}
                    >
                        {/* Overlay for unselected state (translucent dark filter) */}
                        {!isSelected && (
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                        )}

                        <img src={src} alt={`Page ${i + 1}`} className="w-full h-auto object-contain bg-white" />

                        <div className="absolute top-2 left-2 z-20">
                            <div className={`
                                w-6 h-6 rounded flex items-center justify-center text-xs font-medium
                                ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-800 text-zinc-400'}
                            `}>
                                {i + 1}
                            </div>
                        </div>

                        {isSelected && (
                            <div className="absolute top-2 right-2 z-20">
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
