'use client';

import { useState, useCallback } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, FileOutput, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';

interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: number;
}

const SUPPORTED_EXTENSIONS = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.odt', '.ods', '.odp'];

export default function OfficeToPdfPage() {
    const [file, setFile] = useState<UploadedFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const f = newFiles[0];
        if (!f) return;
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) return;
        setResult(null);
        setError(null);
        setFile({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size });
    }, []);

    const handleConvert = useCallback(async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const worker = new Worker(
                new URL('@/workers/office-zeta.worker.ts', import.meta.url),
                { type: 'module' }
            );

            const buf = await file.file.arrayBuffer();

            const resultPromise = new Promise<Blob>((resolve, reject) => {
                worker.onmessage = (e) => {
                    if (e.data.error) {
                        reject(new Error(e.data.error));
                    } else if (e.data.result) {
                        resolve(new Blob([e.data.result], { type: 'application/pdf' }));
                    }
                    worker.terminate();
                };
                worker.onerror = () => {
                    reject(new Error('Worker failed'));
                    worker.terminate();
                };
            });

            worker.postMessage({
                operationId: crypto.randomUUID(),
                fileBuffer: buf,
                fileName: file.name,
            }, [buf]);

            const blob = await resultPromise;
            setResult(blob);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Conversion failed';
            setError(msg || 'Conversion failed. The ZetaOffice engine may not be available yet.');
        } finally {
            setIsProcessing(false);
        }
    }, [file]);

    const handleDownload = useCallback(() => {
        if (!result || !file) return;
        const base = file.name.replace(/\.[^.]+$/, '');
        downloadBlob(result, `${base}.pdf`);
    }, [result, file]);

    const content = toolContent['office-to-pdf'];

    return (
        <ToolPageLayout
            title="Office to PDF"
            description="Convert Word, Excel, and PowerPoint files to PDF"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            sidebar={
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <h3 className="font-medium text-sm text-zinc-100 mb-3">Supported formats</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {SUPPORTED_EXTENSIONS.map(ext => (
                                <span key={ext} className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400 text-center font-mono">
                                    {ext}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <h3 className="font-medium text-sm text-zinc-100 mb-3">How it works</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Uses ZetaOffice (LibreOffice compiled to WebAssembly) for pixel-perfect conversion.
                            The engine downloads once (~50MB) and is cached for instant subsequent use.
                        </p>
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
                                    <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                            <button onClick={() => { setFile(null); setResult(null); setError(null); }}
                                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                    </motion.div>

                    {isProcessing && <FileProcessingOverlay message="Converting document to PDF…" />}

                    {error && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-amber-800/50 rounded-xl p-5">
                            <div className="flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-amber-300 mb-1">Conversion Unavailable</h3>
                                    <p className="text-xs text-zinc-400">{error}</p>
                                    <p className="text-xs text-zinc-500 mt-2">The ZetaOffice WASM engine (~50MB) is being integrated. This feature will be fully available soon.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {result && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-green-800/50 rounded-xl p-6 text-center">
                            <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                                <FileOutput className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Conversion Complete!</h3>
                            <p className="text-sm text-zinc-400 mb-4">Your PDF is ready.</p>
                            <button onClick={handleDownload}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors">
                                Download PDF
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            <FloatingActionBar
                isVisible={!!file && !result && !error && !isProcessing}
                isProcessing={isProcessing}
                onAction={handleConvert}
                actionLabel={<><FileOutput className="w-4 h-4" /> Convert to PDF</>}
            />
        </ToolPageLayout>
    );
}
