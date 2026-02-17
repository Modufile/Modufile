'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';

interface PDFThumbnailProps {
    file: File;
    pageIndex: number;
    rotation: number;
    onRotate: () => void;
    onDelete: () => void;
    className?: string;
}

const WORKER_SRC = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

export function PDFThumbnail({
    file,
    pageIndex,
    rotation,
    onRotate,
    onDelete,
    className = '',
}: PDFThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let renderTask: any = null;

        const render = async () => {
            try {
                setLoading(true);
                setError(null);

                const pdfjs = await import('pdfjs-dist');
                if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
                }

                const buf = await file.arrayBuffer();
                if (!mounted) return;

                const doc = await pdfjs.getDocument({ data: buf }).promise;
                if (!mounted) { doc.destroy(); return; }

                const page = await doc.getPage(pageIndex + 1);
                if (!mounted) { doc.destroy(); return; }

                const vp = page.getViewport({ scale: 1 });
                const scale = 180 / vp.width;
                const scaled = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas || !mounted) { doc.destroy(); return; }

                canvas.width = scaled.width;
                canvas.height = scaled.height;

                const ctx = canvas.getContext('2d')!;
                renderTask = page.render({ canvasContext: ctx, viewport: scaled });
                await renderTask.promise;

                if (mounted) setLoading(false);
                doc.destroy();
            } catch (e: unknown) {
                if (mounted) {
                    const msg = e instanceof Error ? e.message : 'Render failed';
                    if (!msg.includes('cancelled')) setError(msg);
                }
            }
        };

        render();

        return () => {
            mounted = false;
            try { renderTask?.cancel(); } catch { /* ignore */ }
        };
    }, [file, pageIndex]);

    return (
        <div className={`relative group ${className}`}>
            <div
                className="relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow-sm transition-all hover:shadow-lg"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {loading && !error && (
                    <div className="flex items-center justify-center w-[180px] h-[240px] bg-zinc-800">
                        <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-center w-[180px] h-[240px] bg-zinc-800 text-red-400 text-xs text-center px-3">
                        {error}
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    className={`block max-w-full h-auto mx-auto ${loading && !error ? 'hidden' : ''}`}
                />

                {/* Hover overlay with controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRotate(); }}
                        className="p-2.5 bg-zinc-700/90 rounded-full hover:bg-zinc-600 text-zinc-100 transition-colors"
                        title="Rotate 90°"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                        className="p-2.5 bg-zinc-700/90 rounded-full hover:bg-red-600/80 text-red-300 hover:text-white transition-colors"
                        title="Remove page"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <p className="mt-2 text-center text-xs text-zinc-500 select-none">
                Page {pageIndex + 1}
            </p>
        </div>
    );
}
