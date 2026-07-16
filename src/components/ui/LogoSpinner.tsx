'use client';

import { motion } from 'framer-motion';
import { Logo } from './Logo';

interface LogoSpinnerProps {
    /** Logo size in px. */
    size?: number;
    /** Optional text shown next to the logo. */
    label?: string;
    className?: string;
}

/**
 * Compact brand loading indicator — the Modufile logo rhythmically
 * shrinking and expanding. Use inline wherever a file is being read
 * or an engine (WASM/module) is downloading. For a full workspace
 * placeholder, use FileProcessingOverlay instead (built on the same logo pulse).
 */
export function LogoSpinner({ size = 28, label, className = '' }: LogoSpinnerProps) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`} role="status" aria-live="polite">
            <motion.div
                style={{ width: size, height: size }}
                className="shrink-0"
                animate={{ scale: [1, 0.78, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
                <Logo isProcessing className="w-full h-full text-[#3A76F0]" />
            </motion.div>
            {label && <span className="text-xs text-zinc-400">{label}</span>}
        </div>
    );
}
