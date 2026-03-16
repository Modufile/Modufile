/**
 * PDF Editor Worker
 *
 * Dedicated worker for the annotation editor. Unlike pool workers,
 * this keeps a MuPDF document alive across operations for interactive editing.
 *
 * Message protocol:
 *   Request:  { id: string, op: string, ...params }
 *   Response: { id: string, result?: any, error?: string }
 */

const ctx = self as unknown as DedicatedWorkerGlobalScope;

let mupdf: any = null;
let doc: any = null;       // mupdf.Document
let pdfDoc: any = null;    // PDFDocument (from asPDF())

async function ensureMuPDF() {
    if (mupdf) return mupdf;
    // @ts-ignore — runtime import from public/
    mupdf = await import(/* webpackIgnore: true */ '/mupdf.js');
    return mupdf;
}

/* ------------------------------------------------------------------ */
/*  Message Handler                                                    */
/* ------------------------------------------------------------------ */

ctx.addEventListener('message', async (e: MessageEvent) => {
    const { id, op, ...params } = e.data;

    try {
        const result = await handleOp(op, params);

        // Build transfer list for ArrayBuffer results
        const transfer: Transferable[] = [];
        if (result?.pngData instanceof ArrayBuffer) {
            transfer.push(result.pngData);
        }
        if (result?.buffer instanceof Uint8Array) {
            transfer.push(result.buffer.buffer);
        }

        ctx.postMessage({ id, result }, transfer);
    } catch (err: any) {
        ctx.postMessage({ id, error: err.message || 'Unknown error' });
    }
});

/* ------------------------------------------------------------------ */
/*  Operation Router                                                   */
/* ------------------------------------------------------------------ */

async function handleOp(op: string, params: any): Promise<any> {
    switch (op) {
        case 'load':
            return opLoad(params);
        case 'render':
            return opRender(params);
        case 'add-annotation':
            return opAddAnnotation(params);
        case 'delete-annotation':
            return opDeleteAnnotation(params);
        case 'update-annotation':
            return opUpdateAnnotation(params);
        case 'get-annotation-geometry':
            return opGetAnnotationGeometry(params);
        case 'get-annotations':
            return opGetAnnotations(params);
        case 'apply-redactions':
            return opApplyRedactions(params);
        case 'save':
            return opSave();
        case 'close':
            return opClose();
        default:
            throw new Error(`Unknown editor op: ${op}`);
    }
}

/* ------------------------------------------------------------------ */
/*  Operations                                                         */
/* ------------------------------------------------------------------ */

async function opLoad(params: { buffer: ArrayBuffer }) {
    await ensureMuPDF();

    // Clean up previous document
    if (doc) {
        try { doc.destroy(); } catch { /* ignore */ }
    }

    doc = mupdf.Document.openDocument(new Uint8Array(params.buffer), 'application/pdf');
    pdfDoc = doc.asPDF();
    if (!pdfDoc) throw new Error('Not a valid PDF document');

    const pageCount = doc.countPages();
    const pages: Array<{ width: number; height: number }> = [];

    for (let i = 0; i < pageCount; i++) {
        const page = doc.loadPage(i);
        const bounds = page.getBounds(); // [x1, y1, x2, y2]
        pages.push({
            width: bounds[2] - bounds[0],
            height: bounds[3] - bounds[1],
        });
    }

    return { pageCount, pages };
}

async function opRender(params: { pageIndex: number; dpi?: number }) {
    if (!doc) throw new Error('No document loaded');

    const dpi = params.dpi || 150;
    const scale = dpi / 72;

    const page = doc.loadPage(params.pageIndex);
    const bounds = page.getBounds();
    const pageWidth = bounds[2] - bounds[0];
    const pageHeight = bounds[3] - bounds[1];

    // Render page with annotations to a pixmap
    const pixmap = page.toPixmap(
        mupdf.Matrix.scale(scale, scale),
        mupdf.ColorSpace.DeviceRGB,
        false,  // alpha: false = white background (more efficient, 3 channels)
        true,   // showExtras: render annotations + widgets
    );

    const width = pixmap.getWidth();
    const height = pixmap.getHeight();

    // Encode as PNG — asPNG() returns Uint8Array (already copied from WASM heap)
    const pngBytes = pixmap.asPNG();
    // Transfer as ArrayBuffer for postMessage
    const pngData = pngBytes.buffer.slice(pngBytes.byteOffset, pngBytes.byteOffset + pngBytes.byteLength);

    pixmap.destroy();

    return { pngData, width, height, pageWidth, pageHeight };
}

