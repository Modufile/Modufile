'use client';

import {
    Info, Cpu, Settings, FileText, Image as ImageIcon,
    FileCode2, Download, Loader2, Pencil, ChevronDown,
    SlidersHorizontal, X
} from 'lucide-react';
import { FaqSection } from '@/components/ui/FaqSection';
import { Logo } from '@/components/ui';
import { DownloadToast } from '@/components/ui/DownloadToast';
import type { FAQ, TechSetup } from '@/data/tool-faqs';
import { ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { downloadBlob } from '@/lib/core/download';
import { AnimatePresence, motion } from 'framer-motion';
import { flushSync } from 'react-dom';
import { AppliedChangesPanel, type AppliedChange } from './AppliedChangesPanel';

export type { AppliedChange };

export interface ExportFormat {
    label: string;
    value: string;
}

interface ToolPageLayoutProps {
    title: string;
    description: string;
    parentCategory: string;
    parentHref: string;
    children: ReactNode;
    sidebar?: ReactNode;
    /** ImportedFilesPanel — rendered just above AppliedChangesPanel at the bottom of the sidebar. */
    importedFilesPanel?: ReactNode;
    leftSidebarActions?: ReactNode;
    about?: string;
    techSetup?: TechSetup[];
    faqs?: FAQ[];
    onSave?: () => Promise<{ blob: Blob; filename: string } | void>;
    saveDisabled?: boolean;
    saveLabel?: string;
    isProcessing?: boolean;
    outputFilename?: string;
    onFilenameChange?: (v: string) => void;
    centerControls?: ReactNode;
    exportFormats?: ExportFormat[];
    onExportAs?: (format: string) => Promise<void>;
    appliedChanges?: AppliedChange[];
    onResetChanges?: () => void;
}

export function ToolPageLayout({
    title,
    description,
    parentCategory,
    parentHref,
    children,
    sidebar,
    importedFilesPanel,
    leftSidebarActions,
    about,
    techSetup,
    faqs,
    onSave,
    saveDisabled = false,
    saveLabel = 'Save',
    isProcessing = false,
    outputFilename,
    onFilenameChange,
    centerControls,
    exportFormats,
    onExportAs,
    appliedChanges,
    onResetChanges,
}: ToolPageLayoutProps) {
    const [savePending, setSavePending] = useState(false);
    const [toast, setToast] = useState<{ filename: string; blobUrl: string } | null>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [exportPending, setExportPending] = useState(false);
    const [mobilePropsOpen, setMobilePropsOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!exportMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [exportMenuOpen]);

    const handleSaveClick = useCallback(async () => {
        if (!onSave || savePending) return;
        flushSync(() => setSavePending(true));
        try {
            const result = await onSave();
            if (result?.blob) {
                const url = URL.createObjectURL(result.blob);
                downloadBlob(result.blob, result.filename);
                setToast({ filename: result.filename, blobUrl: url });
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSavePending(false);
        }
    }, [onSave, savePending]);

    const handleExportAs = useCallback(async (format: string) => {
        if (!onExportAs) return;
        setExportMenuOpen(false);
        setExportPending(true);
        try {
            await onExportAs(format);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExportPending(false);
        }
    }, [onExportAs]);

    const handleCloseToast = useCallback(() => {
        setToast(prev => {
            if (prev) URL.revokeObjectURL(prev.blobUrl);
            return null;
        });
    }, []);

    const isBusy = savePending || isProcessing;

    const sidebarContent = (
        <>
            {outputFilename != null && onFilenameChange && (
                <div className="px-4 py-3 border-b border-zinc-800/60 shrink-0">
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Output Name</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <Pencil className="w-3 h-3 text-zinc-600 shrink-0" />
                        <input
                            value={outputFilename}
                            onChange={e => onFilenameChange(e.target.value)}
                            className="flex-1 bg-transparent text-xs text-zinc-300 border-b border-zinc-700 focus:border-[#3A76F0] outline-none py-0.5 min-w-0 transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* Tool-specific options — fills remaining space */}
            <div className="p-4 flex-1 bg-[#111112]">
                {sidebar || (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-40">
                        <Settings className="w-8 h-8 text-zinc-600" />
                        <p className="text-xs text-zinc-500 max-w-[200px]">Select an element on the canvas to edit its properties here.</p>
                    </div>
                )}
            </div>

            {/* Imported files — second to last */}
            {importedFilesPanel && (
                <div className="px-4 py-3 border-t border-zinc-800/60 bg-[#111112]">
                    {importedFilesPanel}
                </div>
            )}

            {/* Applied changes — always last */}
            {appliedChanges !== undefined && (
                <div className="px-4 py-3 border-t border-zinc-800/60 bg-[#111112]">
                    <AppliedChangesPanel changes={appliedChanges} onReset={onResetChanges} />
                </div>
            )}
        </>
    );

    return (
        <div className="fixed inset-0 z-[100] flex flex-col font-sans bg-[#09090B] text-zinc-100 overflow-hidden">
            <header className="h-[52px] border-b border-zinc-800 bg-[#141415] shrink-0 flex items-center justify-between px-4 gap-2">
                <div className="flex items-center gap-3 min-w-0 shrink-0">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
                        <div className="w-8 h-8 bg-[#3A76F0] rounded-lg flex items-center justify-center shadow-sm">
                            <Logo className="w-5 h-5 text-white" />
                        </div>
                        <span className="hidden sm:block font-semibold text-zinc-100 text-[15px] tracking-tight">Modufile</span>
                    </Link>

                    <div className="hidden sm:block h-6 w-px bg-zinc-800" />

                    <div className="hidden sm:flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                            <span className="text-[13px] text-zinc-200 font-medium leading-[1.2] truncate max-w-[180px]">{title}</span>
                            <span className="text-[11px] text-zinc-500 leading-[1.2] truncate max-w-[200px] xl:max-w-[280px]">{description}</span>
                        </div>
                    </div>
                </div>

                {centerControls && (
                    <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                        {centerControls}
                    </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                    <nav className="hidden lg:flex items-center gap-4">
                        <Link prefetch={false} href="/pdf" className="text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">PDF</Link>
                        <Link prefetch={false} href="/image" className="text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Image</Link>
                        <Link prefetch={false} href="/ocr" className="text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors">OCR</Link>
                    </nav>

                    {exportFormats && exportFormats.length > 0 && (
                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setExportMenuOpen(v => !v)}
                                disabled={exportPending || saveDisabled || isBusy}
                                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[13px] font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            >
                                {exportPending
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <ChevronDown className="w-3.5 h-3.5" />
                                }
                                <span className="hidden sm:inline">Export As</span>
                            </button>
                            <AnimatePresence>
                                {exportMenuOpen && (
                                    <motion.div
                                        className="absolute right-0 top-full mt-1.5 w-44 bg-[#1C1C1E] border border-zinc-800 rounded-lg shadow-2xl z-50 py-1 overflow-hidden"
                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                        transition={{ duration: 0.12 }}
                                    >
                                        {exportFormats.map(fmt => (
                                            <button
                                                key={fmt.value}
                                                onClick={() => handleExportAs(fmt.value)}
                                                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                                            >
                                                {fmt.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <button
                        onClick={handleSaveClick}
                        disabled={!onSave || saveDisabled || isBusy}
                        className="h-8 px-4 inline-flex items-center gap-2 rounded-md bg-[#3A76F0] hover:bg-[#2563EB] text-white text-[13px] font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {isBusy
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />
                        }
                        {saveLabel}
                    </button>

                    <button
                        onClick={() => setMobilePropsOpen(true)}
                        className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                        aria-label="Properties"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {leftSidebarActions && (
                    <aside className="w-16 border-r border-zinc-800/60 bg-[#111112] shrink-0 flex flex-col items-center py-4 gap-2 overflow-y-auto">
                        {leftSidebarActions}
                    </aside>
                )}

                <main className="flex-1 min-w-0 bg-[#09090B] overflow-y-auto relative p-4 md:p-6 lg:p-10 flex flex-col">
                    <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                        <div className="flex-1 flex flex-col">
                            {children}
                        </div>
                    </div>

                    {(about || techSetup || faqs) && (
                        <div className="max-w-4xl mx-auto w-full mt-24 pb-24 border-t border-zinc-900 pt-12 space-y-16">
                            {about && (
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Info className="w-5 h-5 text-[#3A76F0]" />
                                        <h2 className="text-base font-medium text-zinc-200">About {title}</h2>
                                    </div>
                                    <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">{about}</p>
                                </section>
                            )}

                            {techSetup && techSetup.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-6">
                                        <Cpu className="w-5 h-5 text-[#3A76F0]" />
                                        <h2 className="text-base font-medium text-zinc-200">Tech Stack</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {techSetup.map((tech, i) => (
                                            <div key={i} className="flex flex-col p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                                                <span className="text-xs font-mono text-[#3A76F0] mb-2">{tech.library}</span>
                                                <span className="text-xs text-zinc-400 leading-relaxed">{tech.purpose}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {faqs && faqs.length > 0 && (
                                <FaqSection faqs={faqs} />
                            )}
                        </div>
                    )}
                </main>

                <aside className="w-[300px] lg:w-[320px] border-l border-zinc-800/60 bg-[#111112] shrink-0 overflow-y-auto flex-col hidden md:flex">
                    {sidebarContent}
                </aside>
            </div>

            <AnimatePresence>
                {mobilePropsOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/60 z-[150] md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobilePropsOpen(false)}
                        />
                        <motion.div
                            className="fixed bottom-0 left-0 right-0 z-[160] md:hidden bg-[#111112] border-t border-zinc-800 max-h-[80vh] overflow-y-auto rounded-t-2xl"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-[#111112] z-10">
                                <div className="w-8 h-1 bg-zinc-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                                <span className="text-sm font-medium text-zinc-300 mt-1">Properties</span>
                                <button
                                    onClick={() => setMobilePropsOpen(false)}
                                    className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-col">
                                {sidebarContent}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <DownloadToast
                        filename={toast.filename}
                        blobUrl={toast.blobUrl}
                        onClose={handleCloseToast}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
