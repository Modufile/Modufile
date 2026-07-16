import { PDFDocument } from 'pdf-lib';
import { diagramData } from '@mermaid-js/examples';
import type {
    MermaidEdgeArrowStyle,
    MermaidEdgeLineStyle,
    MermaidFlowDirection,
    MermaidFlowEdge,
    MermaidFlowNode,
    MermaidFlowchartDocument,
    MermaidNodeStyle,
    MermaidNodeType,
    MermaidParseResult,
    MermaidThemePreset,
} from '@/types/mermaid-flowchart';

const EXPORT_PADDING = 72;

export const MERMAID_SAMPLE_DIAGRAMS = diagramData
    .filter((diagram) => Boolean(diagram.name) && Array.isArray(diagram.examples) && diagram.examples.length > 0)
    .map((diagram) => ({
        id: diagram.id,
        name: diagram.name.replace(/ (Diagram|Chart|Graph)/, ''),
        description: diagram.description,
        code: diagram.examples.find((example) => example.isDefault)?.code ?? diagram.examples[0]?.code ?? '',
    }))
    .filter((diagram) => diagram.code);

const DEFAULT_NODE_STYLE: MermaidNodeStyle = {
    fill: '#18181B',
    stroke: '#3A76F0',
    textColor: '#F4F4F5',
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
};

const DEFAULT_EDGE_STYLE = {
    stroke: '#60A5FA',
    width: 2,
    textColor: '#BFDBFE',
    lineStyle: 'solid' as MermaidEdgeLineStyle,
    arrow: 'arrow' as MermaidEdgeArrowStyle,
};

export const FLOWCHART_THEME_PRESETS: MermaidThemePreset[] = [
    {
        id: 'modufile',
        name: 'Modufile Night',
        node: DEFAULT_NODE_STYLE,
        edge: DEFAULT_EDGE_STYLE,
        canvasBackground: '#09090B',
    },
    {
        id: 'terminal',
        name: 'Terminal Signal',
        node: {
            fill: '#0B1B13',
            stroke: '#22C55E',
            textColor: '#DCFCE7',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14,
        },
        edge: {
            stroke: '#4ADE80',
            width: 2,
            textColor: '#BBF7D0',
            lineStyle: 'solid',
            arrow: 'arrow',
        },
        canvasBackground: '#050816',
    },
    {
        id: 'blueprint',
        name: 'Blueprint',
        node: {
            fill: '#0F172A',
            stroke: '#38BDF8',
            textColor: '#E0F2FE',
            fontFamily: 'Inter, sans-serif',
            fontSize: 15,
        },
        edge: {
            stroke: '#7DD3FC',
            width: 2,
            textColor: '#BAE6FD',
            lineStyle: 'dashed',
            arrow: 'arrow',
        },
        canvasBackground: '#020617',
    },
];

