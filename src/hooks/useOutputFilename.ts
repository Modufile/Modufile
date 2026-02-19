/**
 * useOutputFilename Hook (§6.5)
 * 
 * Provides an editable output filename with intelligent defaults
 * and sanitization. Strips unsafe characters, enforces extension.
 * 
 * Usage:
 *   const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(
 *     'document.pdf',
 *     '_compressed',
 *   );
 *   // outputFilename = "document_compressed.pdf"
 *   // User can edit it
 *   // sanitized always returns a safe filename
 */

'use client';

import { useState, useMemo, useCallback } from 'react';

/**
 * Sanitize a filename for safe download.
 * Removes/replaces unsafe characters, enforces max length.
 */
function sanitizeFilename(name: string): string {
    return name
        // Remove null bytes and control characters
        .replace(/[\x00-\x1F\x7F]/g, '')
        // Replace unsafe filesystem characters
        .replace(/[<>:"/\\|?*]/g, '_')
        // Collapse multiple underscores/hyphens
        .replace(/[_-]{2,}/g, '_')
        // Trim whitespace and dots from edges
        .replace(/^[\s.]+|[\s.]+$/g, '')
        // Enforce max length (255 bytes is typical filesystem limit)
        .slice(0, 200);
}

/**
 * Generate a default output filename from the input filename and a suffix.
 */
function generateDefault(inputName: string, suffix: string): string {
    const ext = inputName.includes('.') ? '.' + inputName.split('.').pop() : '';
    const base = inputName.replace(/\.[^.]+$/, '');
    return `${base}${suffix}${ext}`;
}

interface UseOutputFilenameReturn {
    /** Current filename (user-editable) */
    outputFilename: string;
    /** Update the filename */
    setOutputFilename: (name: string) => void;
    /** Get the sanitized version (safe for download) */
    sanitized: string;
    /** Reset to default */
    reset: () => void;
}

export function useOutputFilename(
    inputFilename: string,
    suffix = '_output',
): UseOutputFilenameReturn {
    const defaultName = generateDefault(inputFilename, suffix);
    const [outputFilename, setOutputFilename] = useState(defaultName);

    const sanitized = useMemo(
        () => sanitizeFilename(outputFilename) || 'output',
        [outputFilename],
    );

    const reset = useCallback(() => {
        setOutputFilename(defaultName);
    }, [defaultName]);

    return { outputFilename, setOutputFilename, sanitized, reset };
}
