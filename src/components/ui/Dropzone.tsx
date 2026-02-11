'use client';

/**
 * Dropzone Component (Layer 1: Presentation)
 * 
 * A drag-and-drop zone for file uploads.
 * Follows the design spec: dashed border, pulse on hover, trust badge.
 */

import { useCallback, useState } from 'react';
import { Upload, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface DropzoneProps {
    onFilesAdded: (files: File[]) => void;
    acceptedTypes?: string[];
    maxFiles?: number;
    className?: string;
}

export function Dropzone({
    onFilesAdded,
    acceptedTypes = ['application/pdf', 'image/*', 'video/*'],
    maxFiles = 10,
    className = '',
}: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const droppedFiles = Array.from(e.dataTransfer.files).slice(0, maxFiles);
            if (droppedFiles.length > 0) {
                onFilesAdded(droppedFiles);
            }
        },
        [onFilesAdded, maxFiles]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = Array.from(e.target.files || []).slice(0, maxFiles);
            if (selectedFiles.length > 0) {
                onFilesAdded(selectedFiles);
            }
            // Reset input so same file can be selected again
            e.target.value = '';
        },
        [onFilesAdded, maxFiles]
    );

    return (
        <motion.div
            className={`
        relative flex flex-col items-center justify-center
        min-h-[280px] p-8
        border-2 border-dashed rounded-xl
        transition-all duration-200 ease-out
        cursor-pointer
        ${isDragging
                    ? 'border-[#3A76F0] bg-[#3A76F0]/10 scale-[1.02]'
                    : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
                }
        ${className}
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <input
                type="file"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="File upload"
            />

            <motion.div
                className={`
          p-4 rounded-full mb-4
          ${isDragging ? 'bg-[#3A76F0]/20' : 'bg-zinc-800'}
        `}
                animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
            >
                <Upload
                    className={`w-8 h-8 ${isDragging ? 'text-[#3A76F0]' : 'text-zinc-400'}`}
                />
            </motion.div>

            <h3 className="text-lg font-medium text-zinc-100 mb-2">
                {isDragging ? 'Drop files here' : 'Drag and drop your files here'}
            </h3>

            <p className="text-sm text-zinc-500 mb-4">
                or click to browse. Supports PDFs, PNG, JPG, DOCX, and more.
            </p>

            {/* Trust Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full">
                <Shield className="w-4 h-4 text-[#3A76F0]" />
                <span className="text-xs text-zinc-400 font-medium">
                    Private.
                </span>
            </div>
        </motion.div>
    );
}