/* ------------------------------------------------------------------ */
/*  Stamp icon name mapping                                            */
/* ------------------------------------------------------------------ */

const STAMP_ICON_MAP: Record<string, string> = {
    'Approved': 'Approved',
    'Rejected': 'NotApproved',
    'Not Approved': 'NotApproved',
    'Draft': 'Draft',
    'Confidential': 'Confidential',
    'Final': 'Final',
    'Experimental': 'Experimental',
    'For Comment': 'ForComment',
    'Top Secret': 'TopSecret',
    'Expired': 'Expired',
    'Sold': 'Sold',
    'As Is': 'AsIs',
    'Departmental': 'Departmental',
    'For Public Release': 'ForPublicRelease',
    'Not For Public Release': 'NotForPublicRelease',
};

async function opAddAnnotation(params: {
    pageIndex: number;
    type: string;
    rect?: number[];       // [x1, y1, x2, y2] in PDF coords
    color?: number[];      // [r, g, b] 0-1
    interiorColor?: number[];
    opacity?: number;
    contents?: string;
    quadPoints?: number[][]; // array of Quads
    inkList?: number[][][];  // array of strokes, each stroke is array of [x,y] points
    borderWidth?: number;
    fontSize?: number;
    fontName?: string;
    lineEndingStart?: string;
    lineEndingEnd?: string;
    linePoints?: number[];   // [x1,y1, x2,y2] for Line annotation
    vertices?: number[][];   // for Polygon/PolyLine
    imageData?: ArrayBuffer; // for image stamp (PNG/JPEG bytes)
    iconName?: string;       // for Stamp predefined icon
    textColor?: number[];    // [r, g, b] 0-1, for FreeText text color
    transparent?: boolean;   // Skip setColor for transparent FreeText background
}) {
    if (!pdfDoc) throw new Error('No document loaded');

    const page = pdfDoc.loadPage(params.pageIndex);
    const annot = page.createAnnotation(params.type);

    const isTextMarkup = ['Highlight', 'Underline', 'StrikeOut', 'Squiggly'].includes(params.type);
    const isLine = params.type === 'Line';
    const isInk = params.type === 'Ink';

    // --- Set safe universal properties FIRST ---

    // Skip setColor if transparent flag is set (FreeText transparent background)
    if (params.color && !params.transparent) {
        annot.setColor(params.color);
    }

    if (params.interiorColor) {
        annot.setInteriorColor(params.interiorColor);
    }

    if (params.opacity !== undefined) {
        annot.setOpacity(params.opacity);
    }

    if (params.contents) {
        annot.setContents(params.contents);
    }

    if (params.borderWidth !== undefined) {
        annot.setBorderWidth(params.borderWidth);
    }

    // --- Type-specific geometry ---

    // FreeText: set default appearance with user's text color (separate from bg color)
    if (params.type === 'FreeText') {
        const fontName = params.fontName || 'Helv';
        const fontSize = params.fontSize || 12;
        const textColor = params.textColor || [0, 0, 0];
        annot.setDefaultAppearance(fontName, fontSize, textColor);
        // Set rect for FreeText (it supports setRect)
        if (params.rect) {
            annot.setRect(params.rect);
        }
    }

    // Text markup: ONLY setQuadPoints, NO setRect (MuPDF auto-computes rect from quads)
    else if (isTextMarkup) {
        if (params.quadPoints && params.quadPoints.length > 0) {
            annot.setQuadPoints(params.quadPoints);
        }
        // Do NOT call setRect — it throws for text markup types
    }

    // Line: call setLine FIRST (MuPDF auto-computes rect from endpoints), do NOT call setRect
    else if (isLine) {
        if (params.linePoints) {
            annot.setLine(
                [params.linePoints[0], params.linePoints[1]],
                [params.linePoints[2], params.linePoints[3]],
            );
        }
        // Set line ending styles
        if (params.lineEndingStart || params.lineEndingEnd) {
            annot.setLineEndingStyles(
                params.lineEndingStart || 'None',
                params.lineEndingEnd || 'None',
            );
        }
        // Do NOT call setRect — MuPDF computes it from line endpoints
    }

    // Ink: call setInkList FIRST (MuPDF auto-computes rect from strokes), do NOT call setRect
    else if (isInk) {
        if (params.inkList && params.inkList.length > 0) {
            annot.setInkList(params.inkList);
        }
        // Do NOT call setRect — MuPDF computes it from ink strokes
    }

    // Stamp: set icon name for predefined stamps, then rect
    else if (params.type === 'Stamp') {
        // Set icon for predefined stamps
        const iconName = params.iconName || (params.contents ? STAMP_ICON_MAP[params.contents] : undefined);
        if (iconName) {
            try { annot.setIcon(iconName); } catch { /* ignore if unsupported */ }
        }

        // Image stamp
        if (params.imageData) {
            const image = new mupdf.Image(new Uint8Array(params.imageData));
            annot.setStampImage(image);
        }

        if (params.rect) {
            annot.setRect(params.rect);
        }
    }

    // All other types (Square, Circle, Redact, Text/StickyNote, Polygon, PolyLine): setRect is safe
    else {
        if (params.rect) {
            annot.setRect(params.rect);
        }

        // Vertices for Polygon/PolyLine
        if (params.vertices && params.vertices.length > 0) {
            annot.setVertices(params.vertices);
        }
    }

    // Regenerate appearance stream
    annot.update();

    return { success: true };
}

