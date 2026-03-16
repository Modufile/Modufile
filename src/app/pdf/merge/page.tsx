'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout, type AppliedChange } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { PDFJS_WORKER_SRC } from '@/lib/pdfjs-config';
import {
    FileText, X, GripVertical
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
    firstThumb: string | null;
    lastThumb: string | null;
}

async function renderPageThumbnail(file: File, pageIndex: number, width = 120): Promise<string | null> {
    try {
        const pdfjs = await import('pdfjs-dist');
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
        }
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        const page = await doc.getPage(pageIndex + 1);
        const vp = page.getViewport({ scale: 1 });
        const scale = width / vp.width;
        const scaled = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = scaled.width;
        canvas.height = scaled.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { doc.destroy(); return null; }
        await page.render({ canvasContext: ctx, viewport: scaled }).promise;
        const url = canvas.toDataURL();
        doc.destroy();
        return url;
    } catch {
        return null;
    }
}

export default function PDFMergePage() {
    const [files, setFiles] = useState<PDFFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [normalizeWidth, setNormalizeWidth] = useState(false);

    const firstName = files.length > 0 ? files[0].name : 'merged.pdf';
    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(firstName, '_merged');

    const handleFilesAdded = useCallback(async (newFiles: File[]) => {
        const pdfs = newFiles.filter(f => f.type === 'application/pdf');
        if (pdfs.length === 0) return;

        flushSync(() => setIsLoading(true));
        const newPdfFiles: PDFFile[] = [];

        for (const f of pdfs) {
            try {
                const arrayBuffer = await f.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pageCount = pdfDoc.getPageCount();

                const firstThumb = await renderPageThumbnail(f, 0);
                const lastThumb = pageCount > 1 ? await renderPageThumbnail(f, pageCount - 1) : null;

                newPdfFiles.push({
                    id: crypto.randomUUID(),
                    file: f,
                    name: f.name,
                    size: f.size,
                    pageCount,
                    firstThumb,
                    lastThumb,
                });
            } catch (err) {
                console.error(`Failed to load ${f.name}:`, err);
            }
        }

        setFiles(prev => [...prev, ...newPdfFiles]);
        setIsLoading(false);
    }, []);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFilesAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFilesAdded, setStoredFiles]);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        setIsProcessing(true);

        try {
            const mergedPdf = await PDFDocument.create();

            for (const pdfFile of files) {
                const arrayBuffer = await pdfFile.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }

            if (normalizeWidth && mergedPdf.getPageCount() > 1) {
                const firstPage = mergedPdf.getPage(0);
                const firstRot = firstPage.getRotation().angle;
                const firstSize = firstPage.getSize();
                const targetWidth = (firstRot === 90 || firstRot === 270) ? firstSize.height : firstSize.width;

                mergedPdf.getPages().forEach((page, i) => {
                    if (i === 0) return;
                    const rot = page.getRotation().angle;
                    const { width, height } = page.getSize();
                    const effectiveWidth = (rot === 90 || rot === 270) ? height : width;
                    if (Math.abs(effectiveWidth - targetWidth) > 1) {
                        const scale = targetWidth / effectiveWidth;
                        page.setSize(width * scale, height * scale);
                        page.scaleContent(scale, scale);
                    }
                });
            }

            const mergedBytes = await mergedPdf.save();
            const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
            return { blob, filename: sanitized };
        } finally {
            setIsProcessing(false);
        }
    };

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);

    const appliedChanges = useMemo<AppliedChange[]>(() => {
        const list: AppliedChange[] = [];
        if (normalizeWidth) {
            list.push({ id: 'normalize', description: 'Normalize page width', onUndo: () => setNormalizeWidth(false) });
        }
        return list;
    }, [normalizeWidth]);

    const handleReset = useCallback(() => {
        setNormalizeWidth(false);
    }, []);

    return (
        <ToolPageLayout
            title="Merge PDF"
            description="Combine multiple PDF files into a single document. Drag to reorder."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-merge'].about}
            techSetup={toolContent['pdf-merge'].techSetup}
            faqs={toolContent['pdf-merge'].faqs}
            onSave={files.length >= 2 ? handleSave : undefined}
            saveDisabled={files.length < 2 || isProcessing}
            saveLabel="Merge PDFs"
            appliedChanges={appliedChanges}
            onResetChanges={handleReset}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={files.map(f => ({ name: f.name, size: f.size, pageCount: f.pageCount }))}
                    onRemoveFile={(idx) => removeFile(files[idx].id)}
                    onClearAll={() => setFiles([])}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles={toolContent['pdf-merge'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-merge'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    {files.length > 0 && (
                        <div className="mt-3 space-y-3">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Options</span>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={normalizeWidth}
                                    onChange={(e) => setNormalizeWidth(e.target.checked)}
                                    className="accent-[#3A76F0] rounded mt-0.5"
                                />
                                <div>
                                    <span className="text-sm text-zinc-300">Normalize page width</span>
                                    <p className="text-xs text-zinc-500 mt-0.5">Resize all pages to match the first page's width, preserving each page's aspect ratio.</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="mt-3 space-y-1 border-t border-zinc-800/40 pt-3">
                            <div className="flex justify-between text-xs py-1">
                                <span className="text-zinc-500">Files</span>
                                <span className="text-zinc-300">{files.length}</span>
                            </div>
                            <div className="flex justify-between text-xs py-1">
                                <span className="text-zinc-500">Total Pages</span>
                                <span className="text-zinc-300">{totalPages}</span>
                            </div>
                            <div className="flex justify-between text-xs py-1">
                                <span className="text-zinc-500">Total Size</span>
                                <span className="text-zinc-300">{formatFileSize(totalSize)}</span>
                            </div>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="mt-3 border-t border-zinc-800/40 pt-3">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-2">Reorder Pages</span>
                            <Link
                                href="/pdf/organize"
                                className="block w-full text-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm transition-colors"
                            >
                                Open Visual Organizer →
                            </Link>
                        </div>
                    )}
                </>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Loading PDF files…" />
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
                    <Reorder.Group
                        axis="y"
                        values={files}
                        onReorder={setFiles}
                        className="space-y-2"
                    >
                        {files.map((pdfFile) => (
                            <Reorder.Item
                                key={pdfFile.id}
                                value={pdfFile}
                                className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg cursor-grab active:cursor-grabbing"
                            >
                                <GripVertical className="w-4 h-4 text-zinc-600 shrink-0" />

                                {/* First page thumbnail */}
                                <div className="shrink-0 w-14 h-[72px] bg-zinc-800 rounded overflow-hidden border border-zinc-700">
                                    {pdfFile.firstThumb ? (
                                        <img src={pdfFile.firstThumb} alt="First page" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-zinc-600" />
                                        </div>
                                    )}
                                </div>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-100 truncate">{pdfFile.name}</p>
                                    <p className="text-xs text-zinc-500">
                                        {formatFileSize(pdfFile.size)} · {pdfFile.pageCount} {pdfFile.pageCount === 1 ? 'page' : 'pages'}
                                    </p>
                                </div>

                                {/* Last page thumbnail (if multi-page) */}
                                {pdfFile.lastThumb && (
                                    <div className="shrink-0 w-14 h-[72px] bg-zinc-800 rounded overflow-hidden border border-zinc-700 hidden sm:block">
                                        <img src={pdfFile.lastThumb} alt="Last page" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <button
                                    onClick={() => removeFile(pdfFile.id)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
                                >
                                    <X className="w-4 h-4 text-zinc-500 hover:text-red-500" />
                                </button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </motion.div>
            )}
        </ToolPageLayout>
    );
}