export const FLOWCHART_TEMPLATES: Array<{ id: string; name: string; description: string; document: MermaidFlowchartDocument }> = [
    {
        id: 'blank',
        name: 'Blank Canvas',
        description: 'A starter diagram with one process node.',
        document: {
            id: 'blank-template',
            title: 'Blank Flowchart',
            direction: 'TB',
            nodes: [
                createNode({ id: 'A', label: 'New step', x: 420, y: 220, type: 'process' }),
            ],
            edges: [],
            activeThemePresetId: 'modufile',
        },
    },
    {
        id: 'flowchart',
        name: 'Basic Flowchart',
        description: 'Start, process, decision, and end.',
        document: {
            id: 'flowchart-template',
            title: 'Basic Flowchart',
            direction: 'TB',
            nodes: [
                createNode({ id: 'A', label: 'Start', x: 420, y: 80, type: 'startEnd' }),
                createNode({ id: 'B', label: 'Collect input', x: 420, y: 220, type: 'inputOutput' }),
                createNode({ id: 'C', label: 'Validate request', x: 420, y: 380, type: 'decision' }),
                createNode({ id: 'D', label: 'Process request', x: 240, y: 560, type: 'process' }),
                createNode({ id: 'E', label: 'Notify user', x: 600, y: 560, type: 'process' }),
                createNode({ id: 'F', label: 'End', x: 420, y: 740, type: 'startEnd' }),
            ],
            edges: [
                createEdge({ id: 'E1', source: 'A', target: 'B' }),
                createEdge({ id: 'E2', source: 'B', target: 'C' }),
                createEdge({ id: 'E3', source: 'C', target: 'D', label: 'Valid' }),
                createEdge({ id: 'E4', source: 'C', target: 'E', label: 'Needs changes', style: { ...DEFAULT_EDGE_STYLE, lineStyle: 'dashed' } }),
                createEdge({ id: 'E5', source: 'D', target: 'F' }),
                createEdge({ id: 'E6', source: 'E', target: 'F' }),
            ],
            activeThemePresetId: 'modufile',
        },
    },
    {
        id: 'system-design',
        name: 'System Design',
        description: 'Frontend, API, queue, worker, and storage.',
        document: {
            id: 'system-design-template',
            title: 'System Design',
            direction: 'LR',
            nodes: [
                createNode({ id: 'WEB', label: 'Client App', x: 120, y: 280, type: 'process' }),
                createNode({ id: 'API', label: 'API Gateway', x: 420, y: 280, type: 'process' }),
                createNode({ id: 'QUEUE', label: 'Job Queue', x: 740, y: 160, type: 'database' }),
                createNode({ id: 'WORKER', label: 'Worker Pool', x: 740, y: 400, type: 'subroutine' }),
                createNode({ id: 'STORE', label: 'Object Storage', x: 1060, y: 280, type: 'database' }),
            ],
            edges: [
                createEdge({ id: 'S1', source: 'WEB', target: 'API' }),
                createEdge({ id: 'S2', source: 'API', target: 'QUEUE', label: 'enqueue' }),
                createEdge({ id: 'S3', source: 'QUEUE', target: 'WORKER', label: 'dispatch', style: { ...DEFAULT_EDGE_STYLE, lineStyle: 'dashed' } }),
                createEdge({ id: 'S4', source: 'WORKER', target: 'STORE', label: 'write', style: { ...DEFAULT_EDGE_STYLE, lineStyle: 'thick' } }),
                createEdge({ id: 'S5', source: 'STORE', target: 'WEB', label: 'deliver', style: { ...DEFAULT_EDGE_STYLE, arrow: 'none' } }),
            ],
            activeThemePresetId: 'blueprint',
        },
    },
    {
        id: 'decision-tree',
        name: 'Decision Tree',
        description: 'A compact yes/no branching tree.',
        document: {
            id: 'decision-tree-template',
            title: 'Decision Tree',
            direction: 'TB',
            nodes: [
                createNode({ id: 'Q1', label: 'Urgent request?', x: 480, y: 100, type: 'decision' }),
                createNode({ id: 'Q2', label: 'Blocked by policy?', x: 280, y: 320, type: 'decision' }),
                createNode({ id: 'Q3', label: 'Can self-serve?', x: 680, y: 320, type: 'decision' }),
                createNode({ id: 'A1', label: 'Escalate now', x: 160, y: 560, type: 'startEnd' }),
                createNode({ id: 'A2', label: 'Guide user', x: 480, y: 560, type: 'process' }),
                createNode({ id: 'A3', label: 'Queue follow-up', x: 800, y: 560, type: 'startEnd' }),
            ],
            edges: [
                createEdge({ id: 'D1', source: 'Q1', target: 'Q2', label: 'Yes' }),
                createEdge({ id: 'D2', source: 'Q1', target: 'Q3', label: 'No' }),
                createEdge({ id: 'D3', source: 'Q2', target: 'A1', label: 'Yes' }),
                createEdge({ id: 'D4', source: 'Q2', target: 'A2', label: 'No' }),
                createEdge({ id: 'D5', source: 'Q3', target: 'A2', label: 'Yes' }),
                createEdge({ id: 'D6', source: 'Q3', target: 'A3', label: 'No' }),
            ],
            activeThemePresetId: 'terminal',
        },
    },
];

export function createNode(overrides: Partial<MermaidFlowNode> & Pick<MermaidFlowNode, 'label' | 'x' | 'y' | 'type'>): MermaidFlowNode {
    return {
        id: overrides.id ?? makeNodeId(),
        label: overrides.label,
        type: overrides.type,
        x: overrides.x,
        y: overrides.y,
        width: overrides.width ?? defaultNodeWidth(overrides.type),
        height: overrides.height ?? defaultNodeHeight(overrides.type),
        style: {
            ...DEFAULT_NODE_STYLE,
            ...overrides.style,
        },
    };
}

export function createEdge(overrides: Partial<MermaidFlowEdge> & Pick<MermaidFlowEdge, 'source' | 'target'>): MermaidFlowEdge {
    return {
        id: overrides.id ?? makeEdgeId(),
        source: overrides.source,
        target: overrides.target,
        label: overrides.label,
        style: {
            ...DEFAULT_EDGE_STYLE,
            ...overrides.style,
        },
    };
}

export function defaultDocument(): MermaidFlowchartDocument {
    return cloneDocument(FLOWCHART_TEMPLATES[1].document);
}

export function cloneDocument(document: MermaidFlowchartDocument): MermaidFlowchartDocument {
    return JSON.parse(JSON.stringify(document)) as MermaidFlowchartDocument;
}

export function resolveThemePreset(presetId: string | undefined): MermaidThemePreset {
    return FLOWCHART_THEME_PRESETS.find((preset) => preset.id === presetId) ?? FLOWCHART_THEME_PRESETS[0];
}

export function serializeDocument(document: MermaidFlowchartDocument): string {
    const lines: string[] = [];
    lines.push(`flowchart ${document.direction}`);
    lines.push(`%% @meta title=${encodeURIComponent(document.title)} theme=${document.activeThemePresetId}`);
    for (const node of document.nodes) {
        lines.push(
            `%% @node ${node.id} type=${node.type} x=${Math.round(node.x)} y=${Math.round(node.y)} width=${Math.round(node.width)} height=${Math.round(node.height)}`
        );
    }
    lines.push('');
    for (const edge of document.edges) {
        const source = nodeExpression(document.nodes.find((node) => node.id === edge.source));
        const target = nodeExpression(document.nodes.find((node) => node.id === edge.target));
        const connector = edgeConnector(edge.style.lineStyle, edge.style.arrow);
        const label = edge.label?.trim() ? `|${sanitizeEdgeLabel(edge.label)}| ` : '';
        lines.push(`    ${source} ${connector}${label}${target}`);
    }
    if (document.edges.length === 0) {
        for (const node of document.nodes) {
            lines.push(`    ${nodeExpression(node)}`);
        }
    }
    lines.push('');
    for (const node of document.nodes) {
        lines.push(
            `    style ${node.id} fill:${node.style.fill},stroke:${node.style.stroke},color:${node.style.textColor},font-family:${node.style.fontFamily},font-size:${node.style.fontSize}px`
        );
    }
    for (const [index, edge] of document.edges.entries()) {
        lines.push(
            `    linkStyle ${index} stroke:${edge.style.stroke},stroke-width:${edge.style.width}px,color:${edge.style.textColor}`
        );
    }
    return lines.join('\n');
}

