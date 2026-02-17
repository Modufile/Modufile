'use client';

import { useState, useEffect } from 'react';
import { notices } from '@/config/notices';
import { X, AlertTriangle, Info, CheckCircle, AlertOctagon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function GlobalNotices() {
    const [visibleNotices, setVisibleNotices] = useState(notices.filter(n => n.active));
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    useEffect(() => {
        // Load dismissed notices from localStorage if needed, or session storage
        // For now, let's keep it simple (per session/refresh)
    }, []);

    const handleDismiss = (id: string) => {
        setDismissedIds(prev => [...prev, id]);
    };

    const activeNotices = visibleNotices.filter(n => !dismissedIds.includes(n.id));

    if (activeNotices.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
            <AnimatePresence>
                {activeNotices.map((notice) => (
                    <motion.div
                        key={notice.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={`
                            p-4 rounded-lg shadow-lg border backdrop-blur-md
                            flex items-start gap-3
                            ${notice.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200' :
                                notice.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                                    notice.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-200' :
                                        'bg-blue-500/10 border-blue-500/20 text-blue-200'}
                        `}
                    >
                        <div className="mt-0.5 shrink-0">
                            {notice.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                            {notice.type === 'error' && <AlertOctagon className="w-5 h-5" />}
                            {notice.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {notice.type === 'info' && <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 text-sm leading-relaxed">
                            {notice.message}
                        </div>
                        {notice.dismissible && (
                            <button
                                onClick={() => handleDismiss(notice.id)}
                                className="p-1 hover:bg-white/10 rounded transition-colors -mt-1 -mr-1"
                            >
                                <X className="w-4 h-4 opacity-60 hover:opacity-100" />
                            </button>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
