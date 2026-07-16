/**
 * exif.ts — Lossless image metadata removal (Layer 3, no dependencies).
 *
 * Strips metadata by removing whole file segments/chunks — pixel data is
 * untouched, so there is zero quality loss (unlike canvas re-encoding).
 *
 * JPEG: drops APP1 (EXIF/GPS/XMP), APP13 (IPTC/Photoshop) and COM segments.
 *       Keeps APP0 (JFIF), APP2 (ICC color profile), APP14 (Adobe) so the
 *       image renders identically.
 * PNG:  drops tEXt/zTXt/iTXt (text), eXIf and tIME chunks.
 */

const JPEG_STRIP_MARKERS = new Set([0xe1, 0xed, 0xfe]); // APP1, APP13, COM
const PNG_STRIP_CHUNKS = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']);

export function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        throw new Error('Not a JPEG file');
    }

    const parts: Uint8Array[] = [bytes.slice(0, 2)]; // SOI
    let offset = 2;

    while (offset + 4 <= bytes.length) {
        if (bytes[offset] !== 0xff) break; // malformed — keep the rest as-is
        const marker = bytes[offset + 1];

        // SOS: entropy-coded image data follows — copy everything from here
        if (marker === 0xda) {
            parts.push(bytes.slice(offset));
            offset = bytes.length;
            break;
        }

        const length = (bytes[offset + 2] << 8) | bytes[offset + 3]; // includes the 2 length bytes
        const segmentEnd = offset + 2 + length;
        if (length < 2 || segmentEnd > bytes.length) break;

        if (!JPEG_STRIP_MARKERS.has(marker)) {
            parts.push(bytes.slice(offset, segmentEnd));
        }
        offset = segmentEnd;
    }

    if (offset < bytes.length) parts.push(bytes.slice(offset));

    const total = parts.reduce((sum, p) => sum + p.length, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    for (const part of parts) {
        out.set(part, pos);
        pos += part.length;
    }
    return out;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function stripPngMetadata(bytes: Uint8Array): Uint8Array {
    if (bytes.length < 8 || !PNG_SIGNATURE.every((b, i) => bytes[i] === b)) {
        throw new Error('Not a PNG file');
    }

    const parts: Uint8Array[] = [bytes.slice(0, 8)];
    let offset = 8;

    while (offset + 12 <= bytes.length) {
        const length =
            (bytes[offset] << 24) | (bytes[offset + 1] << 16) |
            (bytes[offset + 2] << 8) | bytes[offset + 3];
        const type = String.fromCharCode(
            bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7],
        );
        const chunkEnd = offset + 12 + length;
        if (length < 0 || chunkEnd > bytes.length) break;

        if (!PNG_STRIP_CHUNKS.has(type)) {
            parts.push(bytes.slice(offset, chunkEnd));
        }
        offset = chunkEnd;
        if (type === 'IEND') break;
    }

    const total = parts.reduce((sum, p) => sum + p.length, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    for (const part of parts) {
        out.set(part, pos);
        pos += part.length;
    }
    return out;
}

/** Returns stripped bytes, or null if the format isn't supported for lossless stripping. */
export function stripImageMetadata(bytes: Uint8Array, mimeType: string): Uint8Array | null {
    if (mimeType === 'image/jpeg') return stripJpegMetadata(bytes);
    if (mimeType === 'image/png') return stripPngMetadata(bytes);
    return null;
}

export function supportsLosslessStrip(mimeType: string): boolean {
    return mimeType === 'image/jpeg' || mimeType === 'image/png';
}
