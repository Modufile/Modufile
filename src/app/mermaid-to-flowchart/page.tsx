'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlignCenterHorizontal,
    AlignCenterVertical,
    AlignEndHorizontal,
    AlignStartHorizontal,
    Copy,
    FileJson2,
    History,
    LayoutGrid,
    MoveHorizontal,
    MoveVertical,
    Redo2,
    RotateCcw,
    Trash2,
    Undo2,
    Upload,
    Link2,
    Save,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FlowchartCanvas, MermaidCodeEditor, MermaidStage } from '@/components/mermaid-flowchart';
import {
    FLOWCHART_TEMPLATES,
    FLOWCHART_THEME_PRESETS,
    MERMAID_SAMPLE_DIAGRAMS,
    applyThemePreset,
    autoLayoutDocument,
    cloneDocument,
    createNode,
    documentToThemePreset,
    extractMermaidCode,
    formatMermaidCode,
    parseMermaidCode,
    renderFlowchartDocumentSvg,
    renderMermaidSvg,
    resolveThemePreset,
    serializeDocument,
    svgToPdfBlob,
    svgToPngBlob,
    validateMermaidCode,
} from '@/lib/mermaid-flowchart';
import { useMermaidFlowchartStore } from '@/stores/mermaidFlowchartStore';
import { toolContent } from '@/data/tool-faqs';
import type { MermaidFlowNode, MermaidNodeStyle } from '@/types/mermaid-flowchart';

const PALETTE_SECTIONS: Array<{ id: string; label: string; items: MermaidFlowNode['type'][] }> = [
    { id: 'basics', label: 'Basics', items: ['startEnd', 'process', 'decision', 'inputOutput', 'subroutine', 'database'] },
    { id: 'control', label: 'Control', items: ['circle', 'rounded', 'hexagon', 'trapezoid', 'delay', 'custom'] },
    { id: 'docs', label: 'Docs', items: ['document', 'multiDocument'] },
    { id: 'mindmap', label: 'Mind', items: ['cloud', 'bang'] },
];