export function formatMermaidCode(code: string): string {
    const parsed = parseMermaidCode(code);
    return serializeDocument(parsed.document);
}

export function parseMermaidCode(rawCode: string): MermaidParseResult {
    const code = extractMermaidCode(rawCode);
    const lines = code.split(/\r?\n/);
    const warnings: string[] = [];
    const first = lines.find((line) => line.trim().length > 0);
    if (!first || !/^flowchart\s+(TB|BT|LR|RL)\b/i.test(first.trim())) {
        throw new Error('The visual editor supports Mermaid flowcharts beginning with "flowchart TB", "flowchart LR", "flowchart RL", or "flowchart BT".');
    }

    const direction = first.trim().split(/\s+/)[1].toUpperCase() as MermaidFlowDirection;
    const nodeMap = new Map<string, MermaidFlowNode>();
    const edgeStyles = new Map<number, Record<string, string>>();
    const metaNodeLayout = new Map<string, Partial<MermaidFlowNode>>();
    let title = 'Mermaid Flowchart';
    let activeThemePresetId = 'modufile';

    const edgeLines: Array<{ source: string; target: string; label?: string; lineStyle: MermaidEdgeLineStyle; arrow: MermaidEdgeArrowStyle }> = [];

    for (const rawLine of lines.slice(1)) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith('%%')) {
            if (line.startsWith('%% @meta')) {
                const titleMatch = line.match(/title=([^\s]+)/);
                const themeMatch = line.match(/theme=([^\s]+)/);
                if (titleMatch) title = decodeURIComponent(titleMatch[1]);
                if (themeMatch) activeThemePresetId = themeMatch[1];
            } else if (line.startsWith('%% @node')) {
                const [, nodeId] = line.match(/^%%\s+@node\s+([A-Za-z][\w-]*)/) ?? [];
                if (nodeId) {
                    metaNodeLayout.set(nodeId, {
                        type: (matchGroup(line, /type=([A-Za-z]+)/) as MermaidNodeType | undefined),
                        x: safeNumber(matchGroup(line, /x=([-\d.]+)/)),
                        y: safeNumber(matchGroup(line, /y=([-\d.]+)/)),
                        width: safeNumber(matchGroup(line, /width=([-\d.]+)/)),
                        height: safeNumber(matchGroup(line, /height=([-\d.]+)/)),
                    });
                }
            }
            continue;
        }

        if (line.startsWith('style ')) {
            const styleMatch = line.match(/^style\s+([A-Za-z][\w-]*)\s+(.+)$/);
            if (!styleMatch) continue;
            const [, nodeId, styleSpec] = styleMatch;
            const styleTokens = parseStyleSpec(styleSpec);
            const node = nodeMap.get(nodeId) ?? createNode({ id: nodeId, label: nodeId, x: 0, y: 0, type: 'process' });
            node.style = {
                ...node.style,
                fill: styleTokens.fill ?? node.style.fill,
                stroke: styleTokens.stroke ?? node.style.stroke,
                textColor: styleTokens.color ?? node.style.textColor,
                fontFamily: styleTokens['font-family'] ?? node.style.fontFamily,
                fontSize: safeNumber(styleTokens['font-size']) ?? node.style.fontSize,
            };
            nodeMap.set(nodeId, node);
            continue;
        }

        if (line.startsWith('linkStyle ')) {
            const linkStyleMatch = line.match(/^linkStyle\s+(\d+)\s+(.+)$/);
            if (!linkStyleMatch) continue;
            edgeStyles.set(Number(linkStyleMatch[1]), parseStyleSpec(linkStyleMatch[2]));
            continue;
        }

        const parsedEdge = parseEdgeLine(line);
        if (parsedEdge) {
            const sourceNode = upsertNode(nodeMap, parsedEdge.left);
            const targetNode = upsertNode(nodeMap, parsedEdge.right);
            edgeLines.push({
                source: sourceNode.id,
                target: targetNode.id,
                label: parsedEdge.label,
                lineStyle: parsedEdge.lineStyle,
                arrow: parsedEdge.arrow,
            });
            continue;
        }

        const standaloneNode = parseNodeExpression(line);
        if (standaloneNode) {
            upsertNode(nodeMap, standaloneNode);
            continue;
        }

        warnings.push(`Unsupported Mermaid line skipped: "${line}"`);
    }

    const nodes = Array.from(nodeMap.values());
    for (const node of nodes) {
        const layout = metaNodeLayout.get(node.id);
        if (!layout) continue;
        node.type = layout.type ?? node.type;
        node.x = layout.x ?? node.x;
        node.y = layout.y ?? node.y;
        node.width = layout.width ?? node.width;
        node.height = layout.height ?? node.height;
    }

    const edges: MermaidFlowEdge[] = edgeLines.map((edge, index) => {
        const styleTokens = edgeStyles.get(index);
        return createEdge({
            source: edge.source,
            target: edge.target,
            label: edge.label,
            style: {
                stroke: styleTokens?.stroke ?? DEFAULT_EDGE_STYLE.stroke,
                width: safeNumber(styleTokens?.['stroke-width']) ?? DEFAULT_EDGE_STYLE.width,
                textColor: styleTokens?.color ?? DEFAULT_EDGE_STYLE.textColor,
                lineStyle: edge.lineStyle,
                arrow: edge.arrow,
            },
        });
    });

    const document: MermaidFlowchartDocument = autoLayoutDocument({
        id: makeDocumentId(),
        title,
        direction,
        nodes,
        edges,
        activeThemePresetId,
    }, metaNodeLayout.size > 0);

    return { document, warnings };
}

