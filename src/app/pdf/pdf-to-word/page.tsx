'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, FileOutput, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { loadPyMuPDF, preloadPyMuPDF } from '@/lib/pymupdf-loader';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFToWordPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [result, setResult] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stage, setStage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();

    // Preload PyMuPDF engine on page mount
    useEffect(() => {
        preloadPyMuPDF();
    }, []);

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const f = newFiles[0];
        if (!f || f.type !== 'application/pdf') return;
        setResult(null);
        setError(null);
        try {
            const { PDFDocument } = await import('pdf-lib');
            const buf = await f.arrayBuffer();
            const doc = await PDFDocument.load(buf);
            setFile({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size, pageCount: doc.getPageCount() });
        } catch (err) {
            console.error('Failed to load PDF', err);
        }
    }, []);

    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFileAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    const handleConvert = useCallback(async () => {
        if (!file) return;
        setIsProcessing(true);
        setStage('Loading engine...');
        setError(null);

        try {
            const pymupdf = await loadPyMuPDF();

            setStage('Converting to Word...');
            const docxBlob: Blob = await pymupdf.pdfToDocx(file.file);

            setResult(docxBlob);
            setStage('');
        } catch (err: any) {
            console.error('PDF to Word conversion failed:', err);
            setError(err.message || 'Conversion failed');
        } finally {
            setIsProcessing(false);
        }
    }, [file]);

    const handleDownload = useCallback(() => {
        if (!result || !file) return;
        const base = file.name.replace(/\.pdf$/i, '');
        downloadBlob(result, `${base}.docx`);
    }, [result, file]);

    const content = toolContent['pdf-to-word'];

    return (
        <ToolPageLayout
            title="PDF to Word"
            description="Convert your PDF documents to editable Word files with high quality"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            sidebar={
                <div className="space-y-6">
                    <div className="bg-amber-500/5 border border-amber-800/30 rounded-xl p-4">
                        <div className="flex gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300/80">
                                This tool uses the <strong>PyMuPDF engine</strong> for high-fidelity conversion.
                                It handles tables, images, and complex layouts well.
                                <br /><br />
                                <em>Note: The first time you use this, it may take a few seconds to load the engine.</em>
                            </p>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <h3 className="font-medium text-sm text-zinc-100 mb-3">Output details</h3>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li>📄 Standard .docx format</li>
                            <li>🖼️ Preserves images & tables</li>
                            <li>📏 Retains page layout</li>
                        </ul>
                    </div>
                </div>
            }
            about={content?.about}
            techSetup={content?.techSetup}
            faqs={content?.faqs}
        >
            {!file ? (
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
                                <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="w-5 h-5 text-blue-400" /></div>
                                <div>
                                    <p className="text-sm font-medium text-white truncate max-w-[300px]">{file.name}</p>
                                    <p className="text-xs text-zinc-500">{formatFileSize(file.size)} · {file.pageCount} page{file.pageCount > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={() => { setFile(null); setResult(null); setError(null); }}
                                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                    </motion.div>

                    {isProcessing && (
                        <FileProcessingOverlay
                            message={stage || 'Converting...'}
                            subMessage={stage === 'Loading engine...' ? 'Downloading components (first time only)' : undefined}
                        />
                    )}

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-800/30 rounded-xl text-sm text-red-300">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </motion.div>
                    )}

                    {result && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-green-800/50 rounded-xl p-6 text-center">
                            <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                                <FileOutput className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Conversion Complete!</h3>
                            <p className="text-sm text-zinc-400 mb-4">Your Word document is ready.</p>
                            <button onClick={handleDownload}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors">
                                Download .docx
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            <FloatingActionBar
                isVisible={!!file && !result && !isProcessing}
                isProcessing={isProcessing}
                onAction={handleConvert}
                actionLabel={<><FileOutput className="w-4 h-4" /> Convert to Word</>}
            />
        </ToolPageLayout>
    );
}
