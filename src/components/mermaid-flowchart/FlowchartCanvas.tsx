'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Crosshair, GitBranchPlus } from 'lucide-react';
import type {
    MermaidFlowEdge,
    MermaidFlowNode,
    MermaidFlowchartDocument,
    MermaidViewport,
} from '@/types/mermaid-flowchart';
import { cloneDocument, createEdge, createNode } from '@/lib/mermaid-flowchart';

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2400;
const GRID_SIZE = 24;
const ALIGN_THRESHOLD = 10;

type DragState =
    | {
        type: 'pan';
        startX: number;
        startY: number;
        viewportX: number;
        viewportY: number;
    }
    | {
        type: 'select';
        originX: number;
        originY: number;
        currentX: number;
        currentY: number;
        originLocalX: number;
        originLocalY: number;
        currentLocalX: number;
        currentLocalY: number;
    }
    | {
        type: 'nodes';
        originX: number;
        originY: number;
        positions: Record<string, { x: number; y: number }>;
        bounds: { minX: number; minY: number; maxX: number; maxY: number };
    };

interface FlowchartCanvasProps {
    document: MermaidFlowchartDocument;
    selection: string[];
    viewport: MermaidViewport;
    connectFrom: string | null;
    onDocumentChange: (document: MermaidFlowchartDocument) => void;
    onSelectionChange: (selection: string[]) => void;
    onViewportChange: (viewport: Partial<MermaidViewport>) => void;
    onConnectFromChange: (nodeId: string | null) => void;
}

