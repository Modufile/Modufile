export type MermaidFlowDirection = 'TB' | 'BT' | 'LR' | 'RL';

export type MermaidNodeType =
    | 'startEnd'
    | 'process'
    | 'decision'
    | 'inputOutput'
    | 'subroutine'
    | 'database'
    | 'hexagon'
    | 'circle'
    | 'rounded'
    | 'document'
    | 'multiDocument'
    | 'trapezoid'
    | 'delay'
    | 'cloud'
    | 'bang'
    | 'custom';

export type MermaidEdgeLineStyle = 'solid' | 'dashed' | 'thick';
export type MermaidEdgeArrowStyle = 'arrow' | 'none';

export interface MermaidNodeStyle {
    fill: string;
    stroke: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
}

export interface MermaidEdgeStyle {
    stroke: string;
    width: number;
    textColor: string;
    lineStyle: MermaidEdgeLineStyle;
    arrow: MermaidEdgeArrowStyle;
}

export interface MermaidFlowNode {
    id: string;
    type: MermaidNodeType;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    style: MermaidNodeStyle;
}

export interface MermaidFlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    style: MermaidEdgeStyle;
}

export interface MermaidThemePreset {
    id: string;
    name: string;
    node: MermaidNodeStyle;
    edge: MermaidEdgeStyle;
    canvasBackground: string;
}

export interface MermaidFlowchartDocument {
    id: string;
    title: string;
    direction: MermaidFlowDirection;
    nodes: MermaidFlowNode[];
    edges: MermaidFlowEdge[];
    activeThemePresetId: string;
}

export interface MermaidViewport {
    x: number;
    y: number;
    zoom: number;
}

export interface MermaidParseResult {
    document: MermaidFlowchartDocument;
    warnings: string[];
}

export interface MermaidHistoryEntry {
    id: string;
    title: string;
    code: string;
    createdAt: string;
}
