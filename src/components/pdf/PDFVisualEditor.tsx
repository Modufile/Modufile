'use client';

import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
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
import { FileProcessingOverlay } from '@/components/ui/FileProcessingOverlay';
import { Plus } from 'lucide-react';
import { PDFJS_WORKER_SRC } from '@/lib/pdfjs-config';

interface PageItem {
    id: string;
    file: File;
    fileIndex: number;
    pageIndex: number;
    rotation: number;
}

interface PDFVisualEditorProps {
    initialFiles: File[];
    onSave?: (blob: Blob) => void;
    onSaveRef?: MutableRefObject<(() => Promise<Blob | null>) | null>;
    onPagesChange?: (count: number) => void;
    thumbnailSize?: number;
}

async function countPages(file: File): Promise<number> {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    }
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const n = doc.numPages;
    doc.destroy();
    return n;
}

export function PDFVisualEditor({ initialFiles, onSave, onSaveRef, onPagesChange, thumbnailSize = 180 }: PDFVisualEditorProps) {
    const [pages, setPages] = useState<PageItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            const items: PageItem[] = [];

            for (let fileIndex = 0; fileIndex < initialFiles.length; fileIndex++) {
                const file = initialFiles[fileIndex];
                if (file.type !== 'application/pdf') continue;
                try {
                    const n = await countPages(file);
                    if (cancelled) return;
                    for (let i = 0; i < n; i++) {
                        items.push({
                            id: `${file.name}_p${i}_${crypto.randomUUID()}`,
                            file,
                            fileIndex,
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

    useEffect(() => {
        onPagesChange?.(pages.length);
    }, [pages.length, onPagesChange]);

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

    const rotate = (id: string) =>
        setPages((prev) =>
            prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p)),
        );

    const remove = (id: string) => setPages((prev) => prev.filter((p) => p.id !== id));

    const addFiles = useCallback(async (newFiles: File[]) => {
        const pdfs = newFiles.filter((f) => f.type === 'application/pdf');
        if (pdfs.length === 0) return;

        setIsAdding(true);
        const newPages: PageItem[] = [];
        const nextFileIndex = pages.length > 0
            ? Math.max(...pages.map(p => p.fileIndex)) + 1
            : 0;

        for (let fi = 0; fi < pdfs.length; fi++) {
            const file = pdfs[fi];
            try {
                const n = await countPages(file);
                for (let i = 0; i < n; i++) {
                    newPages.push({
                        id: `${file.name}_p${i}_${crypto.randomUUID()}`,
                        file,
                        fileIndex: nextFileIndex + fi,
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
    }, [pages]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            addFiles(Array.from(files));
        }
        e.target.value = '';
    }, [addFiles]);

    const buildBlob = useCallback(async (): Promise<Blob | null> => {
        if (pages.length === 0) return null;

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
        return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
    }, [pages]);

    useEffect(() => {
        if (onSaveRef) {
            onSaveRef.current = buildBlob;
        }
    }, [onSaveRef, buildBlob]);

    // Compute file labels for multi-file display
    const fileNames = pages.reduce<{ file: File; label: string }[]>((acc, page) => {
        const existing = acc.find(f => f.file === page.file);
        if (!existing) {
            acc.push({ file: page.file, label: `File ${acc.length + 1}` });
        }
        return acc;
    }, []);

    const getPageLabel = (page: PageItem): string => {
        const fileEntry = fileNames.find(f => f.file === page.file);
        const fileLabel = fileEntry?.label ?? `File ${page.fileIndex + 1}`;
        if (fileNames.length > 1) {
            return `${fileLabel}, Page ${page.pageIndex + 1}`;
        }
        return `Page ${page.pageIndex + 1}`;
    };

    if (loading) {
        return <FileProcessingOverlay message="Reading PDF pages…" />;
    }

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

    const activePage = activeId ? pages.find((p) => p.id === activeId) : null;

    return (
        <div className="space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 min-h-[300px]">
                    <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                        <div
                            className="grid gap-4 justify-items-center"
                            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))` }}
                        >
                            {pages.map((page) => (
                                <SortablePage
                                    key={page.id}
                                    id={page.id}
                                    file={page.file}
                                    pageIndex={page.pageIndex}
                                    rotation={page.rotation}
                                    onRotate={() => rotate(page.id)}
                                    onDelete={() => remove(page.id)}
                                    label={getPageLabel(page)}
                                    size={thumbnailSize}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    {isAdding && (
                        <div className="flex items-center justify-center py-6 text-zinc-500 text-sm gap-2">
                            <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                            Adding pages…
                        </div>
                    )}
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
                            label={getPageLabel(activePage)}
                            size={thumbnailSize}
                            className="cursor-grabbing scale-105 shadow-2xl ring-2 ring-[#3A76F0]/50 rounded-lg"
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

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