export function autoLayoutDocument(document: MermaidFlowchartDocument, preserveExistingPositions = false): MermaidFlowchartDocument {
    const next = cloneDocument(document);
    if (preserveExistingPositions) return next;

    const nodeMap = new Map(next.nodes.map((node) => [node.id, node]));
    const indegree = new Map(next.nodes.map((node) => [node.id, 0]));
    const adjacency = new Map(next.nodes.map((node) => [node.id, [] as string[]]));

    for (const edge of next.edges) {
        adjacency.get(edge.source)?.push(edge.target);
        indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    }

    const roots = next.nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
    const queue = roots.length > 0 ? [...roots] : next.nodes.map((node) => node.id);
    const depthMap = new Map<string, number>();

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        const depth = depthMap.get(nodeId) ?? 0;
        for (const target of adjacency.get(nodeId) ?? []) {
            const nextDepth = Math.max(depthMap.get(target) ?? 0, depth + 1);
            depthMap.set(target, nextDepth);
            queue.push(target);
        }
    }

    const layers = new Map<number, MermaidFlowNode[]>();
    for (const node of next.nodes) {
        const depth = depthMap.get(node.id) ?? 0;
        const layer = layers.get(depth) ?? [];
        layer.push(node);
        layers.set(depth, layer);
    }

    const horizontal = next.direction === 'LR' || next.direction === 'RL';
    const orderedLayers = Array.from(layers.entries()).sort((a, b) => a[0] - b[0]);
    const layerGap = horizontal ? 300 : 220;
    const itemGap = horizontal ? 180 : 260;
    const startX = 120;
    const startY = 120;

    orderedLayers.forEach(([layerIndex, layerNodes]) => {
        const layerSpan = (layerNodes.length - 1) * itemGap;
        layerNodes.forEach((node, nodeIndex) => {
            if (horizontal) {
                const x = startX + layerIndex * layerGap;
                const y = startY + nodeIndex * itemGap - layerSpan / 2 + 320;
                node.x = next.direction === 'RL' ? 1400 - x : x;
                node.y = y;
            } else {
                const x = startX + nodeIndex * itemGap - layerSpan / 2 + 500;
                const y = startY + layerIndex * layerGap;
                node.x = x;
                node.y = next.direction === 'BT' ? 980 - y : y;
            }
            const sourceNode = nodeMap.get(node.id);
            if (sourceNode) {
                sourceNode.x = node.x;
                sourceNode.y = node.y;
            }
        });
    });

    return next;
}

export function applyThemePreset(document: MermaidFlowchartDocument, preset: MermaidThemePreset, nodeIds?: string[]): MermaidFlowchartDocument {
    const next = cloneDocument(document);
    const targetIds = new Set(nodeIds ?? next.nodes.map((node) => node.id));
    next.nodes = next.nodes.map((node) => targetIds.has(node.id) ? { ...node, style: { ...preset.node } } : node);
    next.edges = next.edges.map((edge) => {
        if (!nodeIds) return { ...edge, style: { ...preset.edge } };
        const touchesSelection = targetIds.has(edge.source) || targetIds.has(edge.target);
        return touchesSelection ? { ...edge, style: { ...preset.edge } } : edge;
    });
    next.activeThemePresetId = preset.id;
    return next;
}

export function extractMermaidCode(content: string): string {
    const trimmed = content.trim();
    const fencedMatch = trimmed.match(/```mermaid\s*([\s\S]*?)```/i);
    return fencedMatch ? fencedMatch[1].trim() : content.trim();
}

export async function validateMermaidCode(code: string): Promise<string | null> {
    try {
        const mermaid = await loadMermaid();
        await mermaid.parse(code);
        return null;
    } catch (error) {
        return error instanceof Error ? error.message : 'Mermaid validation failed.';
    }
}

export async function renderMermaidSvg(code: string): Promise<string> {
    const mermaid = await loadMermaid();
    await mermaid.parse(code);
    const renderId = `modufile-mermaid-${Math.random().toString(36).slice(2)}`;
    const rendered = await mermaid.render(renderId, code);
    return rendered.svg;
}