async function opDeleteAnnotation(params: { pageIndex: number; annotIndex: number }) {
    if (!pdfDoc) throw new Error('No document loaded');

    const page = pdfDoc.loadPage(params.pageIndex);
    const annots = page.getAnnotations();

    if (params.annotIndex < 0 || params.annotIndex >= annots.length) {
        throw new Error(`Annotation index ${params.annotIndex} out of range`);
    }

    page.deleteAnnotation(annots[params.annotIndex]);

    return { success: true };
}

async function opUpdateAnnotation(params: {
    pageIndex: number;
    annotIndex: number;
    color?: number[];
    opacity?: number;
    borderWidth?: number;
    contents?: string;
    rect?: number[];
    linePoints?: number[];
    inkList?: number[][][];
    quadPoints?: number[][];
}) {
    if (!pdfDoc) throw new Error('No document loaded');

    const page = pdfDoc.loadPage(params.pageIndex);
    const annots = page.getAnnotations();

    if (params.annotIndex < 0 || params.annotIndex >= annots.length) {
        throw new Error(`Annotation index ${params.annotIndex} out of range`);
    }

    const annot = annots[params.annotIndex];

    if (params.color) {
        annot.setColor(params.color);
    }

    if (params.opacity !== undefined) {
        annot.setOpacity(params.opacity);
    }

    if (params.borderWidth !== undefined) {
        annot.setBorderWidth(params.borderWidth);
    }

    if (params.contents !== undefined) {
        annot.setContents(params.contents);
    }

    // Geometry updates
    if (params.rect) {
        const type = annot.getType();
        const isTextMarkup = ['Highlight', 'Underline', 'StrikeOut', 'Squiggly'].includes(type);
        const isLine = type === 'Line';
        const isInk = type === 'Ink';
        if (!isTextMarkup && !isLine && !isInk) {
            try { annot.setRect(params.rect); } catch { /* ignore */ }
        }
    }

    if (params.linePoints && params.linePoints.length >= 4) {
        try {
            annot.setLine(
                [params.linePoints[0], params.linePoints[1]],
                [params.linePoints[2], params.linePoints[3]],
            );
        } catch { /* ignore */ }
    }

    if (params.inkList) {
        try { annot.setInkList(params.inkList); } catch { /* ignore */ }
    }

    if (params.quadPoints) {
        try { annot.setQuadPoints(params.quadPoints); } catch { /* ignore */ }
    }

    annot.update();

    return { success: true };
}

