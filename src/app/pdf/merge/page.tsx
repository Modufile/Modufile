'use client';

/**
 * PDF Merge Tool Page
 * 
 * Based on Stitch "Merge PDF Workbench" design
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
    FileText,
    ChevronRight,
    Settings,
    GripVertical,
    X,
    Download,
    Shield,
    Plus
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { Dropzone } from '@/components/ui';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount?: number;
}

export default function PDFMergePage() {
    const [files, setFiles] = useState<PDFFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputFilename, setOutputFilename] = useState('merged');

    const handleFilesAdded = useCallback((newFiles: File[]) => {
        const pdfFiles = newFiles
            .filter(f => f.type === 'application/pdf')
            .map(file => ({
                id: crypto.randomUUID(),
                file,
                name: file.name,
                size: file.size,
            }));

        setFiles(prev => [...prev, ...pdfFiles]);
    }, []);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const handleMerge = async () => {
        if (files.length < 2) return;

        setIsProcessing(true);

        try {
            // Import pdf-lib dynamically for code splitting
            const { PDFDocument } = await import('pdf-lib');

            const mergedPdf = await PDFDocument.create();

            for (const pdfFile of files) {
                const arrayBuffer = await pdfFile.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedBytes = await mergedPdf.save();

            // Create download link
            const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${outputFilename}.pdf`;
            a.click();
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Merge failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    return (
        <div className="min-h-screen bg-[#09090B] text-zinc-100">
            {/* Header */}
            <header className="border-b border-zinc-800">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#3A76F0] rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-semibold">Modufile</span>
                        </Link>

                        {/* Breadcrumbs */}
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                        <Link href="/pdf" className="text-sm text-zinc-400 hover:text-white">
                            PDF
                        </Link>
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                        <span className="text-sm text-zinc-100">Merge</span>
                    </div>

                    <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                        <Settings className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Stage */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-2xl font-semibold mb-2">Merge PDF</h1>
                            <p className="text-zinc-400">
                                Combine multiple PDF files into a single document. Drag to reorder.
                            </p>
                        </div>

                        {/* Dropzone or File List */}
                        {files.length === 0 ? (
                            <Dropzone
                                onFilesAdded={handleFilesAdded}
                                acceptedTypes={['application/pdf']}
                            />
                        ) : (
                            <div className="space-y-4">
                                {/* File List */}
                                <Reorder.Group
                                    axis="y"
                                    values={files}
                                    onReorder={setFiles}
                                    className="space-y-2"
                                >
                                    {files.map((pdfFile) => (
                                        <Reorder.Item
                                            key={pdfFile.id}
                                            value={pdfFile}
                                            className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg cursor-grab active:cursor-grabbing"
                                        >
                                            <GripVertical className="w-4 h-4 text-zinc-600" />
                                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-100 truncate">
                                                    {pdfFile.name}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {formatSize(pdfFile.size)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFile(pdfFile.id)}
                                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4 text-zinc-500 hover:text-red-500" />
                                            </button>
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>

                                {/* Add More Button */}
                                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-600 transition-colors">
                                    <input
                                        type="file"
                                        multiple
                                        accept="application/pdf"
                                        onChange={(e) => handleFilesAdded(Array.from(e.target.files || []))}
                                        className="hidden"
                                    />
                                    <Plus className="w-4 h-4 text-zinc-500" />
                                    <span className="text-sm text-zinc-500">Add more PDFs</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <h3 className="text-sm font-medium text-zinc-100 mb-4">Options</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-2">
                                        Output Filename
                                    </label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={outputFilename}
                                            onChange={(e) => setOutputFilename(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-l-md text-sm focus:outline-none focus:border-[#3A76F0]"
                                            placeholder="merged"
                                        />
                                        <span className="px-3 py-2 bg-zinc-800 border border-l-0 border-zinc-700 rounded-r-md text-sm text-zinc-500">
                                            .pdf
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Summary */}
                        {files.length > 0 && (
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-zinc-500">Files</span>
                                    <span className="text-zinc-100">{files.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Total Size</span>
                                    <span className="text-zinc-100">{formatSize(totalSize)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Action Bar */}
            {files.length >= 2 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm"
                >
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-[#3A76F0]" />
                            <span className="text-sm text-zinc-400">Processed locally</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-zinc-500">
                                {formatSize(totalSize)} estimated output
                            </span>
                            <button
                                onClick={handleMerge}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-6 py-3 bg-[#3A76F0] hover:bg-[#2563EB] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Merging...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Merge {files.length} PDFs
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
