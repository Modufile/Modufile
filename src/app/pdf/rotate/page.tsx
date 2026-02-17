'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolFaqs } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, RotateCw, RotateCcw, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { PDFDocument, degrees } from 'pdf-lib';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFRotatePage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rotationAngle, setRotationAngle] = useState(0); // 0, 90, 180, 270

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        setIsLoading(true);

        try {
            const arrayBuffer = await uploadedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();

            setFile({
                id: crypto.randomUUID(),
                file: uploadedFile,
                name: uploadedFile.name,
                size: uploadedFile.size,
                pageCount
            });
            setRotationAngle(0);
        } catch (error) {
            console.error('Failed to load PDF', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check for files coming from homepage dropzone
    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFileAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFileAdded, setStoredFiles]);

    const removeFile = useCallback(() => {
        setFile(null);
        setRotationAngle(0);
    }, []);

    const rotateLeft = () => setRotationAngle(prev => (prev - 90 + 360) % 360);
    const rotateRight = () => setRotationAngle(prev => (prev + 90) % 360);

    const handleSave = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            pages.forEach(page => {
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + rotationAngle));
            });

            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            downloadBlob(blob, `rotated_${file.name}`);

        } catch (error) {
            console.error('Rotation failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Rotate PDF"
            description="Rotate all pages of a PDF by 90°, 180°, or 270°."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            faqs={toolFaqs['pdf-rotate']}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Rotation Options</h3>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={rotateLeft}
                            className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex flex-col items-center gap-2 transition-colors"
                        >
                            <RotateCcw className="w-6 h-6 text-zinc-400" />
                            <span className="text-xs text-zinc-400">Left 90°</span>
                        </button>
                        <button
                            onClick={rotateRight}
                            className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex flex-col items-center gap-2 transition-colors"
                        >
                            <RotateCw className="w-6 h-6 text-zinc-400" />
                            <span className="text-xs text-zinc-400">Right 90°</span>
                        </button>
                    </div>

                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                        <p className="text-xs text-zinc-500 text-center">
                            Current Rotation: <span className="text-[#3A76F0] font-medium">{rotationAngle}°</span>
                        </p>
                    </div>
                </div>
            }
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
                <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-medium text-zinc-100">{file.name}</h3>
                                <p className="text-sm text-zinc-500">
                                    {formatFileSize(file.size)} • {file.pageCount} pages
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-500 hover:text-red-500" />
                        </button>
                    </div>

                    {/* Visual Preview of Rotation */}
                    <div className="flex items-center justify-center py-12 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                        <div
                            className="w-32 h-44 bg-white shadow-lg flex items-center justify-center transition-transform duration-300 ease-in-out"
                            style={{ transform: `rotate(${rotationAngle}deg)` }}
                        >
                            <FileText className="w-12 h-12 text-zinc-300" />
                        </div>
                    </div>
                </motion.div>
            )}

            <FloatingActionBar
                isVisible={!!file && rotationAngle !== 0}
                isProcessing={isProcessing}
                onAction={handleSave}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Rotated PDF
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
