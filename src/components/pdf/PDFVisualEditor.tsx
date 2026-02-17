'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PDFDocument, degrees } from 'pdf-lib';

import { SortablePage } from './SortablePage';
import { PDFThumbnail } from './PDFThumbnail';
import { Loader2, Save, Plus } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PageItem {
    id: string;
    file: File;
    pageIndex: number;
    rotation: number;
}

interface PDFVisualEditorProps {
    initialFiles: File[];
    onSave?: (blob: Blob) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const WORKER_SRC = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

async function countPages(file: File): Promise<number> {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    }
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const n = doc.numPages;
    doc.destroy();
    return n;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PDFVisualEditor({ initialFiles, onSave }: PDFVisualEditorProps) {
    const [pages, setPages] = useState<PageItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ---- sensors (pointer + touch + keyboard) ---- */
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    /* ---- load page metadata from all files ---- */
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            const items: PageItem[] = [];

            for (const file of initialFiles) {
                if (file.type !== 'application/pdf') continue;
                try {
                    const n = await countPages(file);
                    if (cancelled) return;
                    for (let i = 0; i < n; i++) {
                        items.push({
                            id: `${file.name}_p${i}_${crypto.randomUUID()}`,
                            file,
                            pageIndex: i,
                            rotation: 0,
                        });
                    }
                } catch (err) {
                    console.error(`Failed to read ${file.name}:`, err);
                }
            }

            if (!cancelled) {
                setPages(items);
                setLoading(false);
            }
        };

        if (initialFiles.length > 0) load();
        return () => { cancelled = true; };
    }, [initialFiles]);

    /* ---- drag handlers ---- */
    const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (over && active.id !== over.id) {
            setPages((prev) => {
                const from = prev.findIndex((p) => p.id === active.id);
                const to = prev.findIndex((p) => p.id === over.id);
                return arrayMove(prev, from, to);
            });
        }
        setActiveId(null);
    };

    /* ---- page actions ---- */
    const rotate = (id: string) =>
        setPages((prev) =>
            prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p)),
        );

    const remove = (id: string) => setPages((prev) => prev.filter((p) => p.id !== id));

    /* ---- add more files ---- */
    const addFiles = useCallback(async (newFiles: File[]) => {
        const pdfs = newFiles.filter((f) => f.type === 'application/pdf');
        if (pdfs.length === 0) return;

        setIsAdding(true);
        const newPages: PageItem[] = [];

        for (const file of pdfs) {
            try {
                const n = await countPages(file);
                for (let i = 0; i < n; i++) {
                    newPages.push({
                        id: `${file.name}_p${i}_${crypto.randomUUID()}`,
                        file,
                        pageIndex: i,
                        rotation: 0,
                    });
                }
            } catch (err) {
                console.error(`Failed to read ${file.name}:`, err);
            }
        }

        setPages((prev) => [...prev, ...newPages]);
        setIsAdding(false);
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            addFiles(Array.from(files));
        }
        // Reset so the same file can be re-selected
        e.target.value = '';
    }, [addFiles]);

    /* ---- save / export ---- */
    const handleSave = async () => {
        if (pages.length === 0) return;
        setIsProcessing(true);

        try {
            const out = await PDFDocument.create();
            const cache = new Map<File, PDFDocument>();

            for (const item of pages) {
                let src = cache.get(item.file);
                if (!src) {
                    src = await PDFDocument.load(await item.file.arrayBuffer());
                    cache.set(item.file, src);
                }

                const [copied] = await out.copyPages(src, [item.pageIndex]);
                const existing = copied.getRotation().angle;
                copied.setRotation(degrees(existing + item.rotation));
                out.addPage(copied);
            }

            const bytes = await out.save();
            // Create a fresh Uint8Array backed by a plain ArrayBuffer (not SharedArrayBuffer)
            // so TypeScript 5+ accepts it as a valid BlobPart
            const safeBytes = new Uint8Array(bytes);
            const blob = new Blob([safeBytes], { type: 'application/pdf' });

            if (onSave) {
                onSave(blob);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'organized.pdf';
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save PDF. Check the console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    /* ---- loading state ---- */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                <span className="text-zinc-500 text-sm">Reading PDF pages…</span>
            </div>
        );
    }

    /* ---- empty state (all pages deleted) ---- */
    if (pages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-zinc-500">
                <p className="text-sm">No pages remaining.</p>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add PDF
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                />
            </div>
        );
    }

    /* ---- active drag overlay item ---- */
    const activePage = activeId ? pages.find((p) => p.id === activeId) : null;

    /* ---- render ---- */
    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
                <span className="text-sm text-zinc-400">{pages.length} page{pages.length !== 1 && 's'}</span>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAdding}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800 disabled:opacity-50"
                    >
                        {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add PDF
                    </button>
                    <button
                        type="button"
                        onClick={() => setPages([])}
                        className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800"
                    >
                        Clear All
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="hidden"
                        onChange={handleFileInputChange}
                    />
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3A76F0] hover:bg-[#2563EB] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isProcessing
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Save className="w-4 h-4" />}
                        Save PDF
                    </button>
                </div>
            </div>

            {/* Sortable grid */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 min-h-[300px]">
                    <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
                            {pages.map((page) => (
                                <SortablePage
                                    key={page.id}
                                    id={page.id}
                                    file={page.file}
                                    pageIndex={page.pageIndex}
                                    rotation={page.rotation}
                                    onRotate={() => rotate(page.id)}
                                    onDelete={() => remove(page.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>

                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: '0.4' } },
                        }),
                    }}
                >
                    {activePage ? (
                        <PDFThumbnail
                            file={activePage.file}
                            pageIndex={activePage.pageIndex}
                            rotation={activePage.rotation}
                            onRotate={() => { }}
                            onDelete={() => { }}
                            className="cursor-grabbing scale-105 shadow-2xl ring-2 ring-[#3A76F0]/50 rounded-lg"
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
