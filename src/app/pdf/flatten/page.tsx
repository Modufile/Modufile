'use client';

import { useState, useCallback } from 'react';
import { Dropzone } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Layers } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { PDFDocument } from 'pdf-lib';

interface PDFFile {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
}

export default function PDFFlattenPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        try {
            const arrayBuffer = await uploadedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            setFile({
                id: crypto.randomUUID(),
                file: uploadedFile,
                name: uploadedFile.name,
                size: uploadedFile.size,
                pageCount: pdfDoc.getPageCount()
            });

        } catch (error) {
            console.error('Failed to load PDF', error);
        }
    }, []);

    const removeFile = useCallback(() => {
        setFile(null);
    }, []);

    const handleFlatten = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            try {
                // Flatten Form Fields
                const form = pdfDoc.getForm();
                form.flatten();
            } catch (e) {
                // If there is no form, this might throw or do nothing
                console.log('No form fields to flatten or error flattening:', e);
            }

            // Note: form.flatten() does not flatten annotations that are not widgets
            // pdf-lib does not support general annotation flattening in the same simple call, but form fields is the main use case.

            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            downloadBlob(blob, `flattened_${file.name}`);

        } catch (error) {
            console.error('Flatten failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Flatten PDF"
            description="Convert editable form fields into permanent static content."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Info</h3>
                    <p className="text-xs text-zinc-500">
                        Flattening a PDF merges form fields into the page content. This prevents further editing of the form data and ensures it prints correctly.
                    </p>
                </div>
            }
        >
            {!file ? (
                <Dropzone
                    onFilesAdded={handleFileAdded}
                    acceptedTypes={['application/pdf']}
                    maxFiles={1}
                />
            ) : (
                <div className="space-y-6">
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
                </div>
            )}

            <FloatingActionBar
                isVisible={!!file}
                isProcessing={isProcessing}
                onAction={handleFlatten}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Flatten Form Fields
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
