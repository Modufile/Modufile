'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFileStore } from '@/stores/fileStore';
import { Dropzone } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { PDFVisualEditor } from '@/components/pdf/PDFVisualEditor';
import { PDFDocument } from 'pdf-lib';
import { ZoomIn, ZoomOut } from 'lucide-react';

export default function PDFOrganizePage() {
    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    const [files, setFiles] = useState<File[]>([]);
    const [hasPages, setHasPages] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [normalizeWidth, setNormalizeWidth] = useState(false);
    const [thumbnailSize, setThumbnailSize] = useState(160);
    const editorSaveRef = useRef<(() => Promise<Blob | null>) | null>(null);

    const firstName = files.length > 0 ? files[0].name : 'organized.pdf';
    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(firstName, '_organized');

    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            const pdfs = storedFiles.filter((f) => f.type === 'application/pdf');
            if (pdfs.length > 0) setFiles(pdfs);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, setStoredFiles]);

    const handleFilesAdded = (newFiles: File[]) => {
        const pdfs = newFiles.filter((f) => f.type === 'application/pdf');
        if (pdfs.length > 0) setFiles((prev) => [...prev, ...pdfs]);
    };

    const handleSave = useCallback(async (): Promise<{ blob: Blob; filename: string }> => {
        if (!editorSaveRef.current) throw new Error('No save ref');
        setIsProcessing(true);
        try {
            let blob = await editorSaveRef.current();
            if (!blob) throw new Error('Save returned null');

            if (normalizeWidth) {
                const pdfDoc = await PDFDocument.load(await blob.arrayBuffer());
                const pages = pdfDoc.getPages();
                if (pages.length > 1) {
                    const firstPage = pages[0];
                    const firstRot = firstPage.getRotation().angle;
                    const firstSize = firstPage.getSize();
                    const targetWidth = (firstRot === 90 || firstRot === 270) ? firstSize.height : firstSize.width;

                    pages.forEach((page, i) => {
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
                    const bytes = await pdfDoc.save();
                    blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
                }
            }

            return { blob, filename: sanitized };
        } finally {
            setIsProcessing(false);
        }
    }, [sanitized, normalizeWidth]);

    const THUMB_MIN = 100;
    const THUMB_MAX = 280;
    const THUMB_STEP = 20;

    return (
        <ToolPageLayout
            title="Organize PDF"
            description="Rearrange, rotate, and delete pages from your PDF documents."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-organize'].about}
            techSetup={toolContent['pdf-organize'].techSetup}
            faqs={toolContent['pdf-organize'].faqs}
            onSave={hasPages ? handleSave : undefined}
            saveDisabled={!hasPages || isProcessing}
            saveLabel="Save PDF"
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            centerControls={
                <div className="flex items-center gap-1 bg-[#1F1F22] rounded border border-zinc-800/60 p-0.5 h-8">
                    <button
                        onClick={() => setThumbnailSize(s => Math.max(THUMB_MIN, s - THUMB_STEP))}
                        disabled={thumbnailSize <= THUMB_MIN}
                        className="p-1 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
                        title="Smaller thumbnails"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-zinc-400 font-medium w-10 text-center">{thumbnailSize}px</span>
                    <button
                        onClick={() => setThumbnailSize(s => Math.min(THUMB_MAX, s + THUMB_STEP))}
                        disabled={thumbnailSize >= THUMB_MAX}
                        className="p-1 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
                        title="Larger thumbnails"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                </div>
            }
            importedFilesPanel={
                <ImportedFilesPanel
                    files={files.map(f => ({ name: f.name, size: f.size }))}
                    onRemoveFile={(idx) => setFiles(prev => prev.filter((_, i) => i !== idx))}
                    onClearAll={() => setFiles([])}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles={toolContent['pdf-organize'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-organize'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <div className="space-y-3 mt-3">
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
                                <p className="text-xs text-zinc-500 mt-0.5">Scale all pages to match the first page's width, preserving aspect ratio.</p>
                            </div>
                        </label>
                    </div>

                    <div className="mt-3 border-t border-zinc-800/40 pt-3 space-y-1.5">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Instructions</span>
                        <p className="text-xs text-zinc-500">Drag thumbnails to reorder pages. Hover a page to rotate or delete it.</p>
                    </div>
                </>
            }
        >
            {files.length === 0 ? (
                <Dropzone
                    onFilesAdded={handleFilesAdded}
                    acceptedTypes={['application/pdf']}
                    className="max-w-xl mx-auto mt-10"
                />
            ) : (
                <PDFVisualEditor
                    initialFiles={files}
                    onSaveRef={editorSaveRef}
                    onPagesChange={(count) => setHasPages(count > 0)}
                    thumbnailSize={thumbnailSize}
                />
            )}
        </ToolPageLayout>
    );
}
