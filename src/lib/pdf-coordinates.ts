/**
 * PDF Coordinate Utilities
 *
 * Converts between browser screen coordinates (top-left origin, pixels)
 * and MuPDF coordinates (top-left origin, points at 72 DPI).
 *
 * MuPDF uses a top-left origin coordinate system (Y increases downward),
 * unlike the standard PDF spec (bottom-left origin). Since the editor
 * exclusively uses MuPDF for rendering and annotations, all conversions
 * target MuPDF's coordinate space.
 */

export interface Point {
    x: number;
    y: number;
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Convert screen canvas coordinates to MuPDF coordinate space.
 * Both canvas and MuPDF use top-left origin, so only scaling is needed.
 *
 * @param x - canvas x in pixels
 * @param y - canvas y in pixels
 * @param _pageHeight - unused (kept for API compat, will be removed)
 * @param scale - rendering scale (DPI / 72)
 */
export function screenToPdf(x: number, y: number, _pageHeight: number, scale: number): Point {
    return {
        x: x / scale,
        y: y / scale,
    };
}

/**
 * Convert MuPDF coordinates to screen canvas coordinates.
 *
 * @param x - MuPDF x in points
 * @param y - MuPDF y in points (top-left origin)
 * @param _pageHeight - unused (kept for API compat, will be removed)
 * @param scale - rendering scale (DPI / 72)
 */
export function pdfToScreen(x: number, y: number, _pageHeight: number, scale: number): Point {
    return {
        x: x * scale,
        y: y * scale,
    };
}

/**
 * Convert a screen-space rectangle to MuPDF quad points.
 * Quad points define the four corners of a region,
 * ordered as: [x1,y1, x2,y2, x3,y3, x4,y4]
 * (top-left, top-right, bottom-left, bottom-right)
 *
 * This is the format used by highlight/underline/strikethrough annotations.
 */
export function rectToQuadPoints(rect: Rect, _pageHeight: number, scale: number): number[] {
    const tl = screenToPdf(rect.x, rect.y, 0, scale);
    const br = screenToPdf(rect.x + rect.width, rect.y + rect.height, 0, scale);

    // QuadPoints order for MuPDF: top-left, top-right, bottom-left, bottom-right
    return [
        tl.x, tl.y,       // top-left
        br.x, tl.y,       // top-right
        tl.x, br.y,       // bottom-left
        br.x, br.y,       // bottom-right
    ];
}

/**
 * Convert a screen-space rectangle to a MuPDF-space rectangle [x, y, width, height]
 * where x,y is the top-left corner (MuPDF origin).
 */
export function screenRectToPdfRect(rect: Rect, _pageHeight: number, scale: number): Rect {
    return {
        x: rect.x / scale,
        y: rect.y / scale,
        width: rect.width / scale,
        height: rect.height / scale,
    };
}
