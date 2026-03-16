'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, ChevronDown, ChevronUp, X, FileText, Pencil } from 'lucide-react';
import type { AnnotationTool } from './AnnotationToolbar';
import type { AnnotationInfo } from '@/hooks/useMuPDF';
import { AppliedChangesPanel, type AppliedChange } from '@/components/tools/AppliedChangesPanel';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AnnotationProperties {
    r: number; g: number; b: number;         // 0-255, annotation/stroke color
    textR: number; textG: number; textB: number; // 0-255, text color (FreeText only)
    textBgTransparent: boolean;
    opacity: number;
    borderWidth: number;
    fontSize: number;
    fontName: string;
    text: string;
}

interface PropertyPanelProps {
    activeTool: AnnotationTool;
    properties: AnnotationProperties;
    onPropertiesChange: (updates: Partial<AnnotationProperties>) => void;
    onImageUpload?: () => void;
    pendingImageName?: string;
    onClearImage?: () => void;
    annotations?: AnnotationInfo[];
    selectedAnnotationIndex?: number | null;
    onSelectAnnotation?: (index: number | null) => void;
    onDeleteAnnotation?: (index: number) => void;
    onUpdateAnnotation?: (index: number, updates: { color?: number[]; opacity?: number; contents?: string }) => void;
    appliedChanges?: AppliedChange[];
    onResetChanges?: () => void;
    outputFilename?: string;
    onFilenameChange?: (name: string) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COLOR_PRESETS = [
    { r: 0,   g: 0,   b: 0   },   // black
    { r: 239, g: 68,  b: 68  },   // red
    { r: 34,  g: 197, b: 94  },   // green
    { r: 59,  g: 130, b: 246 },   // blue
    { r: 255, g: 255, b: 0   },   // yellow
    { r: 255, g: 165, b: 0   },   // orange
    { r: 168, g: 85,  b: 247 },   // purple
    { r: 255, g: 255, b: 255 },   // white
];

const FONT_OPTIONS = [
    { value: 'Helv', label: 'Helvetica' },
    { value: 'TiRo', label: 'Times Roman' },
    { value: 'Cour', label: 'Courier' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

function rgb01ToHex(color: number[]): string {
    if (!color || color.length < 3) return '#000000';
    const r = Math.round(color[0] * 255).toString(16).padStart(2, '0');
    const g = Math.round(color[1] * 255).toString(16).padStart(2, '0');
    const b = Math.round(color[2] * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">{children}</span>;
}

function Divider() {
    return <div className="h-px bg-zinc-800/60 -mx-4" />;
}

/* ------------------------------------------------------------------ */
/*  Color Picker — swatch triggers preset popover, hex input always   */
/* ------------------------------------------------------------------ */

interface ColorPickerProps {
    r: number; g: number; b: number;
    onChange: (r: number, g: number, b: number) => void;
    label?: string;
}

function ColorPicker({ r, g, b, onChange, label }: ColorPickerProps) {
    const [open, setOpen] = useState(false);
    const [hexInput, setHexInput] = useState(() => rgbToHex(r, g, b));

    useEffect(() => {
        setHexInput(rgbToHex(r, g, b));
    }, [r, g, b]);

    const handleHexBlur = () => {
        const hex = hexInput.startsWith('#') ? hexInput : '#' + hexInput;
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
            const parsed = hexToRgb(hex);
            onChange(parsed.r, parsed.g, parsed.b);
        } else {
            setHexInput(rgbToHex(r, g, b));
        }
    };

    const handleHexKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleHexBlur();
    };

    return (
        <div className="space-y-1.5">
            {label && <SectionLabel>{label}</SectionLabel>}

            {/* Swatch + hex input row */}
            <div className="flex items-center gap-2 mt-1">
                <button
                    onClick={() => setOpen(v => !v)}
                    className="w-7 h-7 rounded border-2 border-zinc-700 hover:border-zinc-500 transition-colors shrink-0 shadow-sm"
                    style={{ backgroundColor: rgbToHex(r, g, b) }}
                    title="Pick color"
                />
                <input
                    type="text"
                    value={hexInput}
                    onChange={e => setHexInput(e.target.value)}
                    onBlur={handleHexBlur}
                    onKeyDown={handleHexKeyDown}
                    className="flex-1 px-2 py-1 bg-zinc-800/60 border border-zinc-700/60 rounded text-[11px] text-zinc-100 font-mono focus:outline-none focus:border-[#3A76F0] transition-colors"
                    placeholder="#000000"
                />
            </div>

            {/* Preset swatches — only visible when open */}
            {open && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {COLOR_PRESETS.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => { onChange(p.r, p.g, p.b); setOpen(false); }}
                            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                                r === p.r && g === p.g && b === p.b
                                    ? 'border-[#3A76F0] scale-110'
                                    : 'border-zinc-700 hover:border-zinc-500'
                            }`}
                            style={{ backgroundColor: rgbToHex(p.r, p.g, p.b) }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PropertyPanel({
    activeTool,
    properties,
    onPropertiesChange,
    onImageUpload,
    pendingImageName,
    onClearImage,
    annotations = [],
    selectedAnnotationIndex,
    onSelectAnnotation,
    onDeleteAnnotation,
    onUpdateAnnotation,
    appliedChanges,
    onResetChanges,
    outputFilename,
    onFilenameChange,
    collapsed = false,
    onToggleCollapse,
}: PropertyPanelProps) {
    const inputClass = "w-full px-2.5 py-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded text-xs text-zinc-100 focus:outline-none focus:border-[#3A76F0] transition-colors";

    // freetext color/bg handled separately — don't show duplicate annotation color
    const showColor = ['highlight', 'underline', 'strikethrough', 'rectangle', 'circle',
        'line', 'arrow', 'freehand', 'sticky-note', 'redact'].includes(activeTool);
    const showOpacity = ['highlight', 'underline', 'strikethrough', 'freehand', 'image-stamp'].includes(activeTool);
    const showBorderWidth = ['rectangle', 'circle', 'line', 'arrow', 'freehand'].includes(activeTool);
    const showFontSettings = activeTool === 'freetext';
    const showImageUpload = activeTool === 'image-stamp';
    const showTextInput = activeTool === 'freetext' || activeTool === 'sticky-note';
    const showFreeTextColor = activeTool === 'freetext';

    const selectedAnnot = selectedAnnotationIndex != null ? annotations[selectedAnnotationIndex] : null;

    // Live editing state for selected annotation
    const [editR, setEditR] = useState(0);
    const [editG, setEditG] = useState(0);
    const [editB, setEditB] = useState(0);
    const [editOpacity, setEditOpacity] = useState(1);
    const [editContents, setEditContents] = useState('');
    const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const contentsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync edit state when selection changes
    useEffect(() => {
        if (selectedAnnot) {
            const hex = rgb01ToHex(selectedAnnot.color);
            const { r, g, b } = hexToRgb(hex);
            setEditR(r);
            setEditG(g);
            setEditB(b);
            setEditOpacity(selectedAnnot.opacity);
            setEditContents(selectedAnnot.contents || '');
        } else {
            setEditContents('');
        }
    }, [selectedAnnotationIndex]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced color/opacity live update
    useEffect(() => {
        if (selectedAnnotationIndex == null) return;
        if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
        colorDebounceRef.current = setTimeout(() => {
            onUpdateAnnotation?.(selectedAnnotationIndex, {
                color: [editR / 255, editG / 255, editB / 255],
                opacity: editOpacity,
            });
        }, 150);
        return () => { if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current); };
    }, [editR, editG, editB, editOpacity]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced contents update (prevents re-render mid-type)
    const handleContentsChange = useCallback((v: string) => {
        setEditContents(v);
        if (contentsDebounceRef.current) clearTimeout(contentsDebounceRef.current);
        contentsDebounceRef.current = setTimeout(() => {
            if (selectedAnnotationIndex != null) {
                onUpdateAnnotation?.(selectedAnnotationIndex, { contents: v });
            }
        }, 400);
    }, [selectedAnnotationIndex, onUpdateAnnotation]);

    /* ---- Tool hint ---- */
    const toolHint: Record<AnnotationTool, string> = {
        select: 'Click an annotation to select it. Press Delete to remove.',
        highlight: 'Drag to highlight a region.',
        underline: 'Drag to underline text.',
        strikethrough: 'Drag to strike through text.',
        rectangle: 'Click and drag to draw a rectangle.',
        circle: 'Click and drag to draw an ellipse.',
        line: 'Click and drag to draw a line.',
        arrow: 'Click and drag to draw an arrow.',
        freehand: 'Click and drag to draw freehand.',
        freetext: 'Type below, then click on the page to place.',
        'sticky-note': 'Type below, then click on the page to place.',
        stamp: 'Pick a stamp type, then click on the page to place.',
        'image-stamp': 'Upload an image, then click on the page to stamp it.',
        redact: 'Drag to mark areas for redaction. Applied automatically on Save.',
        eraser: 'Click any annotation to delete it.',
    };

    /* ---- Output name section (top) ---- */
    const outputNameSection = outputFilename != null && onFilenameChange && (
        <div className="px-4 py-3 border-b border-zinc-800/60 shrink-0">
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Output Name</span>
            <div className="flex items-center gap-1.5 mt-1.5">
                <Pencil className="w-3 h-3 text-zinc-600 shrink-0" />
                <input
                    type="text"
                    value={outputFilename}
                    onChange={(e) => onFilenameChange(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-zinc-300 border-b border-zinc-700 focus:border-[#3A76F0] outline-none py-0.5 transition-colors min-w-0"
                />
            </div>
        </div>
    );

    /* ---- Applied changes section (bottom) ---- */
    const appliedSection = appliedChanges !== undefined && (
        <div className="px-4 py-3 border-t border-zinc-800/60 shrink-0">
            <AppliedChangesPanel changes={appliedChanges} onReset={onResetChanges} />
        </div>
    );

    /* ---- Scrollable tool options ---- */
    const toolOptions = (
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">

                {/* Hint */}
                <p className="text-[11px] text-zinc-500 leading-relaxed">{toolHint[activeTool]}</p>

                {/* Text input */}
                {showTextInput && (
                    <div className="space-y-1.5">
                        <SectionLabel>{activeTool === 'freetext' ? 'Text Content' : 'Note Text'}</SectionLabel>
                        <textarea
                            className={`${inputClass} resize-none mt-1`}
                            rows={3}
                            placeholder="Type here, then click on the page..."
                            value={properties.text}
                            onChange={(e) => onPropertiesChange({ text: e.target.value })}
                        />
                    </div>
                )}

                {/* Image upload */}
                {showImageUpload && (
                    <div className="space-y-1.5">
                        <SectionLabel>Stamp Image</SectionLabel>
                        {pendingImageName ? (
                            <div className="flex items-center gap-2 mt-1">
                                <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                <span className="text-xs text-zinc-300 flex-1 truncate">{pendingImageName}</span>
                                <button onClick={onClearImage} className="p-0.5 text-zinc-500 hover:text-red-400 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onImageUpload}
                                className="mt-1 flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Upload PNG or JPEG
                            </button>
                        )}
                    </div>
                )}

                {/* Annotation color — not shown for freetext (handled by text color block) */}
                {showColor && (
                    <ColorPicker
                        r={properties.r} g={properties.g} b={properties.b}
                        onChange={(r, g, b) => onPropertiesChange({ r, g, b })}
                        label="Color"
                    />
                )}

                {/* FreeText: text color + optional background color */}
                {showFreeTextColor && (
                    <>
                        <ColorPicker
                            r={properties.textR} g={properties.textG} b={properties.textB}
                            onChange={(r, g, b) => onPropertiesChange({ textR: r, textG: g, textB: b })}
                            label="Text Color"
                        />
                        <div className="space-y-1.5">
                            <SectionLabel>Background</SectionLabel>
                            <label className="flex items-center gap-2 mt-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={properties.textBgTransparent}
                                    onChange={e => onPropertiesChange({ textBgTransparent: e.target.checked })}
                                    className="accent-[#3A76F0] rounded"
                                />
                                <span className="text-xs text-zinc-300">Transparent</span>
                            </label>
                            {!properties.textBgTransparent && (
                                <ColorPicker
                                    r={properties.r} g={properties.g} b={properties.b}
                                    onChange={(r, g, b) => onPropertiesChange({ r, g, b })}
                                    label="Background Color"
                                />
                            )}
                        </div>
                    </>
                )}

                {/* Opacity */}
                {showOpacity && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <SectionLabel>Opacity</SectionLabel>
                            <span className="text-[11px] text-[#3A76F0]">{Math.round(properties.opacity * 100)}%</span>
                        </div>
                        <input
                            type="range" min="10" max="100"
                            value={properties.opacity * 100}
                            onChange={(e) => onPropertiesChange({ opacity: Number(e.target.value) / 100 })}
                            className="w-full accent-[#3A76F0] mt-0.5"
                        />
                    </div>
                )}

                {/* Border width */}
                {showBorderWidth && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <SectionLabel>Stroke Width</SectionLabel>
                            <span className="text-[11px] text-[#3A76F0]">{properties.borderWidth}px</span>
                        </div>
                        <input
                            type="range" min="1" max="10"
                            value={properties.borderWidth}
                            onChange={(e) => onPropertiesChange({ borderWidth: Number(e.target.value) })}
                            className="w-full accent-[#3A76F0] mt-0.5"
                        />
                    </div>
                )}

                {/* Font settings */}
                {showFontSettings && (
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <SectionLabel>Font</SectionLabel>
                            <select
                                className={`${inputClass} mt-1`}
                                value={properties.fontName}
                                onChange={(e) => onPropertiesChange({ fontName: e.target.value })}
                            >
                                {FONT_OPTIONS.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <SectionLabel>Font Size</SectionLabel>
                                <span className="text-[11px] text-[#3A76F0]">{properties.fontSize}pt</span>
                            </div>
                            <input
                                type="range" min="8" max="72"
                                value={properties.fontSize}
                                onChange={(e) => onPropertiesChange({ fontSize: Number(e.target.value) })}
                                className="w-full accent-[#3A76F0] mt-0.5"
                            />
                        </div>
                    </div>
                )}

                {/* Selected annotation live editing */}
                {selectedAnnot && (
                    <>
                        <Divider />
                        <div className="space-y-3">
                            <SectionLabel>Edit Selected: {selectedAnnot.type}</SectionLabel>

                            <ColorPicker
                                r={editR} g={editG} b={editB}
                                onChange={(r, g, b) => { setEditR(r); setEditG(g); setEditB(b); }}
                                label="Color"
                            />

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <SectionLabel>Opacity</SectionLabel>
                                    <span className="text-[11px] text-[#3A76F0]">{Math.round(editOpacity * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="10" max="100"
                                    value={editOpacity * 100}
                                    onChange={(e) => setEditOpacity(Number(e.target.value) / 100)}
                                    className="w-full accent-[#3A76F0]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <SectionLabel>Contents</SectionLabel>
                                <textarea
                                    className={`${inputClass} resize-none mt-1`}
                                    rows={2}
                                    value={editContents}
                                    onChange={(e) => handleContentsChange(e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const panelContent = (
        <>
            {outputNameSection}
            {toolOptions}
            {appliedSection}
        </>
    );

    return (
        <>
            {/* Desktop: right sidebar */}
            <aside className="hidden md:flex w-64 border-l border-zinc-800/60 bg-[#111112] shrink-0 flex-col overflow-hidden">
                {panelContent}
            </aside>

            {/* Mobile: fixed bottom sheet */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#111112] border-t border-zinc-800 shadow-2xl">
                <button
                    onClick={onToggleCollapse}
                    className="w-full flex items-center justify-center gap-2 py-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <span className="text-[10px] uppercase tracking-widest font-bold">Properties</span>
                    {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {!collapsed && (
                    <div className="max-h-[45vh] overflow-y-auto flex flex-col">
                        {panelContent}
                    </div>
                )}
            </div>
        </>
    );
}
