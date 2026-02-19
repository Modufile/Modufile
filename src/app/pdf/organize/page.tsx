'use client';

import { useState, useEffect } from 'react';
import { useFileStore } from '@/stores/fileStore';
import { Dropzone } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { PDFVisualEditor } from '@/components/pdf/PDFVisualEditor';

export default function PDFOrganizePage() {
    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    const [files, setFiles] = useState<File[]>([]);

    // Pick up files sent from the homepage dropzone
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            const pdfs = storedFiles.filter((f) => f.type === 'application/pdf');
            if (pdfs.length > 0) setFiles(pdfs);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, setStoredFiles]);

    const handleFilesAdded = (newFiles: File[]) => {
        const pdfs = newFiles.filter((f) => f.type === 'application/pdf');
        if (pdfs.length > 0) setFiles((prev) => [...prev, ...pdfs]);
    };

    return (
        <ToolPageLayout
            title="Organize PDF"
            description="Rearrange, rotate, and delete pages from your PDF documents."
            parentCategory="PDF Tools"
            parentHref="/pdf"
            about={toolContent['pdf-organize'].about}
            techSetup={toolContent['pdf-organize'].techSetup}
            faqs={toolContent['pdf-organize'].faqs}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-4">
                    <h3 className="text-sm font-medium text-zinc-100">Instructions</h3>
                    <ul className="text-sm text-zinc-400 space-y-2 list-disc list-inside">
                        <li>Drag and drop thumbnails to reorder pages.</li>
                        <li>Hover over a page to rotate or delete it.</li>
                        <li>Click &ldquo;Save PDF&rdquo; to download your changes.</li>
                    </ul>
                </div>
            }
        >
            {files.length === 0 ? (
                <Dropzone
                    onFilesAdded={handleFilesAdded}
                    acceptedTypes={['application/pdf']}
                    className="max-w-xl mx-auto mt-10"
                />
            ) : (
                <PDFVisualEditor initialFiles={files} />
            )}
        </ToolPageLayout>
    );
}