export function renderFlowchartDocumentSvg(
    document: MermaidFlowchartDocument,
    options?: { background?: string; padding?: number; includeGrid?: boolean }
): string {
    const padding = options?.padding ?? EXPORT_PADDING;
    const bounds = getDocumentBounds(document, padding);
    const width = Math.max(960, Math.ceil(bounds.width));
    const height = Math.max(640, Math.ceil(bounds.height));
    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;
    const background = options?.background ?? resolveThemePreset(document.activeThemePresetId).canvasBackground;

    const nodeMarkup = document.nodes.map((node) => renderSvgNode(node, offsetX, offsetY)).join('');
    const edgeMarkup = document.edges.map((edge) => renderSvgEdge(edge, document.nodes, offsetX, offsetY)).join('');
    const gridMarkup = options?.includeGrid
        ? `<pattern id="modufile-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(63,63,70,0.42)" stroke-width="1"/>
           </pattern>
           <rect width="100%" height="100%" fill="url(#modufile-grid)"/>`
        : '';

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(document.title)}">`,
        '<defs>',
        '  <filter id="node-shadow" x="-20%" y="-20%" width="160%" height="160%">',
        '    <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="rgba(0,0,0,0.38)"/>',
        '  </filter>',
        '  <marker id="editor-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto-start-reverse">',
        '    <path d="M0,0 L10,5 L0,10 z" fill="#60A5FA"/>',
        '  </marker>',
        '</defs>',
        `<rect width="100%" height="100%" fill="${background}"/>`,
        gridMarkup,
        edgeMarkup,
        nodeMarkup,
        '</svg>',
    ].join('');
}

