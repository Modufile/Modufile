'use client';

import {
    MousePointer, Highlighter, Underline, Strikethrough,
    PenTool, Type, StickyNote, Stamp, ImagePlus, EyeOff,
    Square, Circle, Minus, ArrowRight, Eraser,
} from 'lucide-react';

export type AnnotationTool =
    | 'select'
    | 'highlight' | 'underline' | 'strikethrough'
    | 'rectangle' | 'circle' | 'line' | 'arrow'
    | 'freehand'
    | 'freetext'
    | 'sticky-note'
    | 'stamp'
    | 'image-stamp'
    | 'redact'
    | 'eraser';

interface ToolDef {
    tool: AnnotationTool;
    icon: typeof MousePointer;
    label: string;
    shortcut: string;
    group: string;
}

const TOOLS: ToolDef[] = [
    { tool: 'select', icon: MousePointer, label: 'Select', shortcut: 'V', group: 'general' },
    { tool: 'highlight', icon: Highlighter, label: 'Highlight', shortcut: 'H', group: 'markup' },
    { tool: 'underline', icon: Underline, label: 'Underline', shortcut: 'U', group: 'markup' },
    { tool: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', shortcut: 'S', group: 'markup' },
    { tool: 'rectangle', icon: Square, label: 'Rectangle', shortcut: '1', group: 'shape' },
    { tool: 'circle', icon: Circle, label: 'Circle', shortcut: '2', group: 'shape' },
    { tool: 'line', icon: Minus, label: 'Line', shortcut: '3', group: 'shape' },
    { tool: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: '4', group: 'shape' },
    { tool: 'freehand', icon: PenTool, label: 'Draw', shortcut: 'D', group: 'draw' },
    { tool: 'freetext', icon: Type, label: 'Text', shortcut: 'T', group: 'text' },
    { tool: 'sticky-note', icon: StickyNote, label: 'Note', shortcut: 'N', group: 'text' },
    { tool: 'stamp', icon: Stamp, label: 'Stamp', shortcut: 'P', group: 'stamp' },
    { tool: 'image-stamp', icon: ImagePlus, label: 'Image', shortcut: 'I', group: 'stamp' },
    { tool: 'redact', icon: EyeOff, label: 'Redact', shortcut: 'X', group: 'redact' },
    { tool: 'eraser', icon: Eraser, label: 'Delete', shortcut: 'E', group: 'general' },
];

const GROUP_ORDER = ['general', 'markup', 'shape', 'draw', 'text', 'stamp', 'redact'];

interface AnnotationToolbarProps {
    activeTool: AnnotationTool;
    onToolChange: (tool: AnnotationTool) => void;
    direction?: 'vertical' | 'horizontal';
}

export function AnnotationToolbar({ activeTool, onToolChange, direction = 'vertical' }: AnnotationToolbarProps) {
    const grouped = GROUP_ORDER.map(group => ({
        group,
        tools: TOOLS.filter(t => t.group === group),
    }));

    if (direction === 'horizontal') {
        return (
            <div className="flex items-center gap-0.5 bg-zinc-900 border-b border-zinc-800 px-2 py-1.5 overflow-x-auto shrink-0">
                {grouped.map(({ group, tools }, gi) => (
                    <div key={group} className="flex items-center gap-0.5 shrink-0">
                        {gi > 0 && <div className="w-px h-5 bg-zinc-700/60 mx-1 shrink-0" />}
                        {tools.map(({ tool, icon: Icon, label, shortcut }) => (
                            <button
                                key={tool}
                                onClick={() => onToolChange(tool)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                                    activeTool === tool
                                        ? 'bg-[#3A76F0] text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                                title={`${label} (${shortcut})`}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-xl">
            {grouped.map(({ group, tools }, gi) => (
                <div key={group}>
                    {gi > 0 && <div className="h-px bg-zinc-800 my-1" />}
                    {tools.map(({ tool, icon: Icon, label, shortcut }) => (
                        <button
                            key={tool}
                            onClick={() => onToolChange(tool)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                activeTool === tool
                                    ? 'bg-[#3A76F0] text-white shadow-lg shadow-[#3A76F0]/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                            title={`${label} (${shortcut})`}
                        >
                            <Icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
}

export { TOOLS };
