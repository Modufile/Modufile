'use client';

import { useState, useCallback } from 'react';
import { Dropzone } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, FileOutput, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';

interface UploadedFile {
    id: string;
    file: File;
    name: string;
    size: number;
}

const SUPPORTED_EXTENSIONS = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.odt', '.ods', '.odp'];

export default function OfficeToPdfPage() {
    const [file, setFile] = useState<UploadedFile | null>(null);

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const f = newFiles[0];
        if (!f) return;
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) return;
        setFile({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size });
    }, []);

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
                            Uses a LibreOffice-based WASM engine for high-fidelity conversion.
                            This feature is currently being upgraded to a new engine.
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
                            <button onClick={() => setFile(null)}
                                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900 border border-amber-800/50 rounded-xl p-5">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-amber-300 mb-1">Coming Soon</h3>
                                <p className="text-xs text-zinc-400">
                                    Office to PDF conversion is being upgraded to a new engine for better reliability.
                                    This feature will be available again soon.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <FloatingActionBar
                isVisible={false}
                isProcessing={false}
                onAction={() => {}}
                actionLabel={<><FileOutput className="w-4 h-4" /> Convert to PDF</>}
            />
        </ToolPageLayout>
    );
}
