'use client';

import { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { FileText, X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
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

export default function ProtectPdfPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [userPassword, setUserPassword] = useState('');
    const [ownerPassword, setOwnerPassword] = useState('');
    const [showUserPw, setShowUserPw] = useState(false);
    const [showOwnerPw, setShowOwnerPw] = useState(false);
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
        if (!file || (!userPassword && !ownerPassword)) throw new Error('No file or password provided');
        setIsProcessing(true);
        try {
            const mupdf = await loadMuPDF();
            const buf = await file.file.arrayBuffer();
            const genDoc = mupdf.Document.openDocument(new Uint8Array(buf), 'application/pdf');
            const doc = genDoc.asPDF();
            if (!doc) throw new Error('Not a valid PDF');

            const opts = ['garbage=deduplicate', 'compress', 'encrypt=aes-256'];
            if (userPassword) opts.push(`user-password=${userPassword}`);
            if (ownerPassword) opts.push(`owner-password=${ownerPassword}`);

            const outBuf = doc.saveToBuffer(opts.join(','));
            const bytes = new Uint8Array(outBuf.asUint8Array());
            genDoc.destroy();

            const blob = new Blob([bytes], { type: 'application/pdf' });
            setResult(blob);

            const base = file.name.replace(/\.pdf$/i, '');
            const filename = `${base}-protected.pdf`;
            return { blob, filename };
        } finally {
            setIsProcessing(false);
        }
    }, [file, userPassword, ownerPassword]);

    const content = toolContent['pdf-protect'];

    return (
        <ToolPageLayout
            title="Protect PDF"
            description="Add password protection and encryption to your PDF"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            onSave={file ? handleSave : undefined}
            saveDisabled={!file || isProcessing || (!userPassword && !ownerPassword)}
            saveLabel="Protect PDF"
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: (file as any).pageCount }] : []}
                    onRemoveFile={() => setFile(null)}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-protect'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-protect'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <h3 className="font-medium text-sm text-zinc-100 mb-3">Encryption</h3>
                    <ul className="space-y-3 text-sm text-zinc-400">
                        <li>🔒 <strong className="text-zinc-200">AES-256</strong> — strongest PDF encryption</li>
                        <li>👤 <strong className="text-zinc-200">User password</strong> — required to open</li>
                        <li>👑 <strong className="text-zinc-200">Owner password</strong> — controls permissions</li>
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
                                <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="w-5 h-5 text-blue-400" /></div>
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

                        {!result && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Open Password (User)</label>
                                    <div className="relative">
                                        <input type={showUserPw ? 'text' : 'password'} placeholder="Required to open PDF"
                                            value={userPassword} onChange={e => setUserPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-10 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:border-[#3A76F0] outline-none" />
                                        <button onClick={() => setShowUserPw(!showUserPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                            {showUserPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Permissions Password (Owner)</label>
                                    <div className="relative">
                                        <input type={showOwnerPw ? 'text' : 'password'} placeholder="Required for editing permissions"
                                            value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-10 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:border-[#3A76F0] outline-none" />
                                        <button onClick={() => setShowOwnerPw(!showOwnerPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                            {showOwnerPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {isProcessing && <FileProcessingOverlay message="Encrypting PDF…" />}

                    {result && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-green-800/50 rounded-xl p-6 text-center">
                            <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">PDF Protected!</h3>
                            <p className="text-sm text-zinc-400">AES-256 encryption applied.</p>
                            {/* Download handled by header Save button */}
                        </motion.div>
                    )}
                </div>
            )}
        </ToolPageLayout>
    );
}
