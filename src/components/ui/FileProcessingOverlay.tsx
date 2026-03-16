'use client';

import { motion } from 'framer-motion';
import { Logo } from './Logo';

interface FileProcessingOverlayProps {
    message?: string;
    subMessage?: string;
}

export function FileProcessingOverlay({
    message = 'Processing your file…',
    subMessage,
}: FileProcessingOverlayProps) {
    return (
        <div
            className="flex flex-col items-center justify-center min-h-[280px] p-8 border-2 border-dashed rounded-xl border-zinc-700 bg-zinc-900/50"
        >
            {/* Animated rings + Logo */}
            <div className="relative w-20 h-20 mb-6">
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#3A76F0]/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#3A76F0]/20"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Logo isProcessing className="w-10 h-10 text-[#3A76F0]" />
                </div>
            </div>

            <p className="text-sm font-medium text-zinc-300">
                {message}
            </p>

            {subMessage && (
                <p className="text-xs text-zinc-400 mt-1">
                    {subMessage}
                </p>
            )}

            <p className="text-xs text-zinc-500 mt-4">
                Everything stays on your device
            </p>
        </div>
    );
}

