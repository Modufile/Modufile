#!/usr/bin/env node
/**
 * copy-wasm.js
 *
 * Copies WASM binaries and their JS loaders from node_modules into public/.
 * Run automatically via `predev` and `prebuild`, or manually: npm run copy:wasm
 *
 * What this copies:
 *   mupdf                    → public/mupdf.js, public/mupdf-wasm.js, public/mupdf-wasm.wasm
 *   pdfjs-dist               → public/pdf.worker.min.js
 *   @bentopdf/gs-wasm        → public/wasm/gs/   (dist/ + types/ + assets/)
 *   @bentopdf/pymupdf-wasm   → public/wasm/pymupdf/ (dist/ + types/ + assets/)
 *   @imagemagick/magick-wasm → public/magick.wasm
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const nodeModules = path.join(root, 'node_modules');
const publicDir = path.join(root, 'public');

let ok = 0;
let warn = 0;

// ── helpers ──────────────────────────────────────────────────────────────────

function copyFile(src, dst) {
    if (!fs.existsSync(src)) {
        console.warn(`  ⚠  not found: ${path.relative(root, src)}`);
        warn++;
        return false;
    }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log(`  ✓  ${path.relative(root, src)}  →  ${path.relative(root, dst)}`);
    ok++;
    return true;
}

function copyDir(srcDir, dstDir) {
    if (!fs.existsSync(srcDir)) {
        console.warn(`  ⚠  directory not found: ${path.relative(root, srcDir)}`);
        warn++;
        return false;
    }
    fs.mkdirSync(dstDir, { recursive: true });
    let count = 0;
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const src = path.join(srcDir, entry.name);
        const dst = path.join(dstDir, entry.name);
        if (entry.isDirectory()) {
            copyDir(src, dst);
        } else {
            fs.copyFileSync(src, dst);
            count++;
        }
    }
    console.log(`  ✓  ${path.relative(root, srcDir)}/  →  ${path.relative(root, dstDir)}/  (${count} files)`);
    ok++;
    return true;
}

// ── 1. MuPDF ─────────────────────────────────────────────────────────────────

console.log('\n[1/5] MuPDF');
const mupdfSrc = path.join(nodeModules, 'mupdf', 'dist');
for (const f of ['mupdf.js', 'mupdf-wasm.js', 'mupdf-wasm.wasm']) {
    copyFile(path.join(mupdfSrc, f), path.join(publicDir, f));
}

// ── 2. PDF.js worker ─────────────────────────────────────────────────────────

console.log('\n[2/5] PDF.js worker');
copyFile(
    path.join(nodeModules, 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
    path.join(publicDir, 'pdf.worker.min.js')
);

// ── 3. Ghostscript WASM (@bentopdf/gs-wasm) ──────────────────────────────────

console.log('\n[3/5] Ghostscript WASM  (@bentopdf/gs-wasm)');
const gsSrc = path.join(nodeModules, '@bentopdf', 'gs-wasm');
if (fs.existsSync(gsSrc)) {
    const gsDst = path.join(publicDir, 'wasm', 'gs');
    copyDir(path.join(gsSrc, 'dist'),   path.join(gsDst, 'dist'));
    copyDir(path.join(gsSrc, 'types'),  path.join(gsDst, 'types'));
    if (fs.existsSync(path.join(gsSrc, 'assets'))) {
        copyDir(path.join(gsSrc, 'assets'), path.join(gsDst, 'assets'));
    } else {
        console.warn('  ⚠  assets/ not found in @bentopdf/gs-wasm (PDF Compress will not work)');
        warn++;
    }
} else {
    console.warn('  ⚠  @bentopdf/gs-wasm not installed — run: npm install @bentopdf/gs-wasm');
    console.warn('     PDF Compress tool will not work without this package.');
    warn++;
}

// ── 4. PyMuPDF WASM (@bentopdf/pymupdf-wasm) ─────────────────────────────────

console.log('\n[4/5] PyMuPDF WASM  (@bentopdf/pymupdf-wasm)');
const pymupdfSrc = path.join(nodeModules, '@bentopdf', 'pymupdf-wasm');
if (fs.existsSync(pymupdfSrc)) {
    const pymupdfDst = path.join(publicDir, 'wasm', 'pymupdf');
    copyDir(path.join(pymupdfSrc, 'dist'),  path.join(pymupdfDst, 'dist'));
    copyDir(path.join(pymupdfSrc, 'types'), path.join(pymupdfDst, 'types'));
    if (fs.existsSync(path.join(pymupdfSrc, 'assets'))) {
        copyDir(path.join(pymupdfSrc, 'assets'), path.join(pymupdfDst, 'assets'));
    } else {
        console.warn('  ⚠  assets/ not found in @bentopdf/pymupdf-wasm (PDF→Word/Excel will not work)');
        warn++;
    }
} else {
    console.warn('  ⚠  @bentopdf/pymupdf-wasm not installed — run: npm install @bentopdf/pymupdf-wasm');
    console.warn('     PDF→Word and PDF→Excel tools will not work without this package.');
    warn++;
}

// ── 5. ImageMagick WASM (@imagemagick/magick-wasm) ───────────────────────────

console.log('\n[5/5] ImageMagick WASM  (@imagemagick/magick-wasm)');
const magickSrc = path.join(nodeModules, '@imagemagick', 'magick-wasm', 'dist', 'magick.wasm');
copyFile(magickSrc, path.join(publicDir, 'magick.wasm'));

// ── summary ──────────────────────────────────────────────────────────────────

console.log(`\n── copy:wasm complete  ✓ ${ok} copied  ⚠ ${warn} warnings ──\n`);
if (warn > 0) process.exit(0); // Warnings are non-fatal; missing optional packages are expected
