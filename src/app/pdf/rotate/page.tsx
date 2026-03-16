'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout, type AppliedChange } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { PDFJS_WORKER_SRC } from '@/lib/pdfjs-config';
import { RotateCw, RotateCcw, ChevronsRight } from 'lucide-react';
import { motion } from 'framer-motion';

function RotationPreview({ angle }: { angle: number }) {
    const cx = 32, cy = 32, r = 20;
    const startRad = -Math.PI / 2;
    const sweep = angle % 360;
    const absSweep = Math.abs(sweep);
    const isZero = absSweep < 1;
    const isFull = absSweep > 359;

    let arcPath = '';
    if (!isZero && !isFull) {
        const endRad = startRad + (sweep * Math.PI) / 180;
        const sx = cx + r * Math.cos(startRad);
        const sy = cy + r * Math.sin(startRad);
        const ex = cx + r * Math.cos(endRad);
        const ey = cy + r * Math.sin(endRad);
        arcPath = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${absSweep > 180 ? 1 : 0} ${sweep > 0 ? 1 : 0} ${ex.toFixed(2)} ${ey.toFixed(2)}`;
    } else if (isFull) {
        arcPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`;
    }

    let arrowPath = '';
    if (!isZero) {
        const endRad = isFull ? startRad : startRad + (sweep * Math.PI) / 180;
        const ex = cx + r * Math.cos(endRad);
        const ey = cy + r * Math.sin(endRad);
        const cw = sweep >= 0;
        const tx = cw ? Math.sin(endRad) : -Math.sin(endRad);
        const ty = cw ? -Math.cos(endRad) : Math.cos(endRad);
        const bx = -tx, by = -ty;
        const len = 6, sp = 0.45;
        const w1x = ex + len * (bx * Math.cos(sp) - by * Math.sin(sp));
        const w1y = ey + len * (bx * Math.sin(sp) + by * Math.cos(sp));
        const w2x = ex + len * (bx * Math.cos(-sp) - by * Math.sin(-sp));
        const w2y = ey + len * (bx * Math.sin(-sp) + by * Math.cos(-sp));
        arrowPath = `M ${w1x.toFixed(2)} ${w1y.toFixed(2)} L ${ex.toFixed(2)} ${ey.toFixed(2)} L ${w2x.toFixed(2)} ${w2y.toFixed(2)}`;
    }

    return (
        <div className="flex flex-col items-center gap-1.5 py-3 px-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="relative" style={{ width: 64, height: 64 }}>
                <svg width="64" height="64" viewBox="0 0 64 64" className="absolute inset-0">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 2.5" />
                    {arcPath && (
                        <path d={arcPath} fill="none" stroke="#3A76F0" strokeWidth="2" strokeLinecap="round" />
                    )}
                    {arrowPath && (
                        <path d={arrowPath} fill="none" stroke="#3A76F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        className="w-8 h-[42px] bg-zinc-200 rounded-sm flex flex-col gap-1 items-center justify-center shadow-sm"
                        animate={{ rotate: angle }}
                        transition={{ type: 'spring', damping: 18, stiffness: 160 }}
                    >
                        <div className="w-4 h-px bg-zinc-500" />
                        <div className="w-3 h-px bg-zinc-500" />
                        <div className="w-4 h-px bg-zinc-500" />
                    </motion.div>
                </div>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
                {isZero ? 'no rotation' : `${angle > 0 ? '+' : ''}${angle}°`}
            </span>
        </div>
    );
}
import { PDFDocument, degrees } from 'pdf-lib';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFRotatePage() {
    const [files, setFiles] = useState<PDFFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [globalRotation, setGlobalRotation] = useState(0);
    const [customAngle, setCustomAngle] = useState(90);
    const [perPageRotation, setPerPageRotation] = useState<Map<string, number>>(new Map());
    const [thumbnails, setThumbnails] = useState<{ key: string; src: string }[]>([]);
    const [thumbProgress, setThumbProgress] = useState(0);

    const firstName = files.length > 0 ? files[0].name : 'output.pdf';
    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(firstName, '_rotated');

    const handleFilesAdded = useCallback(async (newFiles: File[]) => {
        const pdfs = newFiles.filter((f) => f.type === 'application/pdf');
        if (pdfs.length === 0) return;

        setIsLoading(true);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        try {
            const newPdfFiles: PDFFile[] = [];
            for (const f of pdfs) {
                const arrayBuffer = await f.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                newPdfFiles.push({
                    id: crypto.randomUUID(),
                    file: f,
                    name: f.name,
                    size: f.size,
                    pageCount: pdfDoc.getPageCount(),
                });
            }
            setFiles(prev => [...prev, ...newPdfFiles]);
            setGlobalRotation(0);
            setPerPageRotation(new Map());
        } catch (error) {
            console.error('Failed to load PDF', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (files.length === 0) return;
        let cancelled = false;

        const generate = async () => {
            try {
                const pdfjs = await import('pdfjs-dist');
                if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
                }

                const thumbs: { key: string; src: string }[] = [];
                let totalPages = 0;
                for (const f of files) totalPages += f.pageCount;
                let done = 0;

                for (const pdfFile of files) {
                    const buf = await pdfFile.file.arrayBuffer();
                    const doc = await pdfjs.getDocument({ data: buf }).promise;

                    for (let i = 1; i <= doc.numPages; i++) {
                        if (cancelled) { doc.destroy(); return; }
                        const page = await doc.getPage(i);
                        const scale = 150 / page.getViewport({ scale: 1 }).width;
                        const vp = page.getViewport({ scale });
                        const canvas = document.createElement('canvas');
                        canvas.width = vp.width;
                        canvas.height = vp.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            await page.render({ canvasContext: ctx, viewport: vp }).promise;
                            thumbs.push({ key: `${pdfFile.id}_${i - 1}`, src: canvas.toDataURL() });
                        }
                        done++;
                        setThumbProgress(Math.round((done / totalPages) * 100));
                    }
                    doc.destroy();
                }

                if (!cancelled) setThumbnails(thumbs);
            } catch (err) {
                console.error('Thumbnail generation failed:', err);
            }
        };

        setThumbnails([]);
        setThumbProgress(0);
        generate();
        return () => { cancelled = true; };
    }, [files]);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFilesAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFilesAdded, setStoredFiles]);

    const rotateAllLeft = () => setGlobalRotation(prev => (prev - 90 + 360) % 360);
    const rotateAllRight = () => setGlobalRotation(prev => (prev + 90) % 360);

    const rotatePageBy = (key: string, angle: number) => {
        setPerPageRotation(prev => {
            const next = new Map(prev);
            const current = next.get(key) || 0;
            next.set(key, (current + angle + 360) % 360);
            return next;
        });
    };

    const getPageRotation = (key: string): number => {
        return ((perPageRotation.get(key) || 0) + globalRotation) % 360;
    };

    const hasAnyRotation = (): boolean => {
        if (globalRotation !== 0) return true;
        for (const v of perPageRotation.values()) {
            if (v !== 0) return true;
        }
        return false;
    };

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (files.length === 0) throw new Error('No files');
        setIsProcessing(true);

        try {
            const mergedDoc = await PDFDocument.create();

            for (const pdfFile of files) {
                const arrayBuffer = await pdfFile.file.arrayBuffer();
                const sourceDoc = await PDFDocument.load(arrayBuffer);
                const pageCount = sourceDoc.getPageCount();
                const copiedPages = await mergedDoc.copyPages(sourceDoc, Array.from({ length: pageCount }, (_, i) => i));

                copiedPages.forEach((page, i) => {
                    const key = `${pdfFile.id}_${i}`;
                    const rot = getPageRotation(key);
                    if (rot !== 0) {
                        const current = page.getRotation().angle;
                        page.setRotation(degrees(current + rot));
                    }
                    mergedDoc.addPage(page);
                });
            }

            const bytes = await mergedDoc.save();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { blob: new Blob([bytes as any], { type: 'application/pdf' }), filename: sanitized };
        } finally {
            setIsProcessing(false);
        }
    };

    const canSave = files.length > 0 && hasAnyRotation();

    const appliedChanges = useMemo<AppliedChange[]>(() => {
        const list: AppliedChange[] = [];

        if (globalRotation !== 0) {
            list.push({
                id: 'global',
                description: `All pages: ${globalRotation > 0 ? '+' : ''}${globalRotation}°`,
                onUndo: () => setGlobalRotation(0),
            });
        }

        for (const [key, rot] of perPageRotation.entries()) {
            if (rot === 0) continue;
            let label = key;
            for (const pdfFile of files) {
                for (let i = 0; i < pdfFile.pageCount; i++) {
                    if (`${pdfFile.id}_${i}` === key) {
                        label = files.length > 1
                            ? `File ${files.indexOf(pdfFile) + 1}, Pg ${i + 1}`
                            : `Page ${i + 1}`;
                        break;
                    }
                }
            }
            list.push({
                id: key,
                description: `${label}: ${rot > 0 ? '+' : ''}${rot}°`,
                onUndo: () => setPerPageRotation(prev => {
                    const next = new Map(prev);
                    next.delete(key);
                    return next;
                }),
            });
        }

        return list;
    }, [globalRotation, perPageRotation, files]);

    const handleReset = useCallback(() => {
        setGlobalRotation(0);
        setPerPageRotation(new Map());
    }, []);

    return (
        <ToolPageLayout
            title="Rotate PDF"
            description="Rotate all or specific pages of your PDF documents."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-rotate'].about}
            techSetup={toolContent['pdf-rotate'].techSetup}
            faqs={toolContent['pdf-rotate'].faqs}
            onSave={canSave ? handleSave : undefined}
            saveDisabled={!canSave || isProcessing}
            saveLabel="Save Rotated PDF"
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            appliedChanges={appliedChanges}
            onResetChanges={handleReset}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={files.map(f => ({ name: f.name, size: f.size, pageCount: f.pageCount }))}
                    onRemoveFile={(idx) => {
                        const removed = files[idx];
                        setFiles(prev => prev.filter((_, i) => i !== idx));
                        setPerPageRotation(prev => {
                            const next = new Map(prev);
                            for (const key of next.keys()) {
                                if (key.startsWith(removed.id)) next.delete(key);
                            }
                            return next;
                        });
                    }}
                    onClearAll={() => { setFiles([]); setPerPageRotation(new Map()); }}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles
                    acceptedFileTypes={['application/pdf']}
                />
            }
            sidebar={
                <>
                    <div className="space-y-3 mt-3">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Rotation Options</span>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={rotateAllLeft}
                                className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="text-xs text-zinc-400">All Left 90°</span>
                            </button>
                            <button
                                onClick={rotateAllRight}
                                className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <RotateCw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="text-xs text-zinc-400">All Right 90°</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block">
                                Custom Angle
                            </label>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={customAngle}
                                    onChange={(e) => setCustomAngle(Number(e.target.value))}
                                    min={-360}
                                    max={360}
                                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                                <span className="text-xs text-zinc-500 shrink-0">deg</span>
                            </div>

                            <RotationPreview angle={customAngle} />

                            <button
                                onClick={() => setGlobalRotation(prev => ((prev + customAngle) % 360 + 360) % 360)}
                                disabled={files.length === 0}
                                className="w-full h-8 flex items-center justify-center gap-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronsRight className="w-3.5 h-3.5 text-zinc-400" />
                                Apply to All Pages
                            </button>

                            <p className="text-[11px] text-zinc-600">Or click a thumbnail to apply to that page only.</p>
                        </div>

                        {globalRotation !== 0 && (
                            <div className="px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
                                <span className="text-xs text-zinc-500">Global offset: </span>
                                <span className="text-xs text-[#3A76F0] font-medium">{globalRotation}°</span>
                            </div>
                        )}
                    </div>
                </>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Importing files…" />
            ) : files.length === 0 ? (
                <Dropzone
                    onFilesAdded={handleFilesAdded}
                    acceptedTypes={['application/pdf']}
                />
            ) : (
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {thumbnails.length === 0 && thumbProgress < 100 && (
                        <div className="text-center py-10 text-zinc-500 text-sm">
                            Generating thumbnails… {thumbProgress}%
                        </div>
                    )}
                    {thumbnails.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                            {(() => {
                                return files.flatMap(pdfFile =>
                                    Array.from({ length: pdfFile.pageCount }, (_, i) => {
                                        const key = `${pdfFile.id}_${i}`;
                                        const thumb = thumbnails.find(t => t.key === key);
                                        const rot = getPageRotation(key);
                                        const label = files.length > 1
                                            ? `File ${files.indexOf(pdfFile) + 1}, Pg ${i + 1}`
                                            : `Page ${i + 1}`;
                                        return (
                                            <div key={key} className="relative group">
                                                <div
                                                    className="rounded-lg overflow-hidden border-2 border-zinc-800 bg-white transition-all cursor-pointer"
                                                    style={{ transform: `rotate(${rot}deg)` }}
                                                    onClick={() => rotatePageBy(key, customAngle)}
                                                    title={`Click to rotate ${customAngle}°`}
                                                >
                                                    {thumb ? (
                                                        <img src={thumb.src} alt={label} className="w-full h-auto object-contain" />
                                                    ) : (
                                                        <div className="w-full h-24 flex items-center justify-center bg-zinc-800">
                                                            <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                {rot !== 0 && (
                                                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#3A76F0] text-white">
                                                        {rot}°
                                                    </div>
                                                )}
                                                <p className="mt-1 text-center text-[10px] text-zinc-500">{label}</p>
                                            </div>
                                        );
                                    })
                                );
                            })()}
                        </div>
                    )}
                </motion.div>
            )}
        </ToolPageLayout>
    );
}
