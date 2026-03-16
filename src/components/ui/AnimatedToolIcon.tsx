'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

/**
 * AnimatedToolIcon Component
 * 
 * Renders custom Framer Motion SVG animations for ALL 30 tools.
 */

interface AnimatedToolIconProps {
    toolName: string;
    fallbackIcon: LucideIcon;
    color: string;
    isHovered?: boolean;
}

export function AnimatedToolIcon({
    toolName,
    fallbackIcon: FallbackIcon,
    color,
}: AnimatedToolIconProps) {
    // Shared timings
    const ambient = { repeat: Infinity, duration: 3, ease: "easeInOut" } as const;
    const fastAmbient = { repeat: Infinity, duration: 1.5, ease: "easeInOut" } as const;
    const linearLoop = { repeat: Infinity, duration: 2, ease: "linear" } as const;

    // Common paths
    const docPath = "M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z";
    const docFold = "M14 2v6h6";
    const imagePath = "M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z";

    switch (toolName) {
        // ----------------------------------------------------------------------
        // PDF CORE OPERATIONS
        // ----------------------------------------------------------------------
        case 'Merge PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.path d="M6 3v18c0 1.1.9 2 2 2h4V1H8c-1.1 0-2 .9-2 2z" animate={{ x: [0, 2, 0] }} transition={ambient} />
                    <motion.path d="M18 3v18c0 1.1-.9 2-2 2h-4V1h4c1.1 0 2 .9 2 2z" animate={{ x: [0, -2, 0] }} transition={ambient} />
                    <motion.line x1="12" y1="4" x2="12" y2="20" strokeWidth="2" animate={{ opacity: [0.2, 1, 0.2] }} transition={fastAmbient} />
                </svg>
            );

        case 'Split PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.path d="M9 2H6a2 2 0 00-2 2v16a2 2 0 002 2h3" animate={{ x: [0, -1, 0] }} transition={ambient} />
                    <motion.path d="M15 2h3a2 2 0 012 2v16a2 2 0 01-2 2h-3" animate={{ x: [0, 1, 0] }} transition={ambient} />
                    <motion.line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 4" animate={{ strokeDashoffset: [0, -10] }} transition={linearLoop} />
                </svg>
            );

        case 'Rotate PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.g animate={{ rotate: [0, 90, 90, 180, 180, 360] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} style={{ transformOrigin: "12px 12px" }}>
                        <path d={docPath} />
                        <path d={docFold} />
                    </motion.g>
                    <motion.path d="M21.5 2v6h-6M2.5 22v-6h6" animate={{ opacity: [0.2, 0.8, 0.2] }} transition={ambient} />
                </svg>
            );

        case 'Remove Pages':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M6 6h12v12H6z" strokeOpacity="0.4" />
                    <motion.path d="M8 8h8v8H8z" animate={{ scale: [1, 0.8, 0.8, 1], y: [0, 4, 4, 0], opacity: [1, 0, 0, 1] }} transition={ambient} fill="#ef4444" fillOpacity="0.1" style={{ transformOrigin: "12px 12px" }} />
                    <motion.path d="M10 10l4 4m0-4l-4 4" stroke="#ef4444" animate={{ opacity: [1, 0, 0, 1] }} transition={ambient} />
                </svg>
            );

        case 'Extract Pages':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M4 6h12v12H4z" strokeOpacity="0.4" />
                    <motion.path d="M8 8h12v12H8z" animate={{ x: [0, 4, 4, 0], y: [0, -4, -4, 0], opacity: [0.8, 1, 1, 0.8] }} transition={ambient} fill="var(--background-app, #000)" stroke="currentColor" />
                    <motion.path d="M12 14l4-4 4 4m-4-4v9" animate={{ y: [0, -2, 0], opacity: [0.5, 1, 0.5] }} transition={fastAmbient} />
                </svg>
            );

        // ----------------------------------------------------------------------
        // PDF CONTENT EDITING
        // ----------------------------------------------------------------------
        case 'Watermark':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeOpacity="0.4" />
                    <path d={docFold} strokeOpacity="0.4" />
                    <motion.g animate={{ scale: [0.8, 1.1, 1, 0.8], opacity: [0, 1, 1, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeOut" }} style={{ transformOrigin: "12px 12px" }}>
                        <rect x="5" y="10" width="14" height="4" rx="1" fill="currentColor" fillOpacity="0.2" transform="rotate(-15 12 12)" />
                    </motion.g>
                </svg>
            );

        case 'Edit Metadata':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeOpacity="0.4" />
                    <path d={docFold} strokeOpacity="0.4" />
                    <motion.path d="M12 2h8a2 2 0 012 2v8l-7.5 7.5a2 2 0 01-2.828 0L9 16.828a2 2 0 010-2.828L16.5 6.5" animate={{ y: [0, -2, 0], rotate: [0, 5, 0] }} transition={ambient} fill="currentColor" fillOpacity="0.1" style={{ transformOrigin: "12px 12px" }} />
                    <motion.circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" animate={{ scale: [1, 1.5, 1] }} transition={fastAmbient} />
                </svg>
            );

        case 'Organize PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.rect x="4" y="4" width="6" height="6" rx="1" animate={{ x: [0, 10, 10, 0], y: [0, 0, 10, 10] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />
                    <motion.rect x="14" y="4" width="6" height="6" rx="1" animate={{ x: [0, 0, -10, -10], y: [0, 10, 10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />
                    <motion.rect x="4" y="14" width="6" height="6" rx="1" animate={{ x: [0, 10, 0, -10], y: [0, -10, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />
                </svg>
            );

        case 'Flatten Forms':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} />
                    <path d={docFold} />
                    <motion.g animate={{ y: [0, 4, 4, 0], opacity: [0, 1, 0, 0] }} transition={ambient}>
                        <rect x="8" y="8" width="8" height="2" fill="currentColor" fillOpacity="0.3" stroke="none" />
                    </motion.g>
                    <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2" />
                </svg>
            );

        case 'Add Text':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeOpacity="0.4" />
                    <path d={docFold} strokeOpacity="0.4" />
                    <motion.path d="M8 10h8m-4 0v8" strokeWidth="2" animate={{ opacity: [0.2, 1, 1, 0.2] }} transition={ambient} />
                    <motion.line x1="16" y1="10" x2="16" y2="18" strokeWidth="1" animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} />
                </svg>
            );

        case 'Add Image':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeOpacity="0.4" />
                    <path d={docFold} strokeOpacity="0.4" />
                    <motion.g animate={{ y: [6, 0, 0, 6], opacity: [0, 1, 1, 0] }} transition={ambient}>
                        <rect x="7" y="10" width="10" height="6" rx="1" fill="var(--background-app, #000)" stroke="currentColor" />
                        <circle cx="10" cy="12" r="1.5" fill="currentColor" />
                    </motion.g>
                </svg>
            );

        case 'Redact PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeOpacity="0.6" />
                    <path d={docFold} strokeOpacity="0.6" />
                    <line x1="8" y1="12" x2="16" y2="12" strokeOpacity="0.4" />
                    <line x1="8" y1="16" x2="14" y2="16" strokeOpacity="0.4" />
                    <motion.rect x="8" y="11" height="3" fill="currentColor" rx="1" animate={{ width: [0, 8, 8, 0], opacity: [0.9, 0.9, 0, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
                    <motion.rect x="8" y="15" height="3" fill="currentColor" rx="1" animate={{ width: [0, 6, 6, 0], opacity: [0, 0, 0.9, 0.9] }} transition={{ repeat: Infinity, duration: 4, delay: 2 }} />
                </svg>
            );

        case 'Page Numbers':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.path d="M4 4h12v12H4z" strokeOpacity="0.4" animate={{ x: [-4, 0, 0, -4], opacity: [0, 1, 1, 0] }} transition={ambient} />
                    <motion.text x="12" y="14" fontSize="6" fontWeight="bold" fill="currentColor" stroke="none" animate={{ opacity: [0, 1, 1, 0] }} transition={ambient}>1</motion.text>
                    <motion.path d="M8 8h12v12H8z" fill="var(--background-app, #000)" stroke="currentColor" animate={{ x: [0, 4, 4, 0] }} transition={ambient} />
                    <motion.text x="16" y="18" fontSize="6" fontWeight="bold" fill="currentColor" stroke="none" animate={{ scale: [0.5, 1.2, 1, 0.5], opacity: [0, 1, 1, 0] }} transition={ambient} style={{ transformOrigin: "16px 18px" }}>2</motion.text>
                </svg>
            );

        case 'Resize Pages':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeDasharray="2 2" strokeOpacity="0.4" />
                    <motion.path d={docPath} animate={{ scale: [1, 1.15, 1.15, 1] }} transition={ambient} style={{ transformOrigin: "12px 12px" }} fill="currentColor" fillOpacity="0.1" />
                    <motion.path d="M16 16l4 4m0 0v-3m0 3h-3" animate={{ x: [0, 2, 0], y: [0, 2, 0] }} transition={fastAmbient} />
                </svg>
            );

        case 'PDF Editor':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeOpacity="0.4" />
                    <path d={docFold} strokeOpacity="0.4" />
                    <motion.path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" animate={{ rotate: [0, -5, 5, 0], y: [0, -1, 1, 0] }} transition={ambient} fill="var(--background-app, #000)" style={{ transformOrigin: "12px 12px" }} />
                    <motion.path d="M5 16l3 3" animate={{ opacity: [0.5, 1, 0.5] }} transition={fastAmbient} />
                </svg>
            );

        // ----------------------------------------------------------------------
        // PDF SECURITY & REPAIR
        // ----------------------------------------------------------------------
        case 'Compress PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.g animate={{ scale: [1, 0.85, 0.85, 1], opacity: [1, 0.8, 0.8, 1] }} transition={ambient} style={{ transformOrigin: "12px 12px" }}>
                        <path d={docPath} />
                        <path d={docFold} />
                    </motion.g>
                    <motion.path d="M4 12h4m-3-3l3 3-3 3M20 12h-4m3-3l-3 3 3 3" animate={{ opacity: [0, 1, 1, 0], x: [0, 2, 2, 0] }} transition={ambient} />
                </svg>
            );

        case 'Protect PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeOpacity="0.4" />
                    <motion.rect x="9" y="14" width="6" height="5" rx="1" fill="currentColor" fillOpacity="0.2" animate={{ scale: [1, 1.1, 1] }} transition={ambient} style={{ transformOrigin: "12px 16px" }} />
                    <motion.path d="M10 14V12a2 2 0 114 0v2" animate={{ y: [-2, 0, 0, -2] }} transition={ambient} />
                </svg>
            );

        case 'Unlock PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeOpacity="0.4" />
                    <motion.rect x="9" y="14" width="6" height="5" rx="1" fill="currentColor" fillOpacity="0.2" animate={{ scale: [1, 1.1, 1] }} transition={ambient} style={{ transformOrigin: "12px 16px" }} />
                    <motion.path d="M10 14V12a2 2 0 114 0v2" animate={{ y: [0, -2, -2, 0] }} transition={ambient} />
                </svg>
            );

        case 'Repair PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.path d="M6 2h8l6 6v4" strokeDasharray="3 3" animate={{ strokeDashoffset: [10, 0] }} transition={linearLoop} />
                    <path d="M20 16v4a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2" strokeOpacity="0.4" />
                    <motion.path d="M14 14l6 6m-3-5l4 4" animate={{ rotate: [0, -20, 0], scale: [1, 1.2, 1] }} transition={fastAmbient} style={{ transformOrigin: "16px 16px" }} />
                </svg>
            );

        case 'PDF/A':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M21 8v13H3V8" strokeOpacity="0.4" />
                    <path d="M1 3h22v5H1z" strokeOpacity="0.4" />
                    <motion.path d="M10 12h4" strokeWidth="2" animate={{ opacity: [1, 0, 1] }} transition={fastAmbient} />
                    <motion.path d={docPath} animate={{ y: [-10, 0, 0, -10], opacity: [0, 1, 1, 0] }} transition={ambient} fill="var(--background-app, #000)" stroke="currentColor" transform="scale(0.6) translate(10, 8)" />
                </svg>
            );

        // ----------------------------------------------------------------------
        // CONVERSION TOOLS
        // ----------------------------------------------------------------------
        case 'Scan to PDF':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeOpacity="0.4" />
                    <circle cx="12" cy="13" r="4" strokeOpacity="0.4" />
                    <motion.rect x="10" y="11" width="4" height="4" fill="currentColor" animate={{ scale: [1, 5, 1], opacity: [0, 0.5, 0] }} transition={fastAmbient} style={{ transformOrigin: "12px 13px" }} />
                </svg>
            );

        case 'PDF to Word':
        case 'Office to PDF': // Use inverse/similar animation
        case 'PDF to Excel':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" animate={{ x: [0, -5, -5, 0], opacity: [1, 0, 0, 1] }} transition={ambient} />
                    <motion.path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" animate={{ x: [5, 0, 0, 5], opacity: [0, 1, 1, 0] }} transition={ambient} fill="var(--background-app, #000)" stroke="currentColor" />
                    <motion.path d="M14 2l-4 20" strokeOpacity="0.2" animate={{ x: [10, -10, -10, 10] }} transition={ambient} />
                </svg>
            );

        case 'OCR PDF':
        case 'Image to Text':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d={docPath} strokeOpacity="0.3" />
                    <line x1="8" y1="12" x2="16" y2="12" strokeOpacity="0.3" />
                    <line x1="8" y1="16" x2="14" y2="16" strokeOpacity="0.3" />
                    <motion.line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="2" animate={{ y: [0, 12, 0] }} transition={ambient} />
                    <motion.path d="M8 12h8m-8 4h6" animate={{ strokeOpacity: [0, 1, 0] }} transition={ambient} />
                </svg>
            );

        // ----------------------------------------------------------------------
        // IMAGE TOOLS
        // ----------------------------------------------------------------------
        case 'Compress Image':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.g animate={{ scale: [1, 0.8, 0.8, 1] }} transition={ambient} style={{ transformOrigin: "12px 12px" }}>
                        <path d={imagePath} />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                    </motion.g>
                    <motion.path d="M12 2v4m0 16v-4m-10-10h4m16 0h-4" animate={{ opacity: [0, 1, 1, 0], scale: [1, 0.8, 0.8, 1] }} transition={ambient} style={{ transformOrigin: "12px 12px" }} />
                </svg>
            );

        case 'Convert Image':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.path d={imagePath} animate={{ x: [-2, 2, -2] }} transition={ambient} />
                    <motion.path d="M21 15l-5-5L5 21" animate={{ opacity: [0.5, 1, 0.5] }} transition={fastAmbient} />
                    <motion.circle cx="8.5" cy="8.5" r="1.5" animate={{ scale: [1, 1.2, 1] }} transition={fastAmbient} style={{ transformOrigin: "8.5px 8.5px" }} />
                </svg>
            );

        case 'Resize & Crop':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M6 2v14a2 2 0 002 2h14" strokeOpacity="0.4" />
                    <path d="M18 22V8a2 2 0 00-2-2H2" strokeOpacity="0.4" />
                    <motion.rect x="6" y="6" width="12" height="12" strokeDasharray="4 4" animate={{ x: [0, 2, 0], y: [0, 2, 0], width: [12, 8, 12], height: [12, 8, 12] }} transition={ambient} />
                </svg>
            );

        case 'Batch Editor':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <motion.g animate={{ rotate: [0, 180, 360] }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }} style={{ transformOrigin: "12px 12px" }}>
                        <path d="M4 6a2 2 0 012-2h4v16H6a2 2 0 01-2-2V6z" strokeOpacity="0.5" />
                        <path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4V4z" fill="var(--background-app, #000)" stroke="currentColor" />
                    </motion.g>
                    <motion.path d="M12 8v8M8 12h8" animate={{ rotate: [0, 90, 180] }} transition={ambient} style={{ transformOrigin: "12px 12px" }} />
                </svg>
            );

        default:
            return (
                <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={ambient}
                >
                    <FallbackIcon className="w-6 h-6" style={{ color }} />
                </motion.div>
            );
    }
}
