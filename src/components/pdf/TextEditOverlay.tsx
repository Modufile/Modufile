'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X } from 'lucide-react';

export interface TextCommitOptions {
    fontName: string;
    fontSize: number;
    textColor: [number, number, number]; // 0–1 range for MuPDF
}

export interface TextEditOverlayProps {
    x: number;
    y: number;
    boxWidth?: number;
    initialText?: string;
    initialBold?: boolean;
    initialItalic?: boolean;
    initialFontSize?: number;
    initialColor?: string; // hex e.g. '#000000'
    onCommit: (text: string, options: TextCommitOptions) => void;
    onCancel: () => void;
}

const PRESET_COLORS = ['#000000', '#ef4444', '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#eab308', '#ffffff'];
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 24, 32, 48];

function hexToRgb01(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
}

function getFontName(bold: boolean, italic: boolean): string {
    if (bold && italic) return 'HelvBI';
    if (bold) return 'HelvB';
    if (italic) return 'HelvI';
    return 'Helv';
}

function ToolBtn({
    active, onMouseDown, title, children,
}: {
    active: boolean; onMouseDown: () => void; title: string; children: React.ReactNode;
}) {
    return (
        <button
            onMouseDown={(e) => { e.preventDefault(); onMouseDown(); }}
            title={title}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                active ? 'bg-[#3A76F0] text-white' : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

export function TextEditOverlay({
    x, y, boxWidth,
    initialText = '',
    initialBold = false,
    initialItalic = false,
    initialFontSize = 14,
    initialColor = '#000000',
    onCommit, onCancel,
}: TextEditOverlayProps) {
    const [text, setText] = useState(initialText);
    const [bold, setBold] = useState(initialBold);
    const [italic, setItalic] = useState(initialItalic);
    const [fontSize, setFontSize] = useState(initialFontSize);
    const [color, setColor] = useState(initialColor);
    const [showColors, setShowColors] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const committedRef = useRef(false);

    useEffect(() => {
        textareaRef.current?.focus();
        if (initialText) textareaRef.current?.select();
    }, [initialText]);

    const doCommit = useCallback(() => {
        if (committedRef.current) return;
        if (!text.trim()) { onCancel(); return; }
        committedRef.current = true;
        onCommit(text, { fontName: getFontName(bold, italic), fontSize, textColor: hexToRgb01(color) });
    }, [text, bold, italic, fontSize, color, onCommit, onCancel]);

    // Commit on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (committedRef.current) return;
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) doCommit();
        };
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 150);
        return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
    }, [doCommit]);

    // Auto-resize textarea height
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    return (
        <div
            ref={containerRef}
            className="absolute z-[300]"
            style={{ left: x, top: y, position: 'absolute' }}
            onKeyDown={(e) => {
                if (e.key === 'Escape') { e.stopPropagation(); onCancel(); }
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doCommit(); }
            }}
        >
            {/* Floating toolbar — absolutely above the textarea, doesn't shift text position */}
            <div className="absolute bottom-full left-0 mb-1 flex items-center gap-0.5 px-1.5 py-1 bg-[#1C1C1E]/90 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-xl w-max">
                <ToolBtn active={bold} onMouseDown={() => setBold(b => !b)} title="Bold">
                    <span className="text-[13px] font-bold">B</span>
                </ToolBtn>
                <ToolBtn active={italic} onMouseDown={() => setItalic(i => !i)} title="Italic">
                    <span className="text-[13px] italic">I</span>
                </ToolBtn>

                <div className="w-px h-4 bg-zinc-700 mx-1" />

                <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="h-6 px-1 text-[11px] bg-zinc-800 border border-zinc-700 rounded text-zinc-200 outline-none cursor-pointer"
                >
                    {FONT_SIZES.map(s => <option key={s} value={s}>{s}pt</option>)}
                </select>

                <div className="w-px h-4 bg-zinc-700 mx-1" />

                {/* Color picker */}
                <div className="relative">
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setShowColors(v => !v); }}
                        title="Text Color"
                        className="w-7 h-7 flex flex-col items-center justify-center gap-0.5 rounded hover:bg-zinc-700 transition-colors"
                    >
                        <span className="text-[10px] font-bold text-zinc-300">A</span>
                        <span className="w-4 h-1 rounded-full block" style={{ background: color }} />
                    </button>
                    {showColors && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-[#1C1C1E] border border-zinc-700 rounded-lg shadow-xl flex flex-wrap gap-1.5 w-[108px] z-10">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    onMouseDown={(e) => { e.preventDefault(); setColor(c); setShowColors(false); }}
                                    className="w-7 h-7 rounded border border-zinc-600 hover:scale-110 transition-transform"
                                    style={{ background: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-4 bg-zinc-700 mx-1" />

                <ToolBtn active={false} onMouseDown={doCommit} title="Confirm (Ctrl+Enter)">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                </ToolBtn>
                <ToolBtn active={false} onMouseDown={onCancel} title="Cancel (Escape)">
                    <X className="w-3.5 h-3.5 text-red-400" />
                </ToolBtn>
            </div>

            {/* Text input — transparent, renders directly on PDF surface */}
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleChange}
                rows={1}
                placeholder="Type here…"
                onMouseDown={(e) => e.stopPropagation()}
                className="placeholder:text-zinc-400/60"
                style={{
                    display: 'block',
                    background: 'transparent',
                    border: '1.5px dashed #3A76F0',
                    borderRadius: 2,
                    padding: '2px 4px',
                    outline: 'none',
                    resize: 'none',
                    overflow: 'hidden',
                    minWidth: boxWidth ?? 120,
                    width: boxWidth ? boxWidth : undefined,
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    fontWeight: bold ? 'bold' : 'normal',
                    fontStyle: italic ? 'italic' : 'normal',
                    fontSize: `${fontSize}px`,
                    color,
                    lineHeight: 1.4,
                    caretColor: color,
                }}
            />
        </div>
    );
}
