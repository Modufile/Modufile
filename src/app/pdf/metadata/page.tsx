'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { FileText, X, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
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

interface Metadata {
    title: string;
    author: string;
    subject: string;
    keywords: string;
    creator: string;
    producer: string;
    creationDate: string;
    modificationDate: string;
}

const EmptyMetadata: Metadata = {
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: '',
    creationDate: '',
    modificationDate: ''
};

export default function PDFMetadataPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [metadata, setMetadata] = useState<Metadata>(EmptyMetadata);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        setIsLoading(true);

        try {
            const arrayBuffer = await uploadedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

            setFile({
                id: crypto.randomUUID(),
                file: uploadedFile,
                name: uploadedFile.name,
                size: uploadedFile.size,
                pageCount: pdfDoc.getPageCount()
            });

            // Read Metadata
            setMetadata({
                title: pdfDoc.getTitle() || '',
                author: pdfDoc.getAuthor() || '',
                subject: pdfDoc.getSubject() || '',
                keywords: pdfDoc.getKeywords() || '',
                creator: pdfDoc.getCreator() || '',
                producer: pdfDoc.getProducer() || '',
                creationDate: pdfDoc.getCreationDate()?.toISOString() || '',
                modificationDate: pdfDoc.getModificationDate()?.toISOString() || ''
            });

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
        setMetadata(EmptyMetadata);
    }, []);

    const updateField = (field: keyof Metadata, value: string) => {
        setMetadata(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Set Metadata
            if (metadata.title) pdfDoc.setTitle(metadata.title);
            if (metadata.author) pdfDoc.setAuthor(metadata.author);
            if (metadata.subject) pdfDoc.setSubject(metadata.subject);
            if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords.split(',').map(s => s.trim()));
            if (metadata.creator) pdfDoc.setCreator(metadata.creator);
            if (metadata.producer) pdfDoc.setProducer(metadata.producer);

            pdfDoc.setModificationDate(new Date());

            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            downloadBlob(blob, `metadata_${file.name}`);

        } catch (error) {
            console.error('Metadata save failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Edit Metadata"
            description="View and modify hidden PDF properties like Title, Author, and Keywords."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-metadata'].about}
            techSetup={toolContent['pdf-metadata'].techSetup}
            faqs={toolContent['pdf-metadata'].faqs}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Info</h3>
                    <p className="text-xs text-zinc-500">
                        Metadata helps search engines and operating systems organize your files.
                    </p>
                    {metadata.creationDate && (
                        <div className="text-xs text-zinc-500">
                            <span className="block font-medium text-zinc-400">Created</span>
                            {new Date(metadata.creationDate).toLocaleString()}
                        </div>
                    )}
                    {metadata.modificationDate && (
                        <div className="text-xs text-zinc-500">
                            <span className="block font-medium text-zinc-400">Modified</span>
                            {new Date(metadata.modificationDate).toLocaleString()}
                        </div>
                    )}
                </div>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Reading metadata…" />
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

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Title</label>
                                <input
                                    type="text"
                                    value={metadata.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Author</label>
                                <input
                                    type="text"
                                    value={metadata.author}
                                    onChange={(e) => updateField('author', e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Subject</label>
                                <input
                                    type="text"
                                    value={metadata.subject}
                                    onChange={(e) => updateField('subject', e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Keywords</label>
                                <input
                                    type="text"
                                    value={metadata.keywords}
                                    onChange={(e) => updateField('keywords', e.target.value)}
                                    placeholder="Separated by commas"
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Creator</label>
                                <input
                                    type="text"
                                    value={metadata.creator}
                                    onChange={(e) => updateField('creator', e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Producer</label>
                                <input
                                    type="text"
                                    value={metadata.producer}
                                    onChange={(e) => updateField('producer', e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <FloatingActionBar
                isVisible={!!file}
                isProcessing={isProcessing}
                onAction={handleSave}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Update Metadata
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
