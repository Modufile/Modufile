'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout, type AppliedChange } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { PDFDocument } from 'pdf-lib';

interface PDFFile {
    name: string;
    file: File;
    size: number;
    pageCount: number;
    currentWidth: number;
    currentHeight: number;
}

type PagePreset = 'a4' | 'letter' | 'legal' | 'a3' | 'a5' | 'custom';

const PRESETS: { value: PagePreset; label: string; width: number; height: number }[] = [
    { value: 'a4', label: 'A4 (210 × 297mm)', width: 595.28, height: 841.89 },
    { value: 'letter', label: 'US Letter (8.5 × 11")', width: 612, height: 792 },
    { value: 'legal', label: 'US Legal (8.5 × 14")', width: 612, height: 1008 },
    { value: 'a3', label: 'A3 (297 × 420mm)', width: 841.89, height: 1190.55 },
    { value: 'a5', label: 'A5 (148 × 210mm)', width: 419.53, height: 595.28 },
];

const ptToMm = (pt: number) => Math.round(pt * 0.3528 * 10) / 10;

export default function ResizePagesPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preset, setPreset] = useState<PagePreset>('a4');
    const [customWidth, setCustomWidth] = useState(595.28);
    const [customHeight, setCustomHeight] = useState(841.89);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [scaleContent, setScaleContent] = useState(true);

    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(
        file?.name || 'output.pdf', '_resized'
    );

    const handleFileAdded = useCallback(async (files: File[]) => {
        const f = files[0];
        if (!f) return;
        flushSync(() => setIsLoading(true));
        try {
            const arrayBuffer = await f.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const firstPage = pdfDoc.getPage(0);
            const { width, height } = firstPage.getSize();
            setFile({
                name: f.name,
                file: f,
                size: f.size,
                pageCount: pdfDoc.getPageCount(),
                currentWidth: Math.round(width * 100) / 100,
                currentHeight: Math.round(height * 100) / 100,
            });
        } catch (err) {
            console.error('Failed to load PDF:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            const pdfs = storedFiles.filter(f => f.type === 'application/pdf');
            if (pdfs.length > 0) handleFileAdded(pdfs);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    const removeFile = useCallback(() => setFile(null), []);

    const getTargetDimensions = (): { width: number; height: number } => {
        let w: number, h: number;
        if (preset === 'custom') {
            w = customWidth;
            h = customHeight;
        } else {
            const p = PRESETS.find(p => p.value === preset)!;
            w = p.width;
            h = p.height;
        }
        return orientation === 'landscape' ? { width: h, height: w } : { width: w, height: h };
    };

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file');
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const target = getTargetDimensions();

            for (const page of pages) {
                const { width: oldW, height: oldH } = page.getSize();

                if (scaleContent) {
                    const scaleX = target.width / oldW;
                    const scaleY = target.height / oldH;
                    page.setSize(target.width, target.height);
                    page.scaleContent(scaleX, scaleY);
                } else {
                    page.setSize(target.width, target.height);
                }
            }

            const bytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
            return { blob, filename: sanitized };
        } catch (err) {
            console.error('Failed to resize pages:', err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const target = getTargetDimensions();

    const appliedChanges = useMemo<AppliedChange[]>(() => {
        if (!file) return [];
        const list: AppliedChange[] = [];
        if (preset !== 'a4') {
            const label = preset === 'custom' ? 'Custom dimensions' : (PRESETS.find(p => p.value === preset)?.label ?? preset);
            list.push({ id: 'preset', description: `Page size: ${label}`, onUndo: () => setPreset('a4') });
        }
        if (orientation !== 'portrait') {
            list.push({ id: 'orientation', description: 'Orientation: Landscape', onUndo: () => setOrientation('portrait') });
        }
        if (!scaleContent) {
            list.push({ id: 'scaleContent', description: 'Scale content: off', onUndo: () => setScaleContent(true) });
        }
        return list;
    }, [file, preset, orientation, scaleContent]);

    const handleReset = useCallback(() => {
        setPreset('a4');
        setOrientation('portrait');
        setScaleContent(true);
    }, []);

    return (
        <ToolPageLayout
            title="Resize Pages"
            description="Change the page dimensions of your PDF to a standard size or custom dimensions."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-resize-pages'].about}
            techSetup={toolContent['pdf-resize-pages'].techSetup}
            faqs={toolContent['pdf-resize-pages'].faqs}
            onSave={file ? handleSave : undefined}
            saveDisabled={!file || isProcessing}
            saveLabel="Resize Pages"
            appliedChanges={appliedChanges}
            onResetChanges={handleReset}
            isProcessing={isProcessing}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: file.pageCount }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-resize-pages'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-resize-pages'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    {file && (
                        <div className="mt-3 space-y-0.5">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Current Size</span>
                            <p className="text-sm text-zinc-300">
                                {ptToMm(file.currentWidth)} × {ptToMm(file.currentHeight)} mm
                            </p>
                        </div>
                    )}

                    <div className="space-y-3 mt-3">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Target Size</span>

                        <select
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                            value={preset}
                            onChange={(e) => setPreset(e.target.value as PagePreset)}
                        >
                            {PRESETS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                            <option value="custom">Custom Dimensions</option>
                        </select>

                        {preset === 'custom' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">Width (pt)</label>
                                    <input
                                        type="number"
                                        min="72"
                                        max="3000"
                                        value={customWidth}
                                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">Height (pt)</label>
                                    <input
                                        type="number"
                                        min="72"
                                        max="3000"
                                        value={customHeight}
                                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                    />
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-zinc-500">
                            Target: {ptToMm(target.width)} × {ptToMm(target.height)} mm
                        </p>
                    </div>

                    <div className="space-y-2 mt-3">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Orientation</span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setOrientation('portrait')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${orientation === 'portrait'
                                    ? 'bg-[#3A76F0] text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                            >
                                Portrait
                            </button>
                            <button
                                onClick={() => setOrientation('landscape')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${orientation === 'landscape'
                                    ? 'bg-[#3A76F0] text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                            >
                                Landscape
                            </button>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer mt-3">
                        <input
                            type="checkbox"
                            checked={scaleContent}
                            onChange={(e) => setScaleContent(e.target.checked)}
                            className="accent-[#3A76F0] rounded"
                        />
                        <div>
                            <span className="text-sm text-zinc-300">Scale content to fit new page size</span>
                        </div>
                    </label>
                </>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Reading page dimensions…" />
            ) : !file ? (
                <Dropzone
                    onFilesAdded={handleFileAdded}
                    acceptedTypes={['application/pdf']}
                    maxFiles={1}
                />
            ) : (
                <motion.div
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-medium text-zinc-100">{file.name}</h3>
                            <p className="text-sm text-zinc-500">
                                {formatFileSize(file.size)} • {file.pageCount} pages • {ptToMm(file.currentWidth)} × {ptToMm(file.currentHeight)} mm
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={removeFile}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-500 hover:text-red-500" />
                    </button>
                </motion.div>
            )}
        </ToolPageLayout>
    );
}
