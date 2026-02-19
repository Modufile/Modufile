'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Table, AlertTriangle, FileOutput, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { loadMuPDF } from '@/lib/core/mupdf-loader';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFToExcelPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const f = newFiles[0];
        if (!f || f.type !== 'application/pdf') return;
        setIsLoading(true);
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

    const handleConvert = useCallback(async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const mupdf = await loadMuPDF();
            const buf = await file.file.arrayBuffer();
            const doc = mupdf.Document.openDocument(new Uint8Array(buf), 'application/pdf');
            const pageCount = doc.countPages();

            const allRows: string[][] = [];

            for (let i = 0; i < pageCount; i++) {
                try {
                    const page = doc.loadPage(i);
                    // "preserve-spans" is required for font info in JSON output
                    const stext = page.toStructuredText('preserve-spans');
                    const json = stext.asJSON();
                    const data = JSON.parse(json);

                    if (data.blocks) {
                        for (const block of data.blocks) {
                            if (block.type === 'image') continue;
                            if (block.lines) {
                                for (const line of block.lines) {
                                    // MuPDF asJSON() schema: line.text is the text,
                                    // line.x is the x-origin for column positioning
                                    const text = (line.text || '').trim();
                                    if (text) {
                                        // Split by multiple spaces to detect tab-separated columns
                                        const columns = text.split(/\s{2,}/).map((c: string) => c.trim()).filter(Boolean);
                                        allRows.push(columns.length > 1 ? columns : [text]);
                                    }
                                }
                            }
                        }
                    }
                    stext.destroy();
                    page.destroy();
                } catch (pageErr) {
                    console.warn(`Failed to extract data from page ${i + 1}:`, pageErr);
                }
            }

            if (allRows.length === 0) {
                allRows.push(['No data extracted', 'The PDF might be a scanned image']);
            }

            doc.destroy();

            const XLSX = await import('xlsx');
            const ws = XLSX.utils.aoa_to_sheet(allRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');
            const xlsxBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

            setResult(new Blob([xlsxBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        } catch (err) {
            console.error('PDF to Excel conversion failed:', err);
            setError(err instanceof Error ? err.message : 'Conversion failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }, [file]);

    const handleDownload = useCallback(() => {
        if (!result || !file) return;
        const base = file.name.replace(/\.pdf$/i, '');
        downloadBlob(result, `${base}.xlsx`);
    }, [result, file]);

    const content = toolContent['pdf-to-excel'];

    return (
        <ToolPageLayout
            title="PDF to Excel"
            description="Extract tabular data from your PDF into spreadsheets"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            sidebar={
                <div className="space-y-6">
                    <div className="bg-amber-500/5 border border-amber-800/30 rounded-xl p-4">
                        <div className="flex gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300/80">Works best with PDFs containing clear tabular data. Complex layouts may require manual adjustment after conversion.</p>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <h3 className="font-medium text-sm text-zinc-100 mb-3">Output details</h3>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li>📊 Standard .xlsx format</li>
                            <li>📋 Column detection from text positions</li>
                            <li>📄 One sheet per document</li>
                        </ul>
                    </div>
                </div>
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
                                <div className="p-2 bg-green-500/10 rounded-lg"><Table className="w-5 h-5 text-green-400" /></div>
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

                    {isProcessing && <FileProcessingOverlay message="Extracting data to Excel…" />}

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
                            <h3 className="text-lg font-semibold text-white mb-2">Extraction Complete!</h3>
                            <p className="text-sm text-zinc-400 mb-4">Your Excel spreadsheet is ready.</p>
                            <button onClick={handleDownload}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors">
                                Download .xlsx
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            <FloatingActionBar
                isVisible={!!file && !result && !isProcessing}
                isProcessing={isProcessing}
                onAction={handleConvert}
                actionLabel={<><Table className="w-4 h-4" /> Convert to Excel</>}
            />
        </ToolPageLayout>
    );
}
