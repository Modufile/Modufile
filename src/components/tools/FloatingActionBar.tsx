'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface FloatingActionBarProps {
    isVisible: boolean;
    isProcessing: boolean;
    onAction: () => void;
    actionLabel: ReactNode;
    subtitle?: string;
    disabled?: boolean;
}

export function FloatingActionBar({
    isVisible,
    isProcessing,
    onAction,
    actionLabel,
    subtitle,
    disabled = false
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
                    <Shield className="w-4 h-4 text-[#3A76F0]" />
                    <span className="text-sm text-zinc-400">Processed locally</span>
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
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
