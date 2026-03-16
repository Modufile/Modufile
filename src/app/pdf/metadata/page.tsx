'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Dropzone, FileProcessingOverlay } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout, type AppliedChange } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/lib/core/format';
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

function dateToLocalInput(date: Date | null | undefined): string {
    if (!date) return '';
    try {
        // Format as YYYY-MM-DDTHH:mm for datetime-local input
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d}T${h}:${min}`;
    } catch {
        return '';
    }
}

export default function PDFMetadataPage() {
    const [file, setFile] = useState<PDFFile | null>(null);
    const [metadata, setMetadata] = useState<Metadata>(EmptyMetadata);
    const [originalMetadata, setOriginalMetadata] = useState<Metadata>(EmptyMetadata);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(
        file?.name || 'output.pdf', '_metadata'
    );

    const handleFileAdded = useCallback(async (newFiles: File[]) => {
        const uploadedFile = newFiles[0];
        if (!uploadedFile || uploadedFile.type !== 'application/pdf') return;

        setIsLoading(true);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
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

            const loaded: Metadata = {
                title: pdfDoc.getTitle() || '',
                author: pdfDoc.getAuthor() || '',
                subject: pdfDoc.getSubject() || '',
                keywords: pdfDoc.getKeywords() || '',
                creator: pdfDoc.getCreator() || '',
                producer: pdfDoc.getProducer() || '',
                creationDate: dateToLocalInput(pdfDoc.getCreationDate()),
                modificationDate: dateToLocalInput(pdfDoc.getModificationDate()),
            };
            setMetadata(loaded);
            setOriginalMetadata(loaded);
        } catch (error) {
            console.error('Failed to load PDF', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
        setOriginalMetadata(EmptyMetadata);
    }, []);

    const updateField = (field: keyof Metadata, value: string) => {
        setMetadata(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file');
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            if (metadata.title) pdfDoc.setTitle(metadata.title);
            if (metadata.author) pdfDoc.setAuthor(metadata.author);
            if (metadata.subject) pdfDoc.setSubject(metadata.subject);
            if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords.split(',').map(s => s.trim()));
            if (metadata.creator) pdfDoc.setCreator(metadata.creator);
            if (metadata.producer) pdfDoc.setProducer(metadata.producer);

            // Set creation date if provided
            if (metadata.creationDate) {
                pdfDoc.setCreationDate(new Date(metadata.creationDate));
            }

            // Set modification date — use user input or current time
            if (metadata.modificationDate) {
                pdfDoc.setModificationDate(new Date(metadata.modificationDate));
            } else {
                pdfDoc.setModificationDate(new Date());
            }

            const bytes = await pdfDoc.save();
            const blob = new Blob([bytes as any], { type: 'application/pdf' });
            return { blob, filename: sanitized };
        } catch (error) {
            console.error('Metadata save failed:', error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const FIELD_LABELS: Record<keyof Metadata, string> = {
        title: 'Title',
        author: 'Author',
        subject: 'Subject',
        keywords: 'Keywords',
        creator: 'Creator',
        producer: 'Producer',
        creationDate: 'Creation Date',
        modificationDate: 'Modification Date',
    };

    const appliedChanges = useMemo<AppliedChange[]>(() => {
        if (!file) return [];
        return (Object.keys(metadata) as (keyof Metadata)[])
            .filter(key => metadata[key] !== originalMetadata[key])
            .map(key => ({
                id: key,
                description: `${FIELD_LABELS[key]}: "${String(metadata[key]).slice(0, 30)}${String(metadata[key]).length > 30 ? '…' : ''}"`,
                onUndo: () => setMetadata(prev => ({ ...prev, [key]: originalMetadata[key] })),
            }));
    }, [file, metadata, originalMetadata]);

    const handleReset = useCallback(() => {
        setMetadata(originalMetadata);
    }, [originalMetadata]);

    const inputClass = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]";

    return (
        <ToolPageLayout
            title="Edit Metadata"
            description="View and modify hidden PDF properties like Title, Author, Keywords, and Dates."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-metadata'].about}
            techSetup={toolContent['pdf-metadata'].techSetup}
            faqs={toolContent['pdf-metadata'].faqs}
            onSave={file ? handleSave : undefined}
            saveDisabled={!file || isProcessing}
            saveLabel="Update Metadata"
            appliedChanges={appliedChanges}
            onResetChanges={handleReset}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size, pageCount: (file as any).pageCount }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFileAdded}
                    acceptsMultipleFiles={toolContent['pdf-metadata'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['pdf-metadata'].acceptedFileTypes}
                />
            }
            sidebar={
                <>
                    <h3 className="text-sm font-medium text-zinc-100">Info</h3>
                    <p className="text-xs text-zinc-500">
                        Metadata helps search engines and operating systems organize your files.
                        All fields are optional.
                    </p>
                </>
            }
        >
            {isLoading ? (
                <FileProcessingOverlay message="Importing file..." />
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
                                    {formatFileSize(file.size)} · {file.pageCount} pages
                                </p>
                            </div>
                        </div>
                        <button onClick={removeFile} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-zinc-500 hover:text-red-500" />
                        </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Title</label>
                                <input type="text" value={metadata.title} onChange={(e) => updateField('title', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Author</label>
                                <input type="text" value={metadata.author} onChange={(e) => updateField('author', e.target.value)} className={inputClass} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Subject</label>
                                <input type="text" value={metadata.subject} onChange={(e) => updateField('subject', e.target.value)} className={inputClass} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Keywords</label>
                                <input type="text" value={metadata.keywords} onChange={(e) => updateField('keywords', e.target.value)} placeholder="Separated by commas" className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Creator</label>
                                <input type="text" value={metadata.creator} onChange={(e) => updateField('creator', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Producer</label>
                                <input type="text" value={metadata.producer} onChange={(e) => updateField('producer', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        {/* Date fields */}
                        <div className="border-t border-zinc-800 pt-6">
                            <h4 className="text-sm font-medium text-zinc-100 mb-4">Dates</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Creation Date</label>
                                    <input
                                        type="datetime-local"
                                        value={metadata.creationDate}
                                        onChange={(e) => updateField('creationDate', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Modification Date</label>
                                    <input
                                        type="datetime-local"
                                        value={metadata.modificationDate}
                                        onChange={(e) => updateField('modificationDate', e.target.value)}
                                        className={inputClass}
                                    />
                                    <p className="text-xs text-zinc-600 mt-1">Leave empty to use current time on save.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </ToolPageLayout>
    );
}
