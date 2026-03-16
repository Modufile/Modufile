'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Pencil } from 'lucide-react';
import { Logo } from '@/components/ui';
import { formatFileSize } from '@/lib/core/format';

interface FileInfo {
    name: string;
    size: number;
    pageCount?: number;
}

interface FloatingActionBarProps {
    isVisible: boolean;
    isProcessing: boolean;
    onAction: () => void;
    actionLabel: ReactNode;
    subtitle?: string;
    disabled?: boolean;
    fileInfo?: FileInfo;
    outputFilename?: string;
    onFilenameChange?: (name: string) => void;
}

export function FloatingActionBar({
    isVisible,
    isProcessing,
    onAction,
    actionLabel,
    subtitle,
    disabled = false,
    fileInfo,
    outputFilename,
    onFilenameChange,
}: FloatingActionBarProps) {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm z-50"
        >
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-[#3A76F0] shrink-0" />
                    {fileInfo && (
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{fileInfo.name}</span>
                            <span className="text-zinc-600">·</span>
                            <span className="text-zinc-500 whitespace-nowrap">{formatFileSize(fileInfo.size)}</span>
                            {fileInfo.pageCount != null && (
                                <>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-zinc-500 whitespace-nowrap">
                                        {fileInfo.pageCount} {fileInfo.pageCount === 1 ? 'page' : 'pages'}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                    {outputFilename != null && onFilenameChange && (
                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-700">
                            <Pencil className="w-3 h-3 text-zinc-500 shrink-0" />
                            <input
                                type="text"
                                value={outputFilename}
                                onChange={(e) => onFilenameChange(e.target.value)}
                                className="bg-transparent text-sm text-zinc-300 border-b border-zinc-700 focus:border-[#3A76F0] outline-none px-1 py-0.5 w-48 transition-colors"
                                title="Output filename"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {subtitle && (
                        <span className="text-sm text-zinc-500">
                            {subtitle}
                        </span>
                    )}
                    <button
                        onClick={onAction}
                        disabled={isProcessing || disabled}
                        className="flex items-center gap-2 px-6 py-3 bg-[#3A76F0] hover:bg-[#2563EB] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Logo isProcessing className="w-5 h-5 text-white" />
                                Processing...
                            </>
                        ) : (
                            actionLabel
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
