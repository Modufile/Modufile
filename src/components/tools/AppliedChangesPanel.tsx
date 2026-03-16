'use client';

import { X, RotateCcw } from 'lucide-react';

export interface AppliedChange {
    id: string;
    description: string;
    /** Optional hex color dot shown before the label (e.g. '#ef4444'). Used by the editor for annotation colors. */
    color?: string;
    /** Highlights this row — used by the editor to show the currently selected annotation. */
    isSelected?: boolean;
    /** Called when the row is clicked. When provided the row becomes a hover-interactive element. */
    onClick?: () => void;
    /** Shows an X delete/undo button. Omit for items that can't be individually removed. */
    onUndo?: () => void;
}

interface AppliedChangesPanelProps {
    changes: AppliedChange[];
    onReset?: () => void;
}

export function AppliedChangesPanel({ changes, onReset }: AppliedChangesPanelProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Applied Changes</span>
                    <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        {changes.length}
                    </span>
                </div>
                {onReset && changes.length > 0 && (
                    <button
                        onClick={onReset}
                        className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Reset all changes"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                )}
            </div>

            {changes.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-zinc-800/60 rounded-lg">
                    <p className="text-[11px] text-zinc-600">No changes applied yet.</p>
                </div>
            ) : (
                <div className="overflow-y-auto" style={{ maxHeight: '160px' }}>
                    {changes.map((change, idx) => (
                        <div
                            key={change.id}
                            onClick={change.onClick}
                            className={`
                                flex items-center gap-2 py-1.5 px-1.5 rounded-md group transition-colors
                                ${idx < changes.length - 1 ? 'mb-0.5' : ''}
                                ${change.isSelected ? 'bg-[#3A76F0]/15' : change.onClick ? 'hover:bg-zinc-800/60' : ''}
                                ${change.onClick ? 'cursor-pointer' : ''}
                            `}
                        >
                            {change.color && (
                                <span
                                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                                    style={{ backgroundColor: change.color }}
                                />
                            )}
                            <span
                                className={`text-xs truncate flex-1 min-w-0 ${change.isSelected ? 'text-[#3A76F0]' : 'text-zinc-300'}`}
                                title={change.description}
                            >
                                {change.description}
                            </span>
                            {change.onUndo && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); change.onUndo!(); }}
                                    className="p-1 min-w-[24px] shrink-0 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                                    title="Undo / delete"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