async function opGetAnnotationGeometry(params: { pageIndex: number; annotIndex: number }) {
    if (!pdfDoc) throw new Error('No document loaded');

    const page = pdfDoc.loadPage(params.pageIndex);
    const annots = page.getAnnotations();

    if (params.annotIndex < 0 || params.annotIndex >= annots.length) {
        throw new Error(`Annotation index ${params.annotIndex} out of range`);
    }

    const annot = annots[params.annotIndex];
    const type = annot.getType();

    let rect: number[] = [0, 0, 0, 0];
    try { rect = annot.getRect(); } catch {
        try { rect = annot.getBounds(); } catch { /* ignore */ }
    }

    let linePoints: number[] | undefined;
    let inkList: number[][][] | undefined;
    let quadPoints: number[][] | undefined;

    if (type === 'Line') {
        try {
            const pts = annot.getLine();
            if (pts && pts.length >= 2) {
                linePoints = [pts[0][0], pts[0][1], pts[1][0], pts[1][1]];
            }
        } catch { /* ignore */ }
    }

    if (type === 'Ink') {
        try { inkList = annot.getInkList(); } catch { /* ignore */ }
    }

    const isTextMarkup = ['Highlight', 'Underline', 'StrikeOut', 'Squiggly'].includes(type);
    if (isTextMarkup) {
        try { quadPoints = annot.getQuadPoints(); } catch { /* ignore */ }
    }

    return { rect, linePoints, inkList, quadPoints };
}

async function opGetAnnotations(params: { pageIndex: number }) {
    if (!pdfDoc) throw new Error('No document loaded');

    const page = pdfDoc.loadPage(params.pageIndex);
    const annots = page.getAnnotations();

    const result = annots.map((a: any, index: number) => {
        // getRect() throws on text markup annotations — fall back to getBounds()
        let rect: number[] = [0, 0, 0, 0];
        try {
            rect = a.getRect();
        } catch {
            try {
                rect = a.getBounds();
            } catch {
                // leave as [0,0,0,0]
            }
        }

        let contents = '';
        try { contents = a.getContents() || ''; } catch { /* ignore */ }

        let color: number[] = [0, 0, 0];
        try { color = a.getColor() || [0, 0, 0]; } catch { /* ignore */ }

        let opacity = 1;
        try { opacity = a.getOpacity(); } catch { /* ignore */ }

        let hasQuadPoints = false;
        try { hasQuadPoints = a.hasQuadPoints(); } catch { /* ignore */ }

        let hasInkList = false;
        try { hasInkList = a.hasInkList(); } catch { /* ignore */ }

        return {
            index,
            type: a.getType(),
            rect,
            contents,
            color,
            opacity,
            hasQuadPoints,
            hasInkList,
        };
    });

    return { annotations: result };
}

async function opApplyRedactions(params: { pageIndex: number }) {
    if (!pdfDoc) throw new Error('No document loaded');

    const page = pdfDoc.loadPage(params.pageIndex);
    page.applyRedactions(true, 2, 1, 0); // blackBoxes, REDACT_IMAGE_REMOVE, LINE_ART_REMOVE_IF_COVERED, TEXT_NONE

    return { success: true };
}

async function opSave() {
    if (!pdfDoc) throw new Error('No document loaded');

    const canIncremental = pdfDoc.canBeSavedIncrementally();
    const options = canIncremental ? 'incremental' : 'compress,garbage=compact';
    const buffer = pdfDoc.saveToBuffer(options);
    const result = new Uint8Array(buffer.asUint8Array()); // Copy out of WASM memory

    return { buffer: result };
}

async function opClose() {
    if (doc) {
        try { doc.destroy(); } catch { /* ignore */ }
        doc = null;
        pdfDoc = null;
    }
    return { success: true };
}

export {};