export async function svgToPngBlob(svgMarkup: string, scale = 2, background = '#09090B'): Promise<Blob> {
    const { width, height } = getSvgSize(svgMarkup);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable.');

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const normalizedSvg = ensureSvgNamespace(svgMarkup, background);
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalizedSvg)}`;
    try {
        const image = await loadImage(url);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } finally {}

    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Unable to rasterize Mermaid SVG.'));
        }, 'image/png');
    });
}

export async function svgToPdfBlob(svgMarkup: string, scale = 2, background = '#09090B'): Promise<Blob> {
    const pngBlob = await svgToPngBlob(svgMarkup, scale, background);
    const pdfDoc = await PDFDocument.create();
    const pngBytes = await pngBlob.arrayBuffer();
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
    page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });
    const bytes = await pdfDoc.save();
    return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

export function documentToThemePreset(document: MermaidFlowchartDocument): MermaidThemePreset {
    const node = document.nodes[0]?.style ?? DEFAULT_NODE_STYLE;
    const edge = document.edges[0]?.style ?? DEFAULT_EDGE_STYLE;
    return {
        id: slugify(document.title) || 'custom-preset',
        name: `${document.title} Theme`,
        node: { ...node },
        edge: { ...edge },
        canvasBackground: resolveThemePreset(document.activeThemePresetId).canvasBackground,
    };
}

function defaultNodeWidth(type: MermaidNodeType): number {
    switch (type) {
        case 'circle': return 116;
        case 'decision': return 168;
        case 'database': return 190;
        case 'document': return 196;
        case 'multiDocument': return 204;
        case 'delay': return 188;
        case 'hexagon': return 176;
        case 'inputOutput': return 192;
        case 'trapezoid': return 188;
        case 'cloud': return 204;
        case 'bang': return 140;
        case 'rounded': return 176;
        case 'startEnd': return 170;
        default: return 184;
    }
}

function defaultNodeHeight(type: MermaidNodeType): number {
    switch (type) {
        case 'circle': return 116;
        case 'decision': return 120;
        case 'database': return 110;
        case 'document': return 112;
        case 'multiDocument': return 116;
        case 'delay': return 90;
        case 'hexagon': return 110;
        case 'cloud': return 118;
        case 'bang': return 118;
        default: return 84;
    }
}

function nodeExpression(node: MermaidFlowNode | undefined): string {
    if (!node) return '';
    const label = sanitizeNodeLabel(node.label);
    switch (node.type) {
        case 'startEnd': return `${node.id}([${label}])`;
        case 'circle': return `${node.id}((${label}))`;
        case 'decision': return `${node.id}{${label}}`;
        case 'inputOutput': return `${node.id}[/${label}/]`;
        case 'subroutine': return `${node.id}[[${label}]]`;
        case 'database': return `${node.id}[(${label})]`;
        case 'hexagon': return `${node.id}{{${label}}}`;
        case 'rounded':
        case 'document':
        case 'multiDocument':
        case 'trapezoid':
        case 'delay':
        case 'cloud':
        case 'bang':
        case 'custom':
            return `${node.id}["${label}"]`;
        case 'process':
        default:
            return `${node.id}[${label}]`;
    }
}

function parseEdgeLine(line: string) {
    const connectors: Array<{ token: string; lineStyle: MermaidEdgeLineStyle; arrow: MermaidEdgeArrowStyle }> = [
        { token: '-.->', lineStyle: 'dashed', arrow: 'arrow' },
        { token: '-.-', lineStyle: 'dashed', arrow: 'none' },
        { token: '==>', lineStyle: 'thick', arrow: 'arrow' },
        { token: '===', lineStyle: 'thick', arrow: 'none' },
        { token: '-->', lineStyle: 'solid', arrow: 'arrow' },
        { token: '---', lineStyle: 'solid', arrow: 'none' },
    ];

    for (const connector of connectors) {
        const index = line.indexOf(connector.token);
        if (index === -1) continue;
        const left = line.slice(0, index).trim();
        let right = line.slice(index + connector.token.length).trim();
        let label: string | undefined;
        if (right.startsWith('|')) {
            const labelEnd = right.indexOf('|', 1);
            if (labelEnd !== -1) {
                label = right.slice(1, labelEnd).trim();
                right = right.slice(labelEnd + 1).trim();
            }
        }
        const leftNode = parseNodeExpression(left);
        const rightNode = parseNodeExpression(right);
        if (!leftNode || !rightNode) break;
        return {
            left: leftNode,
            right: rightNode,
            label,
            lineStyle: connector.lineStyle,
            arrow: connector.arrow,
        };
    }
    return null;
}

function parseNodeExpression(expression: string): Partial<MermaidFlowNode> | null {
    const match = expression.trim().match(/^([A-Za-z][\w-]*)([\s\S]*)$/);
    if (!match) return null;
    const [, id, shape] = match;
    const trimmedShape = shape.trim();
    if (!trimmedShape) {
        return { id, label: id, type: 'process' };
    }

    const shapeMap: Array<{ pattern: RegExp; type: MermaidNodeType }> = [
        { pattern: /^\(\[(.+)\]\)$/, type: 'startEnd' },
        { pattern: /^\(\((.+)\)\)$/, type: 'circle' },
        { pattern: /^\[\/(.+)\/\]$/, type: 'inputOutput' },
        { pattern: /^\[\[(.+)\]\]$/, type: 'subroutine' },
        { pattern: /^\[\((.+)\)\]$/, type: 'database' },
        { pattern: /^\{\{(.+)\}\}$/, type: 'hexagon' },
        { pattern: /^\{(.+)\}$/, type: 'decision' },
        { pattern: /^\["(.+)"\]$/, type: 'custom' },
        { pattern: /^\[(.+)\]$/, type: 'process' },
    ];

    for (const item of shapeMap) {
        const shapeMatch = trimmedShape.match(item.pattern);
        if (!shapeMatch) continue;
        return {
            id,
            label: shapeMatch[1].replace(/<br\s*\/?>/gi, '\n'),
            type: item.type,
        };
    }

    return { id, label: id, type: 'process' };
}

function upsertNode(map: Map<string, MermaidFlowNode>, parsed: Partial<MermaidFlowNode>): MermaidFlowNode {
    const existing = map.get(parsed.id!);
    if (existing) {
        existing.label = parsed.label ?? existing.label;
        existing.type = parsed.type ?? existing.type;
        return existing;
    }
    const node = createNode({
        id: parsed.id,
        label: parsed.label ?? parsed.id ?? 'Node',
        x: 0,
        y: 0,
        type: parsed.type ?? 'process',
    });
    map.set(node.id, node);
    return node;
}

function parseStyleSpec(spec: string): Record<string, string> {
    return spec
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce<Record<string, string>>((acc, part) => {
            const [key, ...rest] = part.split(':');
            if (key && rest.length > 0) acc[key.trim()] = rest.join(':').trim();
            return acc;
        }, {});
}

function edgeConnector(lineStyle: MermaidEdgeLineStyle, arrow: MermaidEdgeArrowStyle): string {
    if (lineStyle === 'dashed') return arrow === 'arrow' ? '-.->' : '-.-';
    if (lineStyle === 'thick') return arrow === 'arrow' ? '==>' : '===';
    return arrow === 'arrow' ? '-->' : '---';
}

function sanitizeNodeLabel(label: string): string {
    return label.replace(/\n/g, '<br/>').replace(/"/g, '&quot;');
}

function sanitizeEdgeLabel(label: string): string {
    return label.replace(/\|/g, '/');
}

function safeNumber(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const numeric = Number.parseFloat(value.replace(/px$/, ''));
    return Number.isFinite(numeric) ? numeric : undefined;
}

function matchGroup(value: string, pattern: RegExp): string | undefined {
    return value.match(pattern)?.[1];
}

function getSvgSize(svgMarkup: string): { width: number; height: number } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return { width: 1600, height: 900 };
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
        const [, , width, height] = viewBox.split(/\s+/).map(Number);
        if (Number.isFinite(width) && Number.isFinite(height)) {
            return { width, height };
        }
    }
    return {
        width: safeNumber(svg.getAttribute('width') ?? undefined) ?? 1600,
        height: safeNumber(svg.getAttribute('height') ?? undefined) ?? 900,
    };
}

function ensureSvgNamespace(svgMarkup: string, background: string) {
    let normalized = svgMarkup.includes('xmlns=')
        ? svgMarkup
        : svgMarkup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    if (!normalized.includes('<rect width="100%" height="100%"')) {
        normalized = normalized.replace(/<svg([^>]*)>/, `<svg$1><rect width="100%" height="100%" fill="${background}"/>`);
    }
    return normalized;
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Unable to load SVG export.'));
        image.src = url;
    });
}

function renderSvgEdge(edge: MermaidFlowEdge, nodes: MermaidFlowNode[], offsetX: number, offsetY: number) {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (!source || !target) return '';

    const sourceCenter = { x: source.x + source.width / 2 + offsetX, y: source.y + source.height / 2 + offsetY };
    const targetCenter = { x: target.x + target.width / 2 + offsetX, y: target.y + target.height / 2 + offsetY };
    const horizontal = Math.abs(targetCenter.x - sourceCenter.x) > Math.abs(targetCenter.y - sourceCenter.y);
    const sourceAnchor = horizontal
        ? { x: sourceCenter.x + Math.sign(targetCenter.x - sourceCenter.x) * source.width * 0.5, y: sourceCenter.y }
        : { x: sourceCenter.x, y: sourceCenter.y + Math.sign(targetCenter.y - sourceCenter.y) * source.height * 0.5 };
    const targetAnchor = horizontal
        ? { x: targetCenter.x - Math.sign(targetCenter.x - sourceCenter.x) * target.width * 0.5, y: targetCenter.y }
        : { x: targetCenter.x, y: targetCenter.y - Math.sign(targetCenter.y - sourceCenter.y) * target.height * 0.5 };
    const path = `M ${sourceAnchor.x} ${sourceAnchor.y} C ${sourceAnchor.x + (horizontal ? (targetAnchor.x - sourceAnchor.x) * 0.5 : 0)} ${sourceAnchor.y + (horizontal ? 0 : (targetAnchor.y - sourceAnchor.y) * 0.5)}, ${targetAnchor.x - (horizontal ? (targetAnchor.x - sourceAnchor.x) * 0.5 : 0)} ${targetAnchor.y - (horizontal ? 0 : (targetAnchor.y - sourceAnchor.y) * 0.5)}, ${targetAnchor.x} ${targetAnchor.y}`;
    const dashArray = edge.style.lineStyle === 'dashed' ? '12 10' : '';
    const strokeWidth = edge.style.lineStyle === 'thick' ? Math.max(edge.style.width, 4) : edge.style.width;
    const marker = edge.style.arrow === 'arrow' ? ' marker-end="url(#editor-arrow)"' : '';
    const midpoint = { x: (sourceAnchor.x + targetAnchor.x) / 2, y: (sourceAnchor.y + targetAnchor.y) / 2 };

    return [
        `<path d="${path}" fill="none" stroke="${edge.style.stroke}" stroke-width="${strokeWidth}" ${dashArray ? `stroke-dasharray="${dashArray}"` : ''}${marker}/>`,
        edge.label
            ? `<g>
                    <rect x="${midpoint.x - 58}" y="${midpoint.y - 16}" width="116" height="32" rx="16" fill="#111214" stroke="#27272A"/>
                    <text x="${midpoint.x}" y="${midpoint.y + 4}" font-size="11" text-anchor="middle" fill="${edge.style.textColor}" font-family="Inter, sans-serif">${escapeXml(edge.label)}</text>
               </g>`
            : '',
    ].join('');
}

function renderSvgNode(node: MermaidFlowNode, offsetX: number, offsetY: number) {
    const x = node.x + offsetX;
    const y = node.y + offsetY;
    const cx = x + node.width / 2;
    const cy = y + node.height / 2;
    const fill = node.style.fill;
    const stroke = node.style.stroke;
    const shape = svgNodeShape(node, x, y, cx, cy, fill, stroke);
    const lines = node.label.split('\n');
    const textY = cy - ((lines.length - 1) * (node.style.fontSize + 2)) / 2;
    const text = lines.map((line, index) =>
        `<text x="${cx}" y="${textY + index * (node.style.fontSize + 2)}" text-anchor="middle" dominant-baseline="middle" fill="${node.style.textColor}" font-size="${node.style.fontSize}" font-family="${escapeXml(node.style.fontFamily)}">${escapeXml(line)}</text>`
    ).join('');
    return `<g filter="url(#node-shadow)">${shape}${text}</g>`;
}

function svgNodeShape(node: MermaidFlowNode, x: number, y: number, cx: number, cy: number, fill: string, stroke: string) {
    const common = `fill="${fill}" stroke="${stroke}" stroke-width="2"`;
    switch (node.type) {
        case 'startEnd':
            return `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="${node.height / 2}" ${common}/>`;
        case 'circle':
            return `<circle cx="${cx}" cy="${cy}" r="${Math.min(node.width, node.height) / 2 - 2}" ${common}/>`;
        case 'rounded':
            return `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="18" ${common}/>`;
        case 'decision':
            return `<polygon points="${cx},${y} ${x + node.width},${cy} ${cx},${y + node.height} ${x},${cy}" ${common}/>`;
        case 'inputOutput':
            return `<polygon points="${x + node.width * 0.09},${y} ${x + node.width},${y} ${x + node.width * 0.91},${y + node.height} ${x},${y + node.height}" ${common}/>`;
        case 'database':
            return [
                `<path d="M ${x},${y + 12} C ${x},${y + 4} ${x + node.width},${y + 4} ${x + node.width},${y + 12} L ${x + node.width},${y + node.height - 12} C ${x + node.width},${y + node.height + 2} ${x},${y + node.height + 2} ${x},${y + node.height - 12} Z" ${common}/>`,
                `<ellipse cx="${cx}" cy="${y + 12}" rx="${node.width / 2}" ry="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,
                `<ellipse cx="${cx}" cy="${y + node.height - 12}" rx="${node.width / 2}" ry="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,
            ].join('');
        case 'hexagon':
            return `<polygon points="${x + node.width * 0.18},${y} ${x + node.width * 0.82},${y} ${x + node.width},${cy} ${x + node.width * 0.82},${y + node.height} ${x + node.width * 0.18},${y + node.height} ${x},${cy}" ${common}/>`;
        case 'subroutine':
            return [
                `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="18" ${common}/>`,
                `<line x1="${x + 18}" y1="${y + 10}" x2="${x + 18}" y2="${y + node.height - 10}" stroke="${stroke}" stroke-width="2"/>`,
                `<line x1="${x + node.width - 18}" y1="${y + 10}" x2="${x + node.width - 18}" y2="${y + node.height - 10}" stroke="${stroke}" stroke-width="2"/>`,
            ].join('');
        case 'document':
            return `<path d="M ${x} ${y} H ${x + node.width} V ${y + node.height - 18} C ${x + node.width * 0.82} ${y + node.height - 4} ${x + node.width * 58 / 100} ${y + node.height - 30} ${x + node.width * 36 / 100} ${y + node.height - 14} C ${x + node.width * 22 / 100} ${y + node.height - 4} ${x + node.width * 10 / 100} ${y + node.height - 6} ${x} ${y + node.height - 18} Z" ${common}/>`;
        case 'multiDocument':
            return [
                `<path d="M ${x + 12} ${y + 8} H ${x + node.width} V ${y + node.height - 18} C ${x + node.width * 0.82} ${y + node.height - 4} ${x + node.width * 58 / 100} ${y + node.height - 30} ${x + node.width * 36 / 100} ${y + node.height - 14} C ${x + node.width * 22 / 100} ${y + node.height - 4} ${x + node.width * 10 / 100} ${y + node.height - 6} ${x + 12} ${y + node.height - 18} Z" fill="${fill}" fill-opacity="0.4" stroke="${stroke}" stroke-width="2"/>`,
                `<path d="M ${x} ${y} H ${x + node.width - 12} V ${y + node.height - 24} C ${x + node.width * 0.74} ${y + node.height - 10} ${x + node.width * 0.52} ${y + node.height - 34} ${x + node.width * 0.3} ${y + node.height - 18} C ${x + node.width * 0.18} ${y + node.height - 10} ${x + node.width * 0.08} ${y + node.height - 10} ${x} ${y + node.height - 24} Z" ${common}/>`
            ].join('');
        case 'trapezoid':
            return `<polygon points="${x + node.width * 0.14},${y} ${x + node.width},${y} ${x + node.width * 0.86},${y + node.height} ${x},${y + node.height}" ${common}/>`;
        case 'delay':
            return `<path d="M ${x} ${y} H ${x + node.width * 0.72} Q ${x + node.width} ${cy} ${x + node.width * 0.72} ${y + node.height} H ${x} Z" ${common}/>`;
        case 'cloud':
            return `<path d="M ${x + node.width * 0.16} ${y + node.height * 0.76} C ${x + node.width * 0.02} ${y + node.height * 0.78} ${x} ${y + node.height * 0.54} ${x + node.width * 0.11} ${y + node.height * 0.44} C ${x + node.width * 0.06} ${y + node.height * 0.18} ${x + node.width * 0.28} ${y + node.height * 0.06} ${x + node.width * 0.44} ${y + node.height * 0.16} C ${x + node.width * 0.54} ${y - 2} ${x + node.width * 0.8} ${y + node.height * 0.06} ${x + node.width * 0.8} ${y + node.height * 0.26} C ${x + node.width * 0.98} ${y + node.height * 0.28} ${x + node.width} ${y + node.height * 0.52} ${x + node.width * 0.88} ${y + node.height * 0.64} C ${x + node.width * 0.84} ${y + node.height * 0.82} ${x + node.width * 0.62} ${y + node.height * 0.92} ${x + node.width * 0.46} ${y + node.height * 0.84} C ${x + node.width * 0.36} ${y + node.height * 0.96} ${x + node.width * 0.2} ${y + node.height * 0.92} ${x + node.width * 0.16} ${y + node.height * 0.76} Z" ${common}/>`;
        case 'bang':
            return `<path d="M ${cx} ${y} L ${x + node.width * 0.84} ${y + node.height * 0.26} L ${x + node.width} ${cy} L ${x + node.width * 0.84} ${y + node.height * 0.74} L ${cx} ${y + node.height} L ${x + node.width * 0.16} ${y + node.height * 0.74} L ${x} ${cy} L ${x + node.width * 0.16} ${y + node.height * 0.26} Z" ${common}/>`;
        case 'custom':
            return `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="18" ${common} stroke-dasharray="10 7"/>`;
        case 'process':
        default:
            return `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" rx="24" ${common}/>`;
    }
}

