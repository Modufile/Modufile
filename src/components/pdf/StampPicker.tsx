'use client';

import { motion } from 'framer-motion';

export interface StampOption {
    label: string;
    color: string;
    bgColor: string;
}

export const PREBUILT_STAMPS: StampOption[] = [
    { label: 'Approved', color: '#16a34a', bgColor: '#16a34a20' },
    { label: 'Rejected', color: '#dc2626', bgColor: '#dc262620' },
    { label: 'Draft', color: '#d97706', bgColor: '#d9770620' },
    { label: 'Confidential', color: '#dc2626', bgColor: '#dc262620' },
    { label: 'Final', color: '#2563eb', bgColor: '#2563eb20' },
    { label: 'Experimental', color: '#7c3aed', bgColor: '#7c3aed20' },
    { label: 'Not Approved', color: '#dc2626', bgColor: '#dc262620' },
    { label: 'For Comment', color: '#0891b2', bgColor: '#0891b220' },
    { label: 'Top Secret', color: '#be123c', bgColor: '#be123c20' },
];

interface StampPickerProps {
    onSelect: (stamp: StampOption) => void;
    onClose: () => void;
}

export function StampPicker({ onSelect, onClose }: StampPickerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-12 top-0 bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-2xl z-50 w-56"
        >
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Stamps</h4>
            <div className="grid grid-cols-1 gap-1">
                {PREBUILT_STAMPS.map((stamp) => (
                    <button
                        key={stamp.label}
                        onClick={() => { onSelect(stamp); onClose(); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm hover:bg-zinc-800 transition-colors"
                    >
                        <span
                            className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border"
                            style={{
                                color: stamp.color,
                                backgroundColor: stamp.bgColor,
                                borderColor: stamp.color + '40',
                            }}
                        >
                            {stamp.label}
                        </span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
