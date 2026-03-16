'use client';

import { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { FileText, X, ScanSearch, FileOutput, Globe } from 'lucide-react';
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

const LANGUAGES = [
    { code: 'eng', label: 'English' },
    { code: 'fra', label: 'French' },
    { code: 'deu', label: 'German' },
    { code: 'spa', label: 'Spanish' },
    { code: 'ita', label: 'Italian' },
    { code: 'por', label: 'Portuguese' },
    { code: 'nld', label: 'Dutch' },
    { code: 'jpn', label: 'Japanese' },
    { code: 'kor', label: 'Korean' },
    { code: 'chi_sim', label: 'Chinese (Simplified)' },
    { code: 'hin', label: 'Hindi' },
    { code: 'ara', label: 'Arabic' },
];

export default function OCRPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState('eng');
    const [progress, setProgress] = useState('');
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
        setProgress('Loading OCR engine…');
        try {
            const Tesseract = await import('tesseract.js');
            const mupdf = await loadMuPDF();
            const buf = await file.file.arrayBuffer();
            const doc = mupdf.Document.openDocument(new Uint8Array(buf), 'application/pdf');
            const pageCount = doc.countPages();

            const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.load(await file.file.arrayBuffer());
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            const worker = await Tesseract.createWorker(language, 1, {
                logger: (m: { status: string; progress: number }) => {
                    if (m.status === 'recognizing text') {
                        setProgress(`Recognizing text… ${Math.round(m.progress * 100)}%`);
                    }
                }
            });

            for (let i = 0; i < pageCount; i++) {
                setProgress(`OCR: page ${i + 1} of ${pageCount}…`);

                const page = doc.loadPage(i);
                const bounds = page.getBounds();
                const width = bounds[2] - bounds[0];
                const height = bounds[3] - bounds[1];
                const scale = 200 / 72;

                const pixmap = page.toPixmap(
                    mupdf.Matrix.scale(scale, scale),
                    mupdf.ColorSpace.DeviceRGB,
                    true,  // alpha — gives RGBA (4 channels) for direct ImageData use
                    true,
                );

                const pw = pixmap.getWidth();
                const ph = pixmap.getHeight();
                const pixels = pixmap.getPixels();

                // Create canvas from RGBA pixel data for Tesseract
                const canvas = document.createElement('canvas');
                canvas.width = pw;
                canvas.height = ph;
                const ctx = canvas.getContext('2d')!;

                // Copy pixels out of WASM heap before destroying pixmap
                const pixelsCopy = new Uint8ClampedArray(pw * ph * 4);
                pixelsCopy.set(pixels);
                const imgData = new ImageData(pixelsCopy, pw, ph);
                pixmap.destroy();

                ctx.putImageData(imgData, 0, 0);

                const { data } = await worker.recognize(canvas);

                const pdfPage = pdfDoc.getPage(i);
                const { width: pageWidth, height: pageHeight } = pdfPage.getSize();

                const words = data.blocks?.flatMap(
                    (b: { paragraphs?: { lines?: { words?: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }[] }[] }[] }) =>
                        b.paragraphs?.flatMap(p => p.lines?.flatMap(l => l.words || []) || []) || []
                ) || [];

                for (const word of words) {
                    const x = (word.bbox.x0 / canvas.width) * pageWidth;
                    const y = pageHeight - (word.bbox.y1 / canvas.height) * pageHeight;
                    const fontSize = Math.max(6, ((word.bbox.y1 - word.bbox.y0) / canvas.height) * pageHeight * 0.8);

                    pdfPage.drawText(word.text, {
                        x, y,
                        size: fontSize,
                        font,
                        color: rgb(0, 0, 0),
                        opacity: 0,
                    });
                }
            }

            await worker.terminate();
            doc.destroy();

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });
            setResult(blob);
            setProgress('');
            const base = file.name.replace(/\.pdf$/i, '');
            return { blob, filename: `${base}-ocr.pdf` };
        } catch (err) {
            console.error('OCR failed:', err);
            setProgress('');
            throw err;
        } finally {
            setIsProcessing(false);
        }
    }, [file, language]);

    const content = toolContent['pdf-ocr'];

    return (
        <ToolPageLayout
            title="OCR PDF"
            description="Make scanned PDFs searchable with optical character recognition"
            parentCategory="PDF Tools"
            parentHref="/pdf"
            onSave={file ? handleSave : undefined}
            saveDisabled={!file || isProcessing}
            saveLabel="Run OCR"
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: (file as any).pageCount }] : []}
                    onRemoveFile={() => setFile(null)}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-ocr'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-ocr'].acceptedFileTypes}
                />
            }
            sidebar={
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <h3 className="font-medium text-sm text-zinc-100 mb-3 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-[#3A76F0]" /> Language
                        </h3>
                        <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:border-[#3A76F0] outline-none"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.label}</option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-2">Language data (~10MB) downloads on first use and is cached locally.</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                        <h3 className="font-medium text-sm text-zinc-100 mb-3">How it works</h3>
                        <ol className="space-y-2 text-xs text-zinc-400">
                            <li>1. Renders each page as an image</li>
                            <li>2. Tesseract.js recognizes text</li>
                            <li>3. Invisible text layer is added</li>
                            <li>4. Original appearance is preserved</li>
                        </ol>
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
                                <div className="p-2 bg-indigo-500/10 rounded-lg"><ScanSearch className="w-5 h-5 text-indigo-400" /></div>
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

                    {progress && !result && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                            <p className="text-sm text-[#3A76F0]">{progress}</p>
                        </motion.div>
                    )}

                    {isProcessing && <FileProcessingOverlay message={progress || 'Processing OCR…'} />}

                    {result && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-green-800/50 rounded-xl p-6 text-center">
                            <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-3">
                                <FileOutput className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">OCR Complete!</h3>
                            <p className="text-sm text-zinc-400">Your PDF is now searchable.</p>
                            {/* Download handled by header Save button */}
                        </motion.div>
                    )}
                </div>
            )}
        </ToolPageLayout>
    );
}
