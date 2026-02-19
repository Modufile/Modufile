'use client';

/**
 * Dropzone Component (Layer 1: Presentation)
 * 
 * A drag-and-drop zone for file uploads.
 * Follows the design spec: dashed border, pulse on hover, trust badge.
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const dropzoneRef = useRef<HTMLDivElement>(null);
    const [dropzoneCenter, setDropzoneCenter] = useState({ x: 0, y: 0 });

    // Track mouse position globally during drag
    const handleGlobalDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMousePos({ x: e.clientX, y: e.clientY });
        setIsDragging(true);
    }, []);

    const handleGlobalDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        // Only set dragging to false if we're leaving the window
        if (e.clientX === 0 && e.clientY === 0) {
            setIsDragging(false);
        }
    }, []);

    const handleGlobalDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    // Setup global listeners
    useEffect(() => {
        window.addEventListener('dragover', handleGlobalDragOver);
        window.addEventListener('dragleave', handleGlobalDragLeave);
        window.addEventListener('drop', handleGlobalDrop);

        // Calculate center on mount/resize
        const updateCenter = () => {
            if (dropzoneRef.current) {
                const rect = dropzoneRef.current.getBoundingClientRect();
                setDropzoneCenter({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                });
            }
        };

        updateCenter();
        window.addEventListener('resize', updateCenter);
        window.addEventListener('scroll', updateCenter);

        return () => {
            window.removeEventListener('dragover', handleGlobalDragOver);
            window.removeEventListener('dragleave', handleGlobalDragLeave);
            window.removeEventListener('drop', handleGlobalDrop);
            window.removeEventListener('resize', updateCenter);
            window.removeEventListener('scroll', updateCenter);
        };
    }, [handleGlobalDragOver, handleGlobalDragLeave, handleGlobalDrop]);

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
            e.target.value = '';
        },
        [onFilesAdded, maxFiles]
    );

    // Calculate path for tether
    // Control point creates a nice curve
    const midX = (mousePos.x + dropzoneCenter.x) / 2;
    const midY = (mousePos.y + dropzoneCenter.y) / 2;
    // Add some curve deviation based on distance
    const dist = Math.sqrt(Math.pow(mousePos.x - dropzoneCenter.x, 2) + Math.pow(mousePos.y - dropzoneCenter.y, 2));
    const curveDeviation = Math.min(dist * 0.2, 100);

    const pathD = `M ${mousePos.x} ${mousePos.y} Q ${midX} ${midY + curveDeviation} ${dropzoneCenter.x} ${dropzoneCenter.y}`;

    return (
        <>
            {/* Overlay Portal for tether animation */}
            {isDragging && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <svg className="w-full h-full">
                        <motion.path
                            d={pathD}
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3A76F0" stopOpacity="0" />
                                <stop offset="100%" stopColor="#3A76F0" stopOpacity="1" />
                            </linearGradient>
                        </defs>

                        {/* Pulse effect at mouse cursor */}
                        <motion.circle
                            cx={mousePos.x}
                            cy={mousePos.y}
                            r="8"
                            className="fill-blue-500"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.4, 0.8] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />

                        {/* Connection point at dropzone */}
                        <circle cx={dropzoneCenter.x} cy={dropzoneCenter.y} r="6" className="fill-blue-500" />
                    </svg>
                </div>,
                document.body
            )}

            <motion.div
                ref={dropzoneRef}
                className={`
                    relative flex flex-col items-center justify-center
                    min-h-[280px] p-8
                    border-2 border-dashed rounded-xl
                    transition-all duration-200 ease-out
                    cursor-pointer
                    ${isDragging
                        ? 'border-brand-primary bg-brand-primary/10 scale-[1.02] shadow-[0_0_30px_rgba(58,118,240,0.3)]'
                        : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
                    }
                    ${className}
                `}
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
            ${isDragging ? 'bg-brand-primary/20' : 'bg-zinc-800'}
            `}
                    animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <Upload
                        className={`w-8 h-8 ${isDragging ? 'text-brand-primary' : 'text-zinc-400'}`}
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
                    <Shield className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs text-zinc-400 font-medium">
                        Private.
                    </span>
                </div>
            </motion.div>
        </>
    );
}