export function FlowchartCanvas({
    document,
    selection,
    viewport,
    connectFrom,
    onDocumentChange,
    onSelectionChange,
    onViewportChange,
    onConnectFromChange,
}: FlowchartCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [alignmentGuides, setAlignmentGuides] = useState<{ x?: number; y?: number }>({});
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState('');

    useEffect(() => {
        if (!dragState) return;

        const handlePointerMove = (event: PointerEvent) => {
            if (dragState.type === 'pan') {
                onViewportChange({
                    x: dragState.viewportX + (event.clientX - dragState.startX),
                    y: dragState.viewportY + (event.clientY - dragState.startY),
                });
                return;
            }

            if (dragState.type === 'select') {
                const local = clientToLocal(event.clientX, event.clientY, canvasRef.current);
                setDragState({
                    ...dragState,
                    currentX: event.clientX,
                    currentY: event.clientY,
                    currentLocalX: local.x,
                    currentLocalY: local.y,
                });
                return;
            }

            const canvas = canvasRef.current;
            if (!canvas) return;
            const deltaX = (event.clientX - dragState.originX) / viewport.zoom;
            const deltaY = (event.clientY - dragState.originY) / viewport.zoom;

            const nextDocument = cloneDocument(document);
            const guides = computeAlignmentGuides(nextDocument.nodes, selection, dragState.bounds, deltaX, deltaY);
            setAlignmentGuides(guides);

            nextDocument.nodes = nextDocument.nodes.map((node) => {
                if (!selection.includes(node.id)) return node;
                const startPosition = dragState.positions[node.id];
                if (!startPosition) return node;
                let x = startPosition.x + deltaX;
                let y = startPosition.y + deltaY;
                if (guides.x != null) {
                    x = startPosition.x + deltaX + (guides.x - (dragState.bounds.minX + deltaX));
                } else {
                    x = snap(x);
                }
                if (guides.y != null) {
                    y = startPosition.y + deltaY + (guides.y - (dragState.bounds.minY + deltaY));
                } else {
                    y = snap(y);
                }
                return { ...node, x, y };
            });
            onDocumentChange(nextDocument);
        };

        const handlePointerUp = () => {
            if (dragState.type === 'select') {
                const selected = pickNodesInRect(document.nodes, dragState, viewport, canvasRef.current);
                onSelectionChange(selected);
            }
            setAlignmentGuides({});
            setDragState(null);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [document, dragState, onDocumentChange, onSelectionChange, onViewportChange, selection, viewport]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
                event.preventDefault();
                onSelectionChange(document.nodes.map((node) => node.id));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [document.nodes, onSelectionChange]);

    const handleBackgroundPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;
        if (event.shiftKey) {
            const local = clientToLocal(event.clientX, event.clientY, event.currentTarget);
            setDragState({
                type: 'select',
                originX: event.clientX,
                originY: event.clientY,
                currentX: event.clientX,
                currentY: event.clientY,
                originLocalX: local.x,
                originLocalY: local.y,
                currentLocalX: local.x,
                currentLocalY: local.y,
            });
            return;
        }
        onSelectionChange([]);
        setDragState({
            type: 'pan',
            startX: event.clientX,
            startY: event.clientY,
            viewportX: viewport.x,
            viewportY: viewport.y,
        });
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        event.preventDefault();
        const container = canvasRef.current;
        if (!container) return;
        if (event.ctrlKey || event.metaKey) {
            const rect = container.getBoundingClientRect();
            const cursorX = event.clientX - rect.left;
            const cursorY = event.clientY - rect.top;
            const zoomDelta = event.deltaY < 0 ? 1.08 : 0.92;
            const nextZoom = clamp(viewport.zoom * zoomDelta, 0.35, 2.75);
            const worldX = (cursorX - viewport.x) / viewport.zoom;
            const worldY = (cursorY - viewport.y) / viewport.zoom;
            onViewportChange({
                zoom: nextZoom,
                x: cursorX - worldX * nextZoom,
                y: cursorY - worldY * nextZoom,
            });
            return;
        }

        const deltaX = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
        const deltaY = event.shiftKey && !event.deltaX ? 0 : event.deltaY;
        onViewportChange({
            x: viewport.x - deltaX,
            y: viewport.y - deltaY,
        });
    };

    const handleNodePointerDown = (event: React.PointerEvent<HTMLDivElement>, node: MermaidFlowNode) => {
        event.stopPropagation();
        const additive = event.metaKey || event.ctrlKey;
        const nextSelection = additive
            ? (selection.includes(node.id) ? selection.filter((id) => id !== node.id) : [...selection, node.id])
            : (selection.includes(node.id) ? selection : [node.id]);
        onSelectionChange(nextSelection);

        const dragIds = nextSelection.includes(node.id) ? nextSelection : [node.id];
        const positions = Object.fromEntries(
            document.nodes
                .filter((item) => dragIds.includes(item.id))
                .map((item) => [item.id, { x: item.x, y: item.y }]),
        );
        setDragState({
            type: 'nodes',
            originX: event.clientX,
            originY: event.clientY,
            positions,
            bounds: selectionBounds(document.nodes.filter((item) => dragIds.includes(item.id))),
        });
    };

    const handleNodeDoubleClick = (node: MermaidFlowNode) => {
        setEditingNodeId(node.id);
        setEditingLabel(node.label);
    };

    const commitInlineLabel = () => {
        if (!editingNodeId) return;
        const nextDocument = cloneDocument(document);
        nextDocument.nodes = nextDocument.nodes.map((node) =>
            node.id === editingNodeId ? { ...node, label: editingLabel.trim() || node.label } : node
        );
        onDocumentChange(nextDocument);
        setEditingNodeId(null);
    };

    const handleConnectorClick = (nodeId: string) => {
        if (connectFrom && connectFrom !== nodeId) {
            const nextDocument = cloneDocument(document);
            nextDocument.edges.push(createEdge({ source: connectFrom, target: nodeId }));
            onDocumentChange(nextDocument);
            onConnectFromChange(null);
            return;
        }
        onConnectFromChange(connectFrom === nodeId ? null : nodeId);
    };

    const handleCanvasDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const nodeType = event.dataTransfer.getData('application/modufile-node-type');
        if (!nodeType) return;
        const point = clientToWorld(event.clientX, event.clientY, canvasRef.current, viewport);
        const nextDocument = cloneDocument(document);
        const existingIds = new Set(nextDocument.nodes.map((node) => node.id));
        const id = nextAvailableNodeId(existingIds);
        nextDocument.nodes.push(createNode({
            id,
            type: nodeType as MermaidFlowNode['type'],
            label: `${typeLabel(nodeType as MermaidFlowNode['type'])} ${nextDocument.nodes.length + 1}`,
            x: snap(point.x),
            y: snap(point.y),
        }));
        onDocumentChange(nextDocument);
        onSelectionChange([id]);
    };

    const selectionRect = dragState?.type === 'select'
        ? rectangleFromPoints(
            { x: dragState.originLocalX, y: dragState.originLocalY },
            { x: dragState.currentLocalX, y: dragState.currentLocalY },
        )
        : null;

    const minimapBounds = graphBounds(document.nodes);

    return (
        <div className="relative flex h-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-zinc-800/70 bg-[#070709]">
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-[#101113]/90 px-3 py-2 text-[11px] text-zinc-400 backdrop-blur">
                <Crosshair className="w-3.5 h-3.5 text-zinc-500" />
                <span>Drag nodes</span>
                <span className="text-zinc-700">|</span>
                <span><kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300">Shift</kbd> marquee select</span>
                <span className="text-zinc-700">|</span>
                <span>Scroll to pan</span>
                <span className="text-zinc-700">|</span>
                <span><kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300">Ctrl</kbd>/<kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300">Cmd</kbd> + scroll to zoom</span>
            </div>

            <div
                ref={canvasRef}
                className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
                onPointerDown={handleBackgroundPointerDown}
                onWheel={handleWheel}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleCanvasDrop}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(39,39,42,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(39,39,42,0.4) 1px, transparent 1px)',
                        backgroundSize: `${GRID_SIZE * viewport.zoom}px ${GRID_SIZE * viewport.zoom}px`,
                        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                    }}
                />

                <div
                    className="absolute left-0 top-0 origin-top-left"
                    style={{
                        width: WORLD_WIDTH,
                        height: WORLD_HEIGHT,
                        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                    }}
                >
                    <svg
                        className="absolute inset-0 h-full w-full overflow-visible"
                        viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
                    >
                        <defs>
                            <marker id="mermaid-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto-start-reverse">
                                <path d="M0,0 L10,5 L0,10 z" fill="#60A5FA" />
                            </marker>
                        </defs>
                        {document.edges.map((edge) => (
                            <EdgePath key={edge.id} edge={edge} nodes={document.nodes} />
                        ))}
                        {alignmentGuides.x != null && (
                            <line x1={alignmentGuides.x} x2={alignmentGuides.x} y1={0} y2={WORLD_HEIGHT} stroke="#22C55E" strokeDasharray="10 8" strokeWidth={1.5} />
                        )}
                        {alignmentGuides.y != null && (
                            <line x1={0} x2={WORLD_WIDTH} y1={alignmentGuides.y} y2={alignmentGuides.y} stroke="#22C55E" strokeDasharray="10 8" strokeWidth={1.5} />
                        )}
                    </svg>

                    {document.nodes.map((node) => {
                        const isSelected = selection.includes(node.id);
                        const isConnectOrigin = connectFrom === node.id;
                        return (
                            <div
                                key={node.id}
                                className="absolute"
                                style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                            >
                                <div
                                    className="group relative h-full w-full select-none"
                                    style={{
                                        filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.24))',
                                    }}
                                    onPointerDown={(event) => handleNodePointerDown(event, node)}
                                    onDoubleClick={() => handleNodeDoubleClick(node)}
                                >
                                    <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${node.width} ${node.height}`}>
                                        <CanvasNodeShape node={node} isSelected={isSelected} isConnectOrigin={isConnectOrigin} />
                                    </svg>

                                    <div
                                        className="relative z-10 flex h-full items-center justify-center px-5 text-center"
                                        style={{
                                            color: node.style.textColor,
                                            fontFamily: node.style.fontFamily,
                                            fontSize: node.style.fontSize,
                                        }}
                                    >
                                        {editingNodeId === node.id ? (
                                            <textarea
                                                autoFocus
                                                value={editingLabel}
                                                onChange={(event) => setEditingLabel(event.target.value)}
                                                onBlur={commitInlineLabel}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' && !event.shiftKey) {
                                                        event.preventDefault();
                                                        commitInlineLabel();
                                                    }
                                                    if (event.key === 'Escape') {
                                                        setEditingNodeId(null);
                                                    }
                                                }}
                                                className="h-full w-full resize-none bg-transparent text-center outline-none"
                                            />
                                        ) : (
                                            <span className="whitespace-pre-wrap leading-snug">{node.label}</span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        aria-label={isConnectOrigin ? 'Cancel connection' : 'Connect node'}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleConnectorClick(node.id);
                                        }}
                                        className={`absolute -right-3 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] transition ${isConnectOrigin ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-zinc-700 bg-zinc-900/90 text-zinc-400 hover:border-[#3A76F0] hover:text-white'}`}
                                    >
                                        {isConnectOrigin ? <Check className="h-3.5 w-3.5" /> : <GitBranchPlus className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectionRect && (
                    <div
                        className="pointer-events-none absolute border border-dashed border-[#3A76F0] bg-[#3A76F0]/10"
                        style={{
                            left: selectionRect.x,
                            top: selectionRect.y,
                            width: selectionRect.width,
                            height: selectionRect.height,
                        }}
                    />
                )}
            </div>

            <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-zinc-800/80 bg-[#111214]/95 p-2 shadow-2xl backdrop-blur">
                <Minimap document={document} bounds={minimapBounds} selection={selection} />
            </div>
        </div>
    );
}

function EdgePath({ edge, nodes }: { edge: MermaidFlowEdge; nodes: MermaidFlowNode[] }) {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (!source || !target) return null;

    const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
    const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    const horizontal = Math.abs(targetCenter.x - sourceCenter.x) > Math.abs(targetCenter.y - sourceCenter.y);
    const sourceAnchor = horizontal
        ? { x: sourceCenter.x + Math.sign(targetCenter.x - sourceCenter.x) * source.width * 0.5, y: sourceCenter.y }
        : { x: sourceCenter.x, y: sourceCenter.y + Math.sign(targetCenter.y - sourceCenter.y) * source.height * 0.5 };
    const targetAnchor = horizontal
        ? { x: targetCenter.x - Math.sign(targetCenter.x - sourceCenter.x) * target.width * 0.5, y: targetCenter.y }
        : { x: targetCenter.x, y: targetCenter.y - Math.sign(targetCenter.y - sourceCenter.y) * target.height * 0.5 };

    const path = `M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceAnchor.x + (horizontal ? (targetAnchor.x - sourceAnchor.x) * 0.5 : 0)} ${sourceAnchor.y + (horizontal ? 0 : (targetAnchor.y - sourceAnchor.y) * 0.5)}, ${targetAnchor.x - (horizontal ? (targetAnchor.x - sourceAnchor.x) * 0.5 : 0)} ${targetAnchor.y - (horizontal ? 0 : (targetAnchor.y - sourceAnchor.y) * 0.5)}, ${targetAnchor.x} ${targetAnchor.y}`;

    const dashArray = edge.style.lineStyle === 'dashed' ? '12 10' : undefined;
    const strokeWidth = edge.style.lineStyle === 'thick' ? Math.max(edge.style.width, 4) : edge.style.width;
    const midpoint = { x: (sourceAnchor.x + targetAnchor.x) / 2, y: (sourceAnchor.y + targetAnchor.y) / 2 };

    return (
        <>
            <path
                d={path}
                fill="none"
                stroke={edge.style.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                markerEnd={edge.style.arrow === 'arrow' ? 'url(#mermaid-arrow)' : undefined}
            />
            {edge.label && (
                <foreignObject x={midpoint.x - 70} y={midpoint.y - 18} width={140} height={36}>
                    <div className="flex h-full w-full items-center justify-center">
                        <span
                            className="rounded-full border border-zinc-800/90 bg-[#111214]/95 px-2 py-1 text-[11px] font-medium"
                            style={{ color: edge.style.textColor }}
                        >
                            {edge.label}
                        </span>
                    </div>
                </foreignObject>
            )}
        </>
    );
}

function Minimap({
    document,
    bounds,
    selection,
}: {
    document: MermaidFlowchartDocument;
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
    selection: string[];
}) {
    const width = 180;
    const height = 116;
    const graphWidth = Math.max(bounds.maxX - bounds.minX, 1);
    const graphHeight = Math.max(bounds.maxY - bounds.minY, 1);
    const scale = Math.min(width / graphWidth, height / graphHeight);

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
            <rect x={0} y={0} width={width} height={height} rx={10} fill="#050607" stroke="#27272A" />
            {document.edges.map((edge) => {
                const source = document.nodes.find((node) => node.id === edge.source);
                const target = document.nodes.find((node) => node.id === edge.target);
                if (!source || !target) return null;
                const x1 = (source.x - bounds.minX) * scale + 12;
                const y1 = (source.y - bounds.minY) * scale + 12;
                const x2 = (target.x - bounds.minX) * scale + 12;
                const y2 = (target.y - bounds.minY) * scale + 12;
                return <line key={edge.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3F3F46" strokeWidth={1} />;
            })}
            {document.nodes.map((node) => {
                const x = (node.x - bounds.minX) * scale + 10;
                const y = (node.y - bounds.minY) * scale + 10;
                const width = Math.max(10, node.width * scale);
                const height = Math.max(8, node.height * scale);
                const isSelected = selection.includes(node.id);
                return (
                    <rect
                        key={node.id}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx={Math.min(14, node.type === 'startEnd' ? 14 : 4)}
                        fill={node.style.fill}
                        stroke={isSelected ? '#22C55E' : node.style.stroke}
                        strokeWidth={isSelected ? 2 : 1}
                    />
                );
            })}
        </svg>
    );
}

function graphBounds(nodes: MermaidFlowNode[]) {
    if (nodes.length === 0) {
        return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
    }
    return nodes.reduce((acc, node) => ({
        minX: Math.min(acc.minX, node.x),
        minY: Math.min(acc.minY, node.y),
        maxX: Math.max(acc.maxX, node.x + node.width),
        maxY: Math.max(acc.maxY, node.y + node.height),
    }), {
        minX: nodes[0].x,
        minY: nodes[0].y,
        maxX: nodes[0].x + nodes[0].width,
        maxY: nodes[0].y + nodes[0].height,
    });
}

function nextAvailableNodeId(existingIds: Set<string>) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let index = 0;
    while (true) {
        const first = alphabet[index % alphabet.length];
        const suffix = index >= alphabet.length ? String(Math.floor(index / alphabet.length)) : '';
        const id = `${first}${suffix}`;
        if (!existingIds.has(id)) return id;
        index += 1;
    }
}

function typeLabel(type: MermaidFlowNode['type']) {
    switch (type) {
        case 'startEnd': return 'Start';
        case 'inputOutput': return 'Input';
        case 'decision': return 'Decision';
        case 'subroutine': return 'Subroutine';
        case 'database': return 'Database';
        case 'circle': return 'Event';
        case 'rounded': return 'Topic';
        case 'document': return 'Document';
        case 'multiDocument': return 'Documents';
        case 'hexagon': return 'Prepare';
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

function nodeAccentStroke(node: MermaidFlowNode, isSelected: boolean, isConnectOrigin: boolean) {
    const ringColor = isConnectOrigin ? '#22C55E' : '#3A76F0';
    return isSelected ? ringColor : node.style.stroke;
}

function CanvasNodeShape({
    node,
    isSelected,
    isConnectOrigin,
}: {
    node: MermaidFlowNode;
    isSelected: boolean;
    isConnectOrigin: boolean;
}) {
    const stroke = nodeAccentStroke(node, isSelected, isConnectOrigin);
    const fill = node.style.fill;
    const strokeWidth = isSelected ? 3 : 2;
    const w = node.width;
    const h = node.height;
    const cx = w / 2;
    const cy = h / 2;

    return (
        <>
            {node.type === 'startEnd' && <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx={(h - 3) / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'process' && <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx="24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'rounded' && <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx="18" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'circle' && <circle cx={cx} cy={cy} r={Math.min(w, h) / 2 - 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'decision' && <polygon points={`${cx},1.5 ${w - 1.5},${cy} ${cx},${h - 1.5} 1.5,${cy}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'inputOutput' && <polygon points={`${w * 0.09},1.5 ${w - 1.5},1.5 ${w * 0.91},${h - 1.5} 1.5,${h - 1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'subroutine' && (
                <>
                    <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx="18" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <line x1="18" y1="10" x2="18" y2={h - 10} stroke={stroke} strokeWidth={strokeWidth} />
                    <line x1={w - 18} y1="10" x2={w - 18} y2={h - 10} stroke={stroke} strokeWidth={strokeWidth} />
                </>
            )}
            {node.type === 'database' && (
                <>
                    <path d={`M 1.5 12 C 1.5 4 ${w - 1.5} 4 ${w - 1.5} 12 L ${w - 1.5} ${h - 12} C ${w - 1.5} ${h + 2} 1.5 ${h + 2} 1.5 ${h - 12} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <ellipse cx={cx} cy="12" rx={w / 2 - 1.5} ry="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <ellipse cx={cx} cy={h - 12} rx={w / 2 - 1.5} ry="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                </>
            )}
            {node.type === 'hexagon' && <polygon points={`${w * 0.18},1.5 ${w * 0.82},1.5 ${w - 1.5},${cy} ${w * 0.82},${h - 1.5} ${w * 0.18},${h - 1.5} 1.5,${cy}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'document' && <path d={`M 1.5 1.5 H ${w - 1.5} V ${h - 18} C ${w * 0.82} ${h - 4} ${w * 0.58} ${h - 30} ${w * 0.36} ${h - 14} C ${w * 0.22} ${h - 4} ${w * 0.1} ${h - 6} 1.5 ${h - 18} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'multiDocument' && (
                <>
                    <path d={`M 12 8 H ${w - 1.5} V ${h - 18} C ${w * 0.82} ${h - 4} ${w * 0.58} ${h - 30} ${w * 0.36} ${h - 14} C ${w * 0.22} ${h - 4} ${w * 0.1} ${h - 6} 12 ${h - 18} Z`} fill={fill} fillOpacity="0.38" stroke={stroke} strokeWidth={strokeWidth} />
                    <path d={`M 1.5 1.5 H ${w - 12} V ${h - 24} C ${w * 0.74} ${h - 10} ${w * 0.52} ${h - 34} ${w * 0.3} ${h - 18} C ${w * 0.18} ${h - 10} ${w * 0.08} ${h - 10} 1.5 ${h - 24} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                </>
            )}
            {node.type === 'trapezoid' && <polygon points={`${w * 0.14},1.5 ${w - 1.5},1.5 ${w * 0.86},${h - 1.5} 1.5,${h - 1.5}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'delay' && <path d={`M 1.5 1.5 H ${w * 0.72} Q ${w - 1.5} ${cy} ${w * 0.72} ${h - 1.5} H 1.5 Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'cloud' && <path d={`M ${w * 0.16} ${h * 0.76} C ${w * 0.02} ${h * 0.78} 0 ${h * 0.54} ${w * 0.11} ${h * 0.44} C ${w * 0.06} ${h * 0.18} ${w * 0.28} ${h * 0.06} ${w * 0.44} ${h * 0.16} C ${w * 0.54} -2 ${w * 0.8} ${h * 0.06} ${w * 0.8} ${h * 0.26} C ${w * 0.98} ${h * 0.28} ${w} ${h * 0.52} ${w * 0.88} ${h * 0.64} C ${w * 0.84} ${h * 0.82} ${w * 0.62} ${h * 0.92} ${w * 0.46} ${h * 0.84} C ${w * 0.36} ${h * 0.96} ${w * 0.2} ${h * 0.92} ${w * 0.16} ${h * 0.76} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'bang' && <path d={`M ${cx} 1.5 L ${w * 0.84} ${h * 0.26} L ${w - 1.5} ${cy} L ${w * 0.84} ${h * 0.74} L ${cx} ${h - 1.5} L ${w * 0.16} ${h * 0.74} L 1.5 ${cy} L ${w * 0.16} ${h * 0.26} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />}
            {node.type === 'custom' && <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx="18" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="10 7" />}
        </>
    );
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

function computeAlignmentGuides(
    nodes: MermaidFlowNode[],
    selection: string[],
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    deltaX: number,
    deltaY: number,
) {
    const selected = new Set(selection);
    let guideX: number | undefined;
    let guideY: number | undefined;
    let bestXDistance = ALIGN_THRESHOLD;
    let bestYDistance = ALIGN_THRESHOLD;

    const movingLeft = bounds.minX + deltaX;
    const movingTop = bounds.minY + deltaY;

    for (const node of nodes) {
        if (selected.has(node.id)) continue;
        const xCandidates = [node.x, node.x + node.width / 2, node.x + node.width];
        const yCandidates = [node.y, node.y + node.height / 2, node.y + node.height];
        for (const candidate of xCandidates) {
            const distance = Math.abs(candidate - movingLeft);
            if (distance < bestXDistance) {
                bestXDistance = distance;
                guideX = candidate;
            }
        }
        for (const candidate of yCandidates) {
            const distance = Math.abs(candidate - movingTop);
            if (distance < bestYDistance) {
                bestYDistance = distance;
                guideY = candidate;
            }
        }
    }

    return { x: guideX, y: guideY };
}

function pickNodesInRect(
    nodes: MermaidFlowNode[],
    dragState: Extract<DragState, { type: 'select' }>,
    viewport: MermaidViewport,
    element: HTMLDivElement | null,
) {
    if (!element) return [];
    const origin = clientToWorld(dragState.originX, dragState.originY, element, viewport);
    const current = clientToWorld(dragState.currentX, dragState.currentY, element, viewport);
    const x1 = Math.min(origin.x, current.x);
    const y1 = Math.min(origin.y, current.y);
    const x2 = Math.max(origin.x, current.x);
    const y2 = Math.max(origin.y, current.y);

    return nodes
        .filter((node) => node.x < x2 && node.x + node.width > x1 && node.y < y2 && node.y + node.height > y1)
        .map((node) => node.id);
}

function clientToWorld(clientX: number, clientY: number, element: HTMLDivElement | null, viewport: MermaidViewport) {
    const local = clientToLocal(clientX, clientY, element);
    return {
        x: (local.x - viewport.x) / viewport.zoom,
        y: (local.y - viewport.y) / viewport.zoom,
    };
}

function clientToLocal(clientX: number, clientY: number, element: HTMLDivElement | null) {
    const rect = element?.getBoundingClientRect();
    return {
        x: clientX - (rect?.left ?? 0),
        y: clientY - (rect?.top ?? 0),
    };
}

function rectangleFromPoints(start: { x: number; y: number }, end: { x: number; y: number }) {
    return {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
    };
}

function snap(value: number) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