function getDocumentBounds(document: MermaidFlowchartDocument, padding: number) {
    if (document.nodes.length === 0) {
        return { minX: 0, minY: 0, width: 960, height: 640 };
    }
    const minX = Math.min(...document.nodes.map((node) => node.x), ...document.edges.flatMap((edge) => {
        const source = document.nodes.find((node) => node.id === edge.source);
        const target = document.nodes.find((node) => node.id === edge.target);
        if (!source || !target) return [];
        return [source.x, target.x];
    }));
    const minY = Math.min(...document.nodes.map((node) => node.y), ...document.edges.flatMap((edge) => {
        const source = document.nodes.find((node) => node.id === edge.source);
        const target = document.nodes.find((node) => node.id === edge.target);
        if (!source || !target) return [];
        return [source.y, target.y];
    }));
    const maxX = Math.max(...document.nodes.map((node) => node.x + node.width));
    const maxY = Math.max(...document.nodes.map((node) => node.y + node.height));
    return {
        minX,
        minY,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
    };
}

function escapeXml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;

async function loadMermaid() {
    if (!mermaidPromise) {
        mermaidPromise = import('mermaid').then((module) => {
            const mermaid = module.default;
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                fontFamily: 'Inter, sans-serif',
                suppressErrorRendering: true,
                flowchart: {
                    useMaxWidth: false,
                    htmlLabels: true,
                    curve: 'basis',
                },
            });
            return mermaid;
        });
    }
    return mermaidPromise;
}

function slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function makeNodeId(): string {
    return `N${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function makeEdgeId(): string {
    return `E${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function makeDocumentId(): string {
    return `DOC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}
