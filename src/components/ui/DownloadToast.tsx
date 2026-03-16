'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, X, CheckCircle } from 'lucide-react';

interface DownloadToastProps {
    filename: string;
    blobUrl: string;
    onClose: () => void;
}

export function DownloadToast({ filename, blobUrl, onClose }: DownloadToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 10000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-5 right-5 z-[200] flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl px-4 py-3 max-w-sm"
        >
            <div className="p-1.5 bg-green-500/15 rounded-lg shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-zinc-100">Downloading</p>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">{filename}</p>
                <a
                    href={blobUrl}
                    download={filename}
                    className="inline-flex items-center gap-1 text-[11px] text-[#3A76F0] hover:text-[#2563EB] mt-1 transition-colors"
                >
                    <Download className="w-3 h-3" />
                    Problem? Download again
                </a>
            </div>

            <button
                onClick={onClose}
                className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
}
