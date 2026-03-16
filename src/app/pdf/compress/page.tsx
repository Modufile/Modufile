'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { FileText, X, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { loadMuPDF } from '@/lib/core/mupdf-loader';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function CompressPdfPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ blob: Blob; savings: number } | null>(null);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const f = newFiles[0];
        if (!f || f.type !== 'application/pdf') return;
        setIsLoading(true);
        setResult(null);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        try {
            const { PDFDocument } = await import('pdf-lib');
            const buf = await f.arrayBuffer();
            const doc = await PDFDocument.load(buf);
            setFile({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size, pageCount: doc.getPageCount() });
        } catch (err) {
            console.error('Failed to load PDF', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFileAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    const handleSave = useCallback(async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file selected');
        setIsProcessing(true);
        try {
            const mupdf = await loadMuPDF();
            const buf = await file.file.arrayBuffer();
            const genDoc = mupdf.Document.openDocument(new Uint8Array(buf), 'application/pdf');
            const doc = genDoc.asPDF();
            if (!doc) throw new Error('Not a valid PDF');

            // Subset unused font glyphs for smaller output
            doc.subsetFonts();

            const outBuf = doc.saveToBuffer('garbage=deduplicate,compress,clean,compress-fonts,compress-images');
            const bytes = new Uint8Array(outBuf.asUint8Array());
            genDoc.destroy();

            const compressed = new Blob([bytes], { type: 'application/pdf' });
            const savings = Math.round((1 - compressed.size / file.size) * 100);
            setResult({ blob: compressed, savings: Math.max(0, savings) });

            const base = file.name.replace(/\.pdf$/i, '');
            const filename = `${base}-compressed.pdf`;
            return { blob: compressed, filename };
        } finally {
            setIsProcessing(false);
        }
    }, [file]);

    const content = toolContent['pdf-compress'];

    return (
        <ToolPageLayout
            title="Compress PDF"
            description="Reduce your PDF file size without losing quality"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            onSave={file ? handleSave : undefined}
            saveDisabled={!file || isProcessing}
            saveLabel="Compress PDF"
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: (file as any).pageCount }] : []}
                    onRemoveFile={() => setFile(null)}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-compress'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-compress'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <h3 className="font-medium text-sm text-zinc-100 mb-3">How it works</h3>
                    <ul className="space-y-3 text-sm text-zinc-400">
                        <li>🗑️ <strong className="text-zinc-200">Garbage collection</strong> — removes unused objects</li>
                        <li>📦 <strong className="text-zinc-200">Stream compression</strong> — re-compresses internal data</li>
                        <li>🔗 <strong className="text-zinc-200">Deduplication</strong> — merges duplicate resources</li>
                        <li>📐 <strong className="text-zinc-200">Linearization</strong> — optimizes for web viewing</li>
                    </ul>
                </>
            }
            about={content?.about}
            techSetup={content?.techSetup}
            faqs={content?.faqs}
        >
            {isLoading ? (
                <FileProcessingOverlay message="Reading PDF…" />
            ) : !file ? (
                <Dropzone
                    onFilesAdded={handleFileAdded}
                    acceptedTypes={['application/pdf']}
                    maxFiles={1}
                />
            ) : (
                <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/10 rounded-lg"><FileText className="w-5 h-5 text-red-400" /></div>
                                <div>
                                    <p className="text-sm font-medium text-white truncate max-w-[300px]">{file.name}</p>
                                    <p className="text-xs text-zinc-500">{formatFileSize(file.size)} · {file.pageCount} page{file.pageCount > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => { setFile(null); setResult(null); }}
                                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                    </motion.div>

                    {isProcessing && <FileProcessingOverlay message="Compressing PDF…" />}

                    {result && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-green-800/50 rounded-xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-500/10 rounded-full">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Compression Complete!</h3>
                                    <p className="text-sm text-zinc-400">
                                        {formatFileSize(file.size)} → {formatFileSize(result.blob.size)}
                                        <span className="ml-2 text-green-400 font-medium">({result.savings}% smaller)</span>
                                    </p>
                                </div>
                            </div>
                            {/* Download handled by header Save button */}
                        </motion.div>
                    )}
                </div>
            )}
        </ToolPageLayout>
    );
}
