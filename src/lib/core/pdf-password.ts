/**
 * PDF Password Helpers (§6.6)
 * 
 * Utilities for checking if a PDF is password-protected and
 * attempting authentication. Uses pdf-lib for detection and
 * MuPDF (via loader) for authenticated operations.
 * 
 * Usage:
 *   const isProtected = await isPdfPasswordProtected(fileBuffer);
 *   const { success, doc } = await authenticateWithPassword(fileBuffer, 'secret');
 */

import { PDFDocument } from 'pdf-lib';

/**
 * Check if a PDF buffer is password-protected.
 * Returns true if the PDF requires a password to open.
 */
export async function isPdfPasswordProtected(buffer: ArrayBuffer): Promise<boolean> {
    try {
        await PDFDocument.load(buffer);
        return false; // Loaded successfully — not protected
    } catch (err: any) {
        // pdf-lib throws on encrypted PDFs
        if (
            err?.message?.includes('encrypted') ||
            err?.message?.includes('password') ||
            err?.message?.includes('Encrypted')
        ) {
            return true;
        }
        throw err; // Re-throw non-password errors
    }
}

/**
 * Attempt to open a password-protected PDF with MuPDF.
 * Returns the authenticated document or throws.
 */
export async function authenticateWithPassword(
    buffer: ArrayBuffer,
    password: string,
): Promise<{ success: boolean; document: any }> {
    const { loadMuPDF } = await import('./mupdf-loader');
    const mupdf = await loadMuPDF();

    try {
        const doc = mupdf.Document.openDocument(
            new Uint8Array(buffer),
            'application/pdf',
        );

        // MuPDF's authenticatePassword returns: 0=failed, 1=no password, 2=user, 4=owner, 6=both
        const authResult = doc.authenticatePassword(password);

        if (authResult === 0) {
            return { success: false, document: null };
        }

        return { success: true, document: doc };
    } catch (err) {
        return { success: false, document: null };
    }
}

/**
 * Simple password strength indicator.
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    if (password.length < 6) return 'weak';

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 4) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
}
