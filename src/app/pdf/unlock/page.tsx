'use client';

import { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { FileText, X, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { loadMuPDF } from '@/lib/core/mupdf-loader';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
}

export default function UnlockPdfPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Blob | null>(null);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const f = newFiles[0];
        if (!f || f.type !== 'application/pdf') return;
        flushSync(() => setIsLoading(true));
        setResult(null);
        setError(null);
        setPassword('');
        setFile({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size });
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFileAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    const handleSave = useCallback(async (): Promise<{ blob: Blob; filename: string } | void> => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const mupdf = await loadMuPDF();
            const buf = await file.file.arrayBuffer();
            const doc = mupdf.Document.openDocument(new Uint8Array(buf), 'application/pdf');

            if (doc.needsPassword()) {
                const authResult = doc.authenticatePassword(password);
                if (authResult === 0) {
                    setError('Incorrect password. Please try again.');
                    doc.destroy();
                    setIsProcessing(false);
                    return;
                }
            }

            const pdfDoc = doc.asPDF();
            if (!pdfDoc) throw new Error('Not a valid PDF');

            // Save without encryption (decrypt flag removes password)
            const outBuf = pdfDoc.saveToBuffer('garbage=deduplicate,compress,clean,decrypt');
            const bytes = new Uint8Array(outBuf.asUint8Array());
            doc.destroy();

            const blob = new Blob([bytes], { type: 'application/pdf' });
            setResult(blob);

            const base = file.name.replace(/\.pdf$/i, '');
            const filename = `${base}-unlocked.pdf`;
            return { blob, filename };
        } catch (err) {
            setError('Failed to unlock PDF. The file may be corrupted.');
            console.error('Unlock failed:', err);
        } finally {
            setIsProcessing(false);
        }
    }, [file, password]);

    const content = toolContent['pdf-unlock'];

    return (
        <ToolPageLayout
            title="Unlock PDF"
            description="Remove password protection from your PDF files"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            onSave={file ? handleSave : undefined}
            saveDisabled={!file || isProcessing || !password}
            saveLabel="Unlock PDF"
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: (file as any).pageCount }] : []}
                    onRemoveFile={() => setFile(null)}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-unlock'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-unlock'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <h3 className="font-medium text-sm text-zinc-100 mb-3">How it works</h3>
                    <ul className="space-y-3 text-sm text-zinc-400">
                        <li>🔐 <strong className="text-zinc-200">Enter password</strong> — provide the PDF&apos;s password</li>
                        <li>🔓 <strong className="text-zinc-200">Decrypt</strong> — MuPDF authenticates and decrypts</li>
                        <li>💾 <strong className="text-zinc-200">Save clean copy</strong> — re-saved without encryption</li>
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
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg"><Lock className="w-5 h-5 text-amber-400" /></div>
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

                        {!result && (
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter PDF password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-10 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:border-[#3A76F0] outline-none"
                                />
                                <button onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-800/30 rounded-xl text-sm text-red-300">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                        </motion.div>
                    )}

                    {isProcessing && <FileProcessingOverlay message="Unlocking PDF…" />}

                    {result && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-green-800/50 rounded-xl p-6 text-center">
                            <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">PDF Unlocked!</h3>
                            {/* Download handled by header Save button */}
                        </motion.div>
                    )}
                </div>
            )}
        </ToolPageLayout>
    );
}
