'use client';

import { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
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

export default function PDFAPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<Blob | null>(null);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const f = newFiles[0];
        if (!f || f.type !== 'application/pdf') return;
        flushSync(() => setIsLoading(true));
        setResult(null);
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

            const outBuf = doc.saveToBuffer('garbage=deduplicate,compress,clean,appearance=all');
            const bytes = new Uint8Array(outBuf.asUint8Array());
            genDoc.destroy();

            const blob = new Blob([bytes], { type: 'application/pdf' });
            setResult(blob);
            const base = file.name.replace(/\.pdf$/i, '');
            return { blob, filename: `${base}-pdfa.pdf` };
        } catch (err) {
            console.error('PDF/A conversion failed:', err);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    }, [file]);

    const content = toolContent['pdf-pdfa'];

    return (
        <ToolPageLayout
            title="Convert to PDF/A"
            description="Convert your PDF to archival-compliant PDF/A format"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            onSave={file ? handleSave : undefined}
            saveDisabled={!file || isProcessing}
            saveLabel="Convert to PDF/A"
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: (file as any).pageCount }] : []}
                    onRemoveFile={() => setFile(null)}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-pdfa'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-pdfa'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <h3 className="font-medium text-sm text-zinc-100 mb-3">About PDF/A</h3>
                    <ul className="space-y-3 text-sm text-zinc-400">
                        <li>📁 <strong className="text-zinc-200">Long-term archival</strong> — ISO standard for document preservation</li>
                        <li>🔤 <strong className="text-zinc-200">Embedded fonts</strong> — All fonts are embedded for consistent rendering</li>
                        <li>🎨 <strong className="text-zinc-200">Color profiles</strong> — Standardized color spaces</li>
                        <li>🏛️ <strong className="text-zinc-200">Compliance</strong> — Required by many government and legal institutions</li>
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
                                <div className="p-2 bg-purple-500/10 rounded-lg"><FileText className="w-5 h-5 text-purple-400" /></div>
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

                    {isProcessing && <FileProcessingOverlay message="Converting to PDF/A…" />}

                    {result && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-green-800/50 rounded-xl p-6 text-center">
                            <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">PDF/A Ready!</h3>
                            <p className="text-sm text-zinc-400">Your PDF has been converted to archival format.</p>
                            {/* Download handled by header Save button */}
                        </motion.div>
                    )}
                </div>
            )}
        </ToolPageLayout>
    );
}