export default function MermaidToFlowchartPage() {
    const {
        present,
        selection,
        viewport,
        connectFrom,
        exportScale,
        outputFilename,
        codeDraft,
        validationError,
        history,
        past,
        future,
        setDocument,
        setSelection,
        setViewport,
        setConnectFrom,
        setExportScale,
        setOutputFilename,
        setCodeDraft,
        setValidationError,
        saveHistoryEntry,
        loadHistoryEntry,
        undo,
        redo,
        reset,
    } = useMermaidFlowchartStore();

    const suppressNextCodeSyncRef = useRef(false);
    const importInputRef = useRef<HTMLInputElement>(null);
    const [stageMode, setStageMode] = useState<'flowchart' | 'mermaid'>('flowchart');
    const [stageSvg, setStageSvg] = useState<string | null>(null);
    const [stageLoading, setStageLoading] = useState(false);
    const [stageNotice, setStageNotice] = useState<string | null>(null);
    const selectedNodes = useMemo(() => present.nodes.filter((node) => selection.includes(node.id)), [present.nodes, selection]);
    const selectedNode = selectedNodes[0] ?? null;
    const currentTheme = resolveThemePreset(present.activeThemePresetId);
    const exportSvgMarkup = useMemo(
        () => renderFlowchartDocumentSvg(present, { background: currentTheme.canvasBackground, includeGrid: true }),
        [currentTheme.canvasBackground, present]
    );

    const applyDocument = useCallback((document: typeof present, options?: { codeDraft?: string; preserveHistory?: boolean }) => {
        suppressNextCodeSyncRef.current = true;
        setDocument(document, options);
    }, [setDocument]);

    const deleteSelection = useCallback(() => {
        const selected = new Set(selection);
        const next = cloneDocument(present);
        next.nodes = next.nodes.filter((node) => !selected.has(node.id));
        next.edges = next.edges.filter((edge) => !selected.has(edge.source) && !selected.has(edge.target));
        applyDocument(next);
        setSelection([]);
        setConnectFrom(null);
    }, [applyDocument, present, selection, setConnectFrom, setSelection]);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
                return;
            }
            if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) {
                event.preventDefault();
                redo();
                return;
            }
            if ((event.key === 'Delete' || event.key === 'Backspace') && selection.length > 0) {
                const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
                if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
                event.preventDefault();
                deleteSelection();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [deleteSelection, redo, selection.length, undo]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const hash = window.location.hash.slice(1);
        if (!hash.startsWith('code=')) return;
        try {
            const encoded = hash.slice(5);
            const decoded = decodeMermaidHash(encoded);
            setCodeDraft(decoded);
        } catch (error) {
            console.error('Failed to load Mermaid code from URL hash', error);
        }
    }, [setCodeDraft]);

    useEffect(() => {
        if (suppressNextCodeSyncRef.current) {
            suppressNextCodeSyncRef.current = false;
            return;
        }
        const timer = window.setTimeout(async () => {
            setValidationError(null);
            const extractedCode = extractMermaidCode(codeDraft);
            const mermaidError = await validateMermaidCode(extractedCode);
            if (mermaidError) {
                setValidationError(mermaidError);
                setStageNotice(null);
                return;
            }
            try {
                const parsed = parseMermaidCode(codeDraft);
                setStageMode('flowchart');
                setStageNotice(null);
                applyDocument(parsed.document, {
                    codeDraft,
                    preserveHistory: false,
                });
            } catch {
                setStageMode('mermaid');
                setStageNotice('This Mermaid sample stays editable from code. Visual drag-and-drop editing is active for flowcharts using Modufile layout metadata.');
            }
        }, 280);
        return () => window.clearTimeout(timer);
    }, [applyDocument, codeDraft, setValidationError]);

    useEffect(() => {
        if (stageMode !== 'mermaid' || validationError) {
            setStageSvg(null);
            setStageLoading(false);
            return;
        }

        let cancelled = false;
        setStageLoading(true);

        const timer = window.setTimeout(async () => {
            try {
                const svg = await renderMermaidSvg(extractMermaidCode(codeDraft));
                if (cancelled) return;
                setStageSvg(svg);
            } catch (error) {
                if (cancelled) return;
                setValidationError(error instanceof Error ? error.message : 'Unable to render Mermaid diagram.');
                setStageSvg(null);
            } finally {
                if (!cancelled) setStageLoading(false);
            }
        }, 120);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [codeDraft, stageMode, setValidationError, validationError]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            saveHistoryEntry();
        }, 60_000);
        return () => window.clearInterval(timer);
    }, [saveHistoryEntry]);

    const commitSelectionNodeStyle = (patch: Partial<MermaidNodeStyle>) => {
        if (selection.length === 0) return;
        const next = cloneDocument(present);
        next.nodes = next.nodes.map((node) => selection.includes(node.id) ? { ...node, style: { ...node.style, ...patch } } : node);
        applyDocument(next);
    };

    const commitConnectedEdgeStyle = (patch: Partial<typeof present.edges[number]['style']>) => {
        if (selection.length === 0) return;
        const selected = new Set(selection);
        const next = cloneDocument(present);
        next.edges = next.edges.map((edge) =>
            selected.has(edge.source) || selected.has(edge.target)
                ? { ...edge, style: { ...edge.style, ...patch } }
                : edge
        );
        applyDocument(next);
    };

    const addNode = (type: MermaidFlowNode['type']) => {
        const next = cloneDocument(present);
        const id = generateNodeId(next.nodes.map((node) => node.id));
        next.nodes.push(createNode({
            id,
            type,
            label: `${typeLabel(type)} ${next.nodes.length + 1}`,
            x: 480 + next.nodes.length * 12,
            y: 180 + next.nodes.length * 12,
        }));
        applyDocument(next);
        setSelection([id]);
    };

    const duplicateSelection = () => {
        if (selectedNodes.length === 0) return;
        const next = cloneDocument(present);
        const idMap = new Map<string, string>();
        selectedNodes.forEach((node) => {
            const id = generateNodeId(next.nodes.map((item) => item.id).concat(Array.from(idMap.values())));
            idMap.set(node.id, id);
            next.nodes.push({
                ...cloneDocument({ ...present, nodes: [node], edges: [] }).nodes[0],
                id,
                x: node.x + 48,
                y: node.y + 48,
            });
        });
        next.edges = next.edges.concat(
            present.edges
                .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
                .map((edge) => ({
                    ...edge,
                    id: `${edge.id}-copy-${Math.random().toString(36).slice(2, 6)}`,
                    source: idMap.get(edge.source)!,
                    target: idMap.get(edge.target)!,
                }))
        );
        applyDocument(next);
        setSelection(Array.from(idMap.values()));
    };

    const alignSelection = (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
        if (selectedNodes.length < 2) return;
        const bounds = selectionBounds(selectedNodes);
        const next = cloneDocument(present);
        next.nodes = next.nodes.map((node) => {
            if (!selection.includes(node.id)) return node;
            if (mode === 'left') return { ...node, x: bounds.minX };
            if (mode === 'center') return { ...node, x: bounds.minX + (bounds.maxX - bounds.minX) / 2 - node.width / 2 };
            if (mode === 'right') return { ...node, x: bounds.maxX - node.width };
            if (mode === 'top') return { ...node, y: bounds.minY };
            if (mode === 'middle') return { ...node, y: bounds.minY + (bounds.maxY - bounds.minY) / 2 - node.height / 2 };
            return { ...node, y: bounds.maxY - node.height };
        });
        applyDocument(next);
    };

    const distributeSelection = (axis: 'horizontal' | 'vertical') => {
        if (selectedNodes.length < 3) return;
        const sorted = [...selectedNodes].sort((a, b) => axis === 'horizontal' ? a.x - b.x : a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const span = axis === 'horizontal' ? last.x - first.x : last.y - first.y;
        const gap = span / (sorted.length - 1);
        const next = cloneDocument(present);
        sorted.forEach((node, index) => {
            const target = next.nodes.find((item) => item.id === node.id);
            if (!target) return;
            if (axis === 'horizontal') target.x = first.x + gap * index;
            else target.y = first.y + gap * index;
        });
        applyDocument(next);
    };

    const handleTemplateApply = (templateId: string) => {
        const template = FLOWCHART_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;
        reset(template.document);
    };

    const handleImport = async (file: File) => {
        const text = await file.text();
        const mermaidError = await validateMermaidCode(extractMermaidCode(text));
        if (mermaidError) {
            setValidationError(mermaidError);
            return;
        }
        try {
            const parsed = parseMermaidCode(text);
            applyDocument(parsed.document, { codeDraft: serializeDocument(parsed.document) });
        } catch {
            setCodeDraft(text);
        }
        setOutputFilename(file.name.replace(/\.(md|mmd)$/i, '') + '.mmd');
    };

    const handleSave = useCallback(async () => {
        const filename = ensureExtension(outputFilename || 'mermaid-flowchart', '.mmd');
        const blob = new Blob([codeDraft], { type: 'text/plain;charset=utf-8' });
        return { blob, filename };
    }, [codeDraft, outputFilename]);

    const handleExportAs = useCallback(async (format: string) => {
        const svg = stageMode === 'flowchart' ? exportSvgMarkup : stageSvg;
        if (!svg) return;
        const exportBackground = stageMode === 'flowchart' ? currentTheme.canvasBackground : '#ffffff';
        const baseName = outputFilename.replace(/\.(mmd|md|svg|png|pdf)$/i, '') || 'mermaid-flowchart';
        if (format === 'svg') {
            downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${baseName}.svg`);
            return;
        }
        if (format === 'png') {
            const blob = await svgToPngBlob(svg, exportScale, exportBackground);
            downloadBlob(blob, `${baseName}.png`);
            return;
        }
        if (format === 'pdf') {
            const blob = await svgToPdfBlob(svg, exportScale, exportBackground);
            downloadBlob(blob, `${baseName}.pdf`);
        }
    }, [currentTheme.canvasBackground, exportScale, exportSvgMarkup, outputFilename, stageMode, stageSvg]);

    const exportThemePreset = () => {
        const preset = documentToThemePreset(present);
        const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${ensureExtension(outputFilename.replace(/\.(mmd|md)$/i, ''), '')}-theme.json`);
    };

    const copyShareLink = useCallback(async () => {
        const encoded = encodeMermaidHash(codeDraft);
        const url = `${window.location.origin}${window.location.pathname}#code=${encoded}`;
        await navigator.clipboard.writeText(url);
    }, [codeDraft]);

    const loadSampleDiagram = (sampleCode: string, sampleName: string) => {
        setCodeDraft(sampleCode);
        setOutputFilename(`${slugify(sampleName) || 'mermaid-sample'}.mmd`);
    };

    const leftSidebarActions = (
        <CreationRail
            onAddNode={addNode}
            onTemplateApply={handleTemplateApply}
            onSampleLoad={loadSampleDiagram}
        />
    );

    const sidebar = (
        <div className="space-y-6 pb-8">
            <section className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">File</span>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => importInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"
                    >
                        <Upload className="h-3.5 w-3.5" />
                        Import
                    </button>
                    <button
                        type="button"
                        onClick={exportThemePreset}
                        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"
                    >
                        <FileJson2 className="h-3.5 w-3.5" />
                        Theme
                    </button>
                    <button
                        type="button"
                        onClick={() => void copyShareLink()}
                        className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"
                    >
                        <Link2 className="h-3.5 w-3.5" />
                        Copy Share Link
                    </button>
                </div>
                <input
                    ref={importInputRef}
                    type="file"
                    accept=".mmd,.md,text/plain"
                    className="hidden"
                    onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) await handleImport(file);
                        event.currentTarget.value = '';
                    }}
                />
            </section>

            {stageMode === 'flowchart' && (
                <section className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Direction</span>
                    <div className="grid grid-cols-4 gap-2">
                        {(['TB', 'BT', 'LR', 'RL'] as const).map((direction) => (
                            <button
                                key={direction}
                                type="button"
                                onClick={() => applyDocument({ ...present, direction })}
                                className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${present.direction === direction ? 'border-[#3A76F0] bg-[#3A76F0]/15 text-white' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}
                            >
                                {direction}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {stageMode === 'flowchart' && (
                <>
                    <section className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Theme</span>
                        <div className="space-y-2">
                            {FLOWCHART_THEME_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => applyDocument(applyThemePreset(present, preset, selection.length > 0 ? selection : undefined))}
                                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${present.activeThemePresetId === preset.id ? 'border-[#3A76F0] bg-[#3A76F0]/10' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'}`}
                                >
                                    <div className="flex gap-1">
                                        <span className="h-4 w-4 rounded-full border" style={{ background: preset.node.fill, borderColor: preset.node.stroke }} />
                                        <span className="h-4 w-4 rounded-full border" style={{ background: preset.edge.stroke, borderColor: preset.edge.stroke }} />
                                    </div>
                                    <span className="text-sm text-zinc-200">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Selection</span>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={duplicateSelection} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white">
                                <Copy className="mx-auto h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={deleteSelection} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-rose-700 hover:text-rose-200">
                                <Trash2 className="mx-auto h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => alignSelection('left')} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"><AlignStartHorizontal className="mx-auto h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => alignSelection('center')} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"><AlignCenterHorizontal className="mx-auto h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => alignSelection('right')} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"><AlignEndHorizontal className="mx-auto h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => alignSelection('middle')} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"><AlignCenterVertical className="mx-auto h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => distributeSelection('horizontal')} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"><MoveHorizontal className="mx-auto h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => distributeSelection('vertical')} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"><MoveVertical className="mx-auto h-3.5 w-3.5" /></button>
                        </div>
                        <p className="text-xs text-zinc-500">{selection.length} node{selection.length === 1 ? '' : 's'} selected.</p>
                    </section>

                    <section className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Styling</span>
                        <StyleField label="Fill" value={selectedNode?.style.fill ?? currentTheme.node.fill} onChange={(value) => commitSelectionNodeStyle({ fill: value })} />
                        <StyleField label="Stroke" value={selectedNode?.style.stroke ?? currentTheme.node.stroke} onChange={(value) => commitSelectionNodeStyle({ stroke: value })} />
                        <StyleField label="Text" value={selectedNode?.style.textColor ?? currentTheme.node.textColor} onChange={(value) => commitSelectionNodeStyle({ textColor: value })} />
                        <StyleField label="Edge" value={present.edges.find((edge) => selection.includes(edge.source) || selection.includes(edge.target))?.style.stroke ?? currentTheme.edge.stroke} onChange={(value) => commitConnectedEdgeStyle({ stroke: value })} />
                        <div className="grid grid-cols-2 gap-2">
                            <label className="flex flex-col gap-1 text-xs text-zinc-500">
                                Font size
                                <input
                                    type="number"
                                    min={10}
                                    max={28}
                                    value={selectedNode?.style.fontSize ?? currentTheme.node.fontSize}
                                    onChange={(event) => commitSelectionNodeStyle({ fontSize: Number(event.target.value) })}
                                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 outline-none focus:border-[#3A76F0]"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-zinc-500">
                                Edge width
                                <input
                                    type="number"
                                    min={1}
                                    max={8}
                                    value={present.edges.find((edge) => selection.includes(edge.source) || selection.includes(edge.target))?.style.width ?? currentTheme.edge.width}
                                    onChange={(event) => commitConnectedEdgeStyle({ width: Number(event.target.value) })}
                                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 outline-none focus:border-[#3A76F0]"
                                />
                            </label>
                        </div>
                        <label className="flex flex-col gap-1 text-xs text-zinc-500">
                            Font family
                            <select
                                value={selectedNode?.style.fontFamily ?? currentTheme.node.fontFamily}
                                onChange={(event) => commitSelectionNodeStyle({ fontFamily: event.target.value })}
                                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 outline-none focus:border-[#3A76F0]"
                            >
                                <option value="Inter, sans-serif">Inter</option>
                                <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                                <option value="Georgia, serif">Georgia</option>
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-zinc-500">
                            Edge style
                            <select
                                value={present.edges.find((edge) => selection.includes(edge.source) || selection.includes(edge.target))?.style.lineStyle ?? currentTheme.edge.lineStyle}
                                onChange={(event) => commitConnectedEdgeStyle({ lineStyle: event.target.value as typeof currentTheme.edge.lineStyle })}
                                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 outline-none focus:border-[#3A76F0]"
                            >
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="thick">Thick</option>
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-zinc-500">
                            Arrow style
                            <select
                                value={present.edges.find((edge) => selection.includes(edge.source) || selection.includes(edge.target))?.style.arrow ?? currentTheme.edge.arrow}
                                onChange={(event) => commitConnectedEdgeStyle({ arrow: event.target.value as typeof currentTheme.edge.arrow })}
                                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200 outline-none focus:border-[#3A76F0]"
                            >
                                <option value="arrow">Arrow</option>
                                <option value="none">Line only</option>
                            </select>
                        </label>
                    </section>
                </>
            )}

            <section className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">History</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => saveHistoryEntry()}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"
                    >
                        <Save className="h-3.5 w-3.5" />
                        Save Snapshot
                    </button>
                </div>
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                    {history.length === 0 ? (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-xs text-zinc-500">Snapshots are kept locally in this browser.</div>
                    ) : history.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            onClick={() => loadHistoryEntry(entry.id)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-left transition hover:border-zinc-600"
                        >
                            <div className="flex items-center gap-2 text-xs text-zinc-300">
                                <History className="h-3.5 w-3.5 text-zinc-500" />
                                <span className="truncate">{entry.title}</span>
                            </div>
                            <div className="mt-1 text-[11px] text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</div>
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Export</span>
                <label className="flex flex-col gap-1 text-xs text-zinc-500">
                    PNG / PDF scale
                    <input
                        type="range"
                        min={1}
                        max={4}
                        step={1}
                        value={exportScale}
                        onChange={(event) => setExportScale(Number(event.target.value))}
                    />
                </label>
                <p className="text-xs text-zinc-500">{exportScale}x raster export scale for PNG and PDF.</p>
            </section>
        </div>
    );

    return (
        <ToolPageLayout
            title="Mermaid to Flowchart"
            description="Build and edit Mermaid flowcharts visually, then export clean code and high-res diagrams."
            parentCategory="Diagram Tools"
            parentHref="/"
            about={toolContent['mermaid-to-flowchart'].about}
            techSetup={toolContent['mermaid-to-flowchart'].techSetup}
            faqs={toolContent['mermaid-to-flowchart'].faqs}
            onSave={handleSave}
            saveLabel="Save .mmd"
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            onExportAs={handleExportAs}
            exportFormats={[
                { label: 'Export PNG', value: 'png' },
                { label: 'Export SVG', value: 'svg' },
                { label: 'Export PDF', value: 'pdf' },
            ]}
            leftSidebarActions={leftSidebarActions}
            leftSidebarClassName="w-[124px] px-2"
            sidebar={sidebar}
            workspaceClassName="max-w-none"
            centerControls={
                <div className="flex items-center gap-1 rounded-lg border border-zinc-800/70 bg-[#1A1B1F] p-1">
                    <button type="button" onClick={() => setViewport({ zoom: Math.max(0.35, viewport.zoom - 0.1) })} disabled={stageMode !== 'flowchart'} className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-30"><ZoomOut className="h-3.5 w-3.5" /></button>
                    <span className="min-w-[74px] text-center text-[11px] font-medium text-zinc-300">{stageMode === 'flowchart' ? `${Math.round(viewport.zoom * 100)}%` : 'Sample Mode'}</span>
                    <button type="button" onClick={() => setViewport({ zoom: Math.min(2.75, viewport.zoom + 0.1) })} disabled={stageMode !== 'flowchart'} className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-30"><ZoomIn className="h-3.5 w-3.5" /></button>
                    <span className="mx-1 h-5 w-px bg-zinc-800" />
                    <button type="button" onClick={undo} disabled={past.length === 0} className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-30"><Undo2 className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={redo} disabled={future.length === 0} className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-30"><Redo2 className="h-3.5 w-3.5" /></button>
                    <span className="mx-1 h-5 w-px bg-zinc-800" />
                    <button type="button" onClick={() => applyDocument(autoLayoutDocument(present))} disabled={stageMode !== 'flowchart'} className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-30"><LayoutGrid className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => reset(FLOWCHART_TEMPLATES[1].document)} className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /></button>
                </div>
            }
        >
            <div className="flex h-[calc(100vh-112px)] min-h-0 flex-col gap-6 overflow-hidden">
                <div className="grid h-full min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1.8fr)_420px]">
                    {stageMode === 'flowchart' ? (
                        <FlowchartCanvas
                            document={present}
                            selection={selection}
                            viewport={viewport}
                            connectFrom={connectFrom}
                            onDocumentChange={applyDocument}
                            onSelectionChange={setSelection}
                            onViewportChange={setViewport}
                            onConnectFromChange={setConnectFrom}
                        />
                    ) : (
                        <MermaidStage
                            svgMarkup={stageSvg}
                            loading={stageLoading}
                            error={validationError}
                            notice={stageNotice}
                        />
                    )}

                    <div className="h-full min-h-0">
                        <MermaidCodeEditor
                            code={codeDraft}
                            validationError={validationError}
                            onChange={setCodeDraft}
                            onFormat={() => {
                                try {
                                    setCodeDraft(stageMode === 'flowchart' ? formatMermaidCode(codeDraft) : extractMermaidCode(codeDraft));
                                    setValidationError(null);
                                } catch (error) {
                                    setValidationError(error instanceof Error ? error.message : 'Unable to format Mermaid code.');
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </ToolPageLayout>
    );
}

function StyleField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-3 text-xs text-zinc-500">
            <span>{label}</span>
            <div className="flex items-center gap-2">
                <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-10 rounded border border-zinc-800 bg-zinc-900 p-1" />
                <input
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-24 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#3A76F0]"
                />
            </div>
        </label>
    );
}

function generateNodeId(existingIds: string[]) {
    const set = new Set(existingIds);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let index = 0;
    while (true) {
        const id = `${alphabet[index % alphabet.length]}${index >= alphabet.length ? Math.floor(index / alphabet.length) : ''}`;
        if (!set.has(id)) return id;
        index += 1;
    }
}

function typeLabel(type: MermaidFlowNode['type']) {
    switch (type) {
        case 'startEnd': return 'Start';
        case 'circle': return 'Event';
        case 'decision': return 'Decision';
        case 'inputOutput': return 'Input';
        case 'subroutine': return 'Subroutine';
        case 'database': return 'Database';
        case 'hexagon': return 'Prepare';
        case 'rounded': return 'Topic';
        case 'document': return 'Document';
        case 'multiDocument': return 'Documents';
        case 'trapezoid': return 'Manual';
        case 'delay': return 'Delay';
        case 'cloud': return 'Cloud';
        case 'bang': return 'Bang';
        case 'custom': return 'Custom';
        case 'process':
        default:
            return 'Process';
    }
}

function selectionBounds(nodes: MermaidFlowNode[]) {
    return nodes.reduce((acc, node) => ({
        minX: Math.min(acc.minX, node.x),
        minY: Math.min(acc.minY, node.y),
        maxX: Math.max(acc.maxX, node.x + node.width),
        maxY: Math.max(acc.maxY, node.y + node.height),
    }), {
        minX: nodes[0]?.x ?? 0,
        minY: nodes[0]?.y ?? 0,
        maxX: (nodes[0]?.x ?? 0) + (nodes[0]?.width ?? 0),
        maxY: (nodes[0]?.y ?? 0) + (nodes[0]?.height ?? 0),
    });
}

function ensureExtension(filename: string, extension: string) {
    if (!extension) return filename;
    return filename.endsWith(extension) ? filename : `${filename}${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CreationRail({
    onAddNode,
    onTemplateApply,
    onSampleLoad,
}: {
    onAddNode: (type: MermaidFlowNode['type']) => void;
    onTemplateApply: (templateId: string) => void;
    onSampleLoad: (sampleCode: string, sampleName: string) => void;
}) {
    return (
        <div className="flex w-full flex-col gap-3 px-1">
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/60 p-2">
                <div className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-500">Shapes</div>
                <div className="space-y-2">
                    {PALETTE_SECTIONS.map((section) => (
                        <div key={section.id} className="space-y-1.5">
                            <div className="px-1 text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-600">{section.label}</div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {section.items.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        draggable
                                        onDragStart={(event) => event.dataTransfer.setData('application/modufile-node-type', type)}
                                        onClick={() => onAddNode(type)}
                                        className="group flex h-[66px] flex-col items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 px-1 text-zinc-400 transition hover:border-[#3A76F0] hover:text-white"
                                        title={`Add ${typeLabel(type)}`}
                                    >
                                        <ShapeSwatch type={type} />
                                        <span className="text-[9px] font-medium leading-none text-center">{shortTypeLabel(type)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-2">
                <div className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-500">Templates</div>
                <div className="space-y-1.5">
                    {FLOWCHART_TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => onTemplateApply(template.id)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/65 px-2 py-2 text-left transition hover:border-zinc-600 hover:text-white"
                            title={template.description}
                        >
                            <div className="text-[11px] font-medium text-zinc-200">{template.name}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-2">
                <div className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-500">Samples</div>
                <div className="space-y-1.5">
                    {MERMAID_SAMPLE_DIAGRAMS.map((sample) => (
                        <button
                            key={sample.id}
                            type="button"
                            onClick={() => onSampleLoad(sample.code, sample.name)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/65 px-2 py-2 text-left transition hover:border-zinc-600 hover:text-white"
                            title={sample.description}
                        >
                            <div className="text-[11px] font-medium text-zinc-200">{sample.name}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ShapeSwatch({ type }: { type: MermaidFlowNode['type'] }) {
    const fill = 'rgba(58,118,240,0.18)';
    const stroke = '#60A5FA';
    const strokeWidth = 1.8;
    return (
        <svg viewBox="0 0 36 24" className="h-5 w-8 overflow-visible">
            {type === 'startEnd' && <rect x="2" y="3" width="32" height="18" rx="9" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'process' && <rect x="2" y="3" width="32" height="18" rx="5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'rounded' && <rect x="2" y="3" width="32" height="18" rx="8" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'circle' && <circle cx="18" cy="12" r="9" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'decision' && <polygon points="18,1 35,12 18,23 1,12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'inputOutput' && <polygon points="6,3 34,3 30,21 2,21" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'subroutine' && (
                <>
                    <rect x="2" y="3" width="32" height="18" rx="5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <line x1="7" y1="5" x2="7" y2="19" stroke={stroke} strokeWidth={strokeWidth} />
                    <line x1="29" y1="5" x2="29" y2="19" stroke={stroke} strokeWidth={strokeWidth} />
                </>
            )}
            {type === 'database' && (
                <>
                    <path d="M2 7c0-3 32-3 32 0v10c0 3-32 3-32 0z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <ellipse cx="18" cy="7" rx="16" ry="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <ellipse cx="18" cy="17" rx="16" ry="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                </>
            )}
            {type === 'hexagon' && <polygon points="8,2 28,2 35,12 28,22 8,22 1,12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'document' && <path d="M2 3h32v12c-6 5-9-3-15 2-5 4-9 2-17-1z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'multiDocument' && (
                <>
                    <path d="M6 5h28v11c-5 4-8-2-13 2-4 3-8 1-15-1z" fill={fill} fillOpacity="0.45" stroke={stroke} strokeWidth={strokeWidth} />
                    <path d="M2 3h28v11c-5 4-8-2-13 2-4 3-8 1-15-1z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                </>
            )}
            {type === 'trapezoid' && <polygon points="7,3 34,3 29,21 2,21" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'delay' && <path d="M2 3h21c10 0 10 18 0 18H2z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'cloud' && <path d="M9 19c-6 0-7-7-2-9 0-5 7-8 12-4 4-4 12-1 12 5 4 2 3 8-2 8z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'bang' && <path d="M18 2l8 4 8 6-8 6-8 4-8-4-8-6 8-6z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {type === 'custom' && <rect x="2" y="3" width="32" height="18" rx="5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="4 3" />}
        </svg>
    );
}

function shortTypeLabel(type: MermaidFlowNode['type']) {
    switch (type) {
        case 'startEnd': return 'Start';
        case 'inputOutput': return 'Input';
        case 'subroutine': return 'Sub';
        case 'multiDocument': return 'Docs';
        case 'trapezoid': return 'Manual';
        case 'rounded': return 'Round';
        default: return typeLabel(type);
    }
}

function encodeMermaidHash(value: string) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeMermaidHash(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
