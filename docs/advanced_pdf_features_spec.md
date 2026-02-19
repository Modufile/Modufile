# Advanced PDF Features — Implementation Specification v2

**Objective:** Implement professional-grade PDF tools entirely client-side, prioritizing privacy (Zero-Knowledge) and performance.  
**License:** AGPL 3.0 — Public GitHub repo required. Link source in site footer.  
**Stack:** Next.js · React · Tailwind CSS · TypeScript  

---

## 0. Pre-Implementation Checklist

Before writing any feature code, complete these foundation steps in order.

- [ ] Delete `public/lib/mupdf/` directory (old manual approach)
- [ ] Add WASM copy script to `package.json` (see §1.3)
- [ ] Install all new dependencies (see §1.2)
- [ ] Register Service Worker (see §3)
- [ ] Set up OPFS staging utility (see §4)
- [ ] Build `useOutputFilename` hook + filename sanitizer (see §6.5)
- [ ] Build `pdf-password.ts` helpers + password prompt modal (see §6.6)
- [ ] Migrate existing Redact tool (see §9)

---

## 1. Core Architecture

### 1.1 Module Structure

```
src/
  workers/
    pdf-core.worker.ts        # mupdf: render, redact, repair, encrypt, extract, convert
    pdf-compress.worker.ts    # @jspawn/ghostscript-wasm: compression (lazy, ~18MB WASM)
    ocr.worker.ts             # tesseract.js
    office.worker.ts          # docx, xlsx, pptxgenjs: PDF→Office extraction & generation
    office-zeta.worker.ts     # zetajs + ZetaOffice WASM: Office→PDF (sole conversion path, ~50MB, lazy)
    image-optimize.worker.ts  # browser Canvas + @squoosh/lib codecs
  lib/
    pdf-engine.ts             # Routes tasks to correct worker, exposes unified API
    pdf-password.ts           # checkPdfPassword(), authenticateWithPassword() helpers
    worker-pool.ts            # Reusable worker instances, operation queue, concurrency cap
    opfs-staging.ts           # Streams large files (>50MB) through Origin Private File System
    progress-bus.ts           # EventEmitter for Worker → UI progress reporting
  hooks/
    usePdfWorker.ts           # React hook — call worker ops from components
    useFileStaging.ts         # React hook — OPFS read/write with progress
    useOutputFilename.ts      # Editable output filename with smart defaults (see §6.5)
  sw.ts                       # Service Worker: WASM asset caching + offline support
```

### 1.2 Final Dependency Stack

| Purpose | Package | License | Notes |
|---|---|---|---|
| PDF engine + page rendering | `mupdf` | AGPL 3.0 | Official Artifex npm package — handles all rendering |
| PDF compression | `@jspawn/ghostscript-wasm` | AGPL 3.0 | Lazy-loaded, ~18MB WASM |
| PDF lightweight edits | `pdf-lib` | MIT | Merge, split, metadata, image-to-PDF |
| OCR | `tesseract.js` | Apache 2.0 | ~10MB lang data cached via OPFS |
| Word generation | `docx` | MIT | PDF→DOCX output only |
| Word parsing | `mammoth` | MIT | DOCX→HTML for content preview only — NOT used for PDF conversion |
| Excel | `xlsx` (SheetJS) | Apache 2.0 | |
| PowerPoint | `pptxgenjs` | MIT | |
| Office→PDF | `zetajs` + ZetaOffice CDN | MIT (zetajs) / MPL 2.0 (WASM) | LibreOffice WASM, ~50MB, lazy-loaded — sole conversion engine |
| Image optimization | `@squoosh/lib` | Apache 2.0 | MozJPEG/WebP/AVIF codecs |
| Zip output | `fflate` | MIT | Replaces JSZip — 3-5× faster, smaller |
| Drag & drop | `dnd-kit` | MIT | Already in stack |
| State | `zustand` | MIT | Already in stack |
| Storage | `idb` | ISC | Already in stack |

> **Remove:** `jszip` (replaced by `fflate`), `pdfjs-dist` (MuPDF handles all rendering), `@react-pdf/renderer` (ZetaJS replaces it entirely). Do not add `html2canvas`, `jsPDF`, or any iframe print logic.

### 1.3 WASM Asset Pipeline

Add to `package.json` scripts to copy WASM files to `public/` at build time:

```json
{
  "scripts": {
    "copy:wasm": "cp node_modules/mupdf/dist/mupdf.wasm public/mupdf.wasm",
    "prebuild": "npm run copy:wasm",
    "predev": "npm run copy:wasm"
  }
}
```

In `next.config.ts`, allow WASM imports and configure headers:

```ts
const nextConfig = {
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  async headers() {
    return [
      {
        // WASM files: immutable cache, correct MIME type
        source: '/:path*.wasm',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'application/wasm' },
        ],
      },
      {
        // Cross-origin isolation: required by ZetaJS (LibreOffice WASM uses SharedArrayBuffer)
        // Also benefits MuPDF and Ghostscript WASM thread performance
        // WARNING: COOP: same-origin breaks cross-origin OAuth popups and payment widgets.
        // If you have OAuth login (Google, GitHub, etc), test carefully — those popup flows
        // may need to be replaced with redirect-based flows.
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};
```

> **COOP/COEP Side-effect:** These headers enable `SharedArrayBuffer` which WASM threads require, but they break cross-origin popup flows. If your app uses OAuth login via popups (Google Sign-In, GitHub, etc.), switch to redirect-based auth flows before adding these headers. Third-party embeds (chat widgets, analytics iframes) may also break — audit all cross-origin resources you load.

### 1.4 Dependency Strategy

| Library | Use For | Do NOT Use For |
|---|---|---|
| `mupdf` | Render pages, redact, repair, encrypt, extract text, PDF/A, convert, page previews | Nothing — this is the single PDF engine |
| `pdf-lib` | Merge, split, rotate, metadata, watermark, image-to-PDF | Encryption (broken AES-256), rendering, heavy ops |
| `@jspawn/ghostscript-wasm` | Compression only — lazy loaded on demand | Anything else |
| `zetajs` (ZetaOffice WASM) | Office→PDF exclusively — DOCX, XLSX, PPTX all go through this | Any PDF operation — use MuPDF instead |

---

## 2. Worker Architecture

### 2.1 Worker Pool (`src/lib/worker-pool.ts`)

Do not spin up a new Worker per operation. Pre-instantiate one of each Worker type and queue operations.

```ts
// Conceptual interface — implement with a simple queue + postMessage
interface WorkerPool {
  run<T>(workerType: WorkerType, operation: string, payload: unknown): Promise<T>;
  cancel(operationId: string): void;
  getStatus(workerType: WorkerType): 'idle' | 'busy';
}
```

**Concurrency rules:**
- Max 1 `pdf-compress.worker` running at a time (Ghostscript is memory-intensive)
- Max 2 `pdf-core.worker` instances (allow parallel page rendering)
- Max 1 `ocr.worker` (Tesseract holds significant memory)
- Max 1 `office-zeta.worker` — ZetaOffice holds an entire LibreOffice instance (~200-400MB) in WASM memory. Never run two simultaneously. Call `worker.terminate()` after the user's session ends to release memory.

### 2.2 Progress Reporting

Every worker must emit progress events via `postMessage` on every significant unit of work (per page, per image, per stage). UI components subscribe via `usePdfWorker` hook.

```ts
// Standard progress message shape from any worker
interface WorkerProgress {
  operationId: string;
  stage: string;       // e.g. "Extracting images", "Re-compressing page 3/12"
  percent: number;     // 0–100
  done: boolean;
}
```

### 2.3 Cancellation

Pass an `AbortController` signal to each operation. Workers check `signal.aborted` between page-level operations and terminate early, posting a `{ cancelled: true }` message.

---

## 3. Service Worker (`src/sw.ts`)

Cache all WASM files on first load. This is a privacy-first app's biggest trust differentiator: users download the engine once, then work fully offline forever.

**Cache strategy:**
- WASM files (`mupdf.wasm`, `ghostscript.wasm`, `tesseract-core.wasm`): `CacheFirst`, immutable, versioned by filename hash
- Tesseract language data (`eng.traineddata` etc.): downloaded to **OPFS** on first OCR use (not SW cache — too large and user-selectable)
- App shell (JS/CSS): `StaleWhileRevalidate`

**Registration:** Add to `src/app/layout.tsx`:

```ts
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

Show a preparation screen on first feature use (see §6.1). MuPDF should begin fetching silently in the background the moment any PDF tool page loads — so it's ready before the user needs it.

---

## 4. OPFS Staging (`src/lib/opfs-staging.ts`)

For files over 50MB, do not load the entire ArrayBuffer into memory. Stream through the Origin Private File System.

```ts
// Core API to implement
async function stageFile(file: File): Promise<FileSystemFileHandle>
async function readStaged(handle: FileSystemFileHandle): Promise<ReadableStream>
async function clearStaged(handle: FileSystemFileHandle): Promise<void>
```

**Rules:**
- Always call `clearStaged()` in a `finally` block after processing
- Check `navigator.deviceMemory` — on devices < 4GB, lower the threshold to 25MB
- Disable Ghostscript compression entirely on devices < 4GB RAM; offer MuPDF-only compression as fallback with a clear warning in the UI

---

## 5. Feature Implementation

### 5.1 📉 Compress PDF

**Worker:** `pdf-compress.worker.ts`  
**Engine:** `@jspawn/ghostscript-wasm` (primary) → MuPDF-only fallback on low-memory devices

**Quality Presets (map to Ghostscript `-dPDFSETTINGS`):**

| UI Label | GS Setting | Image DPI | Use Case |
|---|---|---|---|
| Screen | `/screen` | 72 dpi | Email, web sharing |
| eBook | `/ebook` | 150 dpi | General purpose |
| Print | `/printer` | 300 dpi | High quality, archive |

**Implementation steps:**
1. Lazy-load Ghostscript WASM only when user clicks "Compress" (do not prefetch)
2. Show one-time download progress: *"Downloading compression engine (18MB)…"*
3. Stage file to OPFS if > 50MB
4. Run Ghostscript with chosen preset
5. Display before/after file size with percentage reduction
6. On devices with `navigator.deviceMemory < 4`, skip Ghostscript entirely — run MuPDF compress (load/save with stream optimization) and warn user: *"Max Compression unavailable on this device. Using Standard mode."*

**Two-pass optimization for large files (optional, advanced):**
Run `@squoosh/lib` MozJPEG/WebP recompression on extracted images in `image-optimize.worker.ts` *before* Ghostscript pass. Marginal gains on already-compressed inputs, significant on PDFs with PNG images.

---

### 5.2 📄 PDF → Office (Word / Excel / PPT)

**Worker:** `office-zeta.worker.ts` (ZetaJS — same engine as §5.3, bidirectional)  
**Engine:** ZetaJS (ZetaOffice WASM) with `writer_pdf_import` filter for PDF ingestion  
**Do NOT use:** Manual MuPDF text extraction + docx/xlsx/pptxgenjs reconstruction. This approach cannot handle complex layouts, tables, or images reliably.

**UI Disclaimer (mandatory):** Display before conversion starts:  
> *"Works best with text-heavy PDFs. Complex layouts, tables, and scanned documents may not convert perfectly — this is a limitation of the PDF format itself, not a bug."*

#### Why ZetaOffice (not MuPDF extraction)

LibreOffice has a mature PDF import engine (`writer_pdf_import` filter) that handles:
- Tables with correct cell structure
- Embedded images with positioning
- Multi-column layouts
- Font matching and sizing
- Headers, footers, and page structure

Manual reconstruction with MuPDF `toStructuredText()` + `docx` library requires hundreds of lines of heuristic code for column detection, table detection, and image embedding — and still produces inferior results. ZetaOffice does all of this natively because it IS LibreOffice.

#### PDF → Word
1. Worker sends PDF bytes to ZetaOffice with import filter `writer_pdf_import`
2. ZetaOffice opens PDF as an editable Writer document
3. Export via `MS Word 2007 XML` filter → produces `.docx`
4. Download result

#### PDF → Excel
1. Worker sends PDF bytes to ZetaOffice with import filter `writer_pdf_import`
2. ZetaOffice opens PDF as editable document → copy content to Calc context
3. Export via `Calc MS Excel 2007 XML` filter → produces `.xlsx`
4. Download result
*(Note: PDF→Excel works best with PDFs containing clear tabular data. ZetaOffice imports into Writer first, so complex spreadsheet layouts may need manual adjustment.)*

#### PDF → PowerPoint
1. Worker sends PDF bytes to ZetaOffice with import filter `writer_pdf_import`
2. Export via `Impress MS PowerPoint 2007 XML` filter → produces `.pptx`
3. Download result
*(Note: Each PDF page becomes a slide. Layout is preserved but text may be in text boxes rather than native slide text — this is inherent to the PDF→editable conversion.)*

---

### 5.3 📥 Office → PDF

**Worker:** `office-zeta.worker.ts`  
**Engine:** ZetaJS (ZetaOffice WASM) — sole conversion path for all Office formats  
**Do NOT use:** `@react-pdf/renderer`, `html2canvas`, `jsPDF`, `iframe window.print()`

ZetaJS runs the full LibreOffice engine compiled to WASM (~50MB, one-time download). It handles DOCX, XLSX, and PPTX with the same fidelity as LibreOffice desktop — tracked changes, footnotes, charts, embedded objects, complex tables, all formats work correctly. No validation, no fallback, no guessing — LibreOffice either converts it or throws a real error.

---

#### Required HTTP Headers

ZetaJS uses `SharedArrayBuffer` for WASM threading — these headers must be set (already configured in §1.3):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

#### Worker Setup (`src/workers/office-zeta.worker.ts`)

ZetaJS must run in its own dedicated Worker — never share with other workers. The `zeta.js` script **must** be first in `Module.uno_scripts`. All processing happens inside the Worker thread, never the main thread.

```ts
// office-zeta.worker.ts
const ZETA_CDN = 'https://cdn.zetaoffice.net/zetaoffice_latest/';

let zetaInstance: any = null;

async function getZeta(): Promise<any> {
  if (zetaInstance) return zetaInstance;  // reuse across conversions in same session

  return new Promise((resolve, reject) => {
    (globalThis as any).Module = {
      // zeta.js MUST be listed first
      uno_scripts: [`${ZETA_CDN}zeta.js`],
      onRuntimeInitialized() {
        zetaInstance = (globalThis as any).Module.zetajs;
        resolve(zetaInstance);
      },
      onAbort(reason: string) {
        reject(new Error(`ZetaOffice WASM aborted: ${reason}`));
      },
    };
    // Load ZetaOffice WASM runtime — triggers the ~50MB download on first use
    importScripts(`${ZETA_CDN}soffice.js`);
  });
}
```

---

#### Conversion Function

```ts
// Filter names map — LibreOffice export filter per format
const FILTERS: Record<string, string> = {
  docx: 'writer_pdf_Export',
  doc:  'writer_pdf_Export',
  odt:  'writer_pdf_Export',
  xlsx: 'calc_pdf_Export',
  xls:  'calc_pdf_Export',
  ods:  'calc_pdf_Export',
  pptx: 'impress_pdf_Export',
  ppt:  'impress_pdf_Export',
  odp:  'impress_pdf_Export',
};

async function convertToPdf(
  fileBuffer: ArrayBuffer,
  fileName: string
): Promise<ArrayBuffer> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const filterName = FILTERS[ext];
  if (!filterName) throw new Error(`Unsupported format: .${ext}`);

  const zeta = await getZeta();
  const css = zeta.uno.com.sun.star;

  const inputPath = `/tmp/${fileName}`;
  const outputPath = `/tmp/output.pdf`;

  // Write input to ZetaOffice virtual filesystem
  zeta.FS.writeFile(inputPath, new Uint8Array(fileBuffer));

  try {
    // Load document headlessly — Hidden:true suppresses any UI rendering
    const desktop = css.frame.Desktop.create(zeta.getUnoComponentContext());
    const xModel = desktop.loadComponentFromURL(
      `file://${inputPath}`,
      '_blank',
      0,
      [{ Name: 'Hidden', Value: true }]
    );

    // Export to PDF using native LibreOffice filter
    xModel.storeToURL(`file://${outputPath}`, [
      { Name: 'FilterName', Value: filterName },
    ]);
    xModel.close(true);

    // Read and return the output PDF
    const pdfBytes = zeta.FS.readFile(outputPath);
    return pdfBytes.buffer as ArrayBuffer;

  } finally {
    // Always clean up virtual FS — ZetaOffice holds WASM memory
    try { zeta.FS.unlink(inputPath); } catch {}
    try { zeta.FS.unlink(outputPath); } catch {}
  }
}

// Message handler — receives jobs from worker-pool.ts
self.onmessage = async (e) => {
  const { operationId, fileBuffer, fileName } = e.data;
  try {
    postMessage({ operationId, stage: 'Converting…', percent: 10 });
    const pdfBuffer = await convertToPdf(fileBuffer, fileName);
    postMessage({ operationId, result: pdfBuffer, done: true }, [pdfBuffer]);
  } catch (err: any) {
    postMessage({ operationId, error: err.message, done: true });
  }
};
```

---

#### Key Implementation Notes

**`Hidden: true` is mandatory** — without it, LibreOffice attempts to render a UI canvas that doesn't exist in a Worker context and stalls indefinitely.

**Filter name determines output quality** — using the wrong filter (e.g. `writer_pdf_Export` on a spreadsheet) produces a corrupt or empty PDF. The `FILTERS` map above handles all common extensions correctly.

**Reuse the ZetaOffice instance** — do not call `getZeta()` and spin up a new LibreOffice instance per file. The `zetaInstance` singleton persists across conversions in the same Worker session. Cold start is ~3-5 seconds after WASM is cached; subsequent conversions in the same session start instantly.

**Terminate after session** — once the user's conversion session is done (tab closed, feature unmounted), call `worker.terminate()` from the worker pool to release the ~200-400MB of WASM memory LibreOffice holds. Never keep it running in the background.

**Transfer `pdfBuffer` as Transferable** — note the `postMessage(..., [pdfBuffer])` second argument. This transfers ownership of the ArrayBuffer to the main thread without copying it, which matters for large PDFs.

---

#### UX Flow

1. User uploads DOCX/XLSX/PPTX file
2. If ZetaOffice not yet cached: show §6.1 "Preparing Office Engine" screen  
   *"Setting up the document conversion library (~50MB). This only happens once."*
3. Once ready (or already cached): show progress — *"Converting document…"*
4. On success: trigger download as `.pdf`
5. On error: show the LibreOffice error message directly — it's specific and actionable  
   e.g. *"File format not supported"* or *"Document is password protected"*

---

### 5.4 🖼 PDF ↔ Image

#### PDF → JPG / PNG / WebP
**Worker:** `pdf-core.worker.ts`  
**Engine:** MuPDF exclusively — faster and more color-accurate than pdfjs-dist, no redundant dependency needed

1. User selects DPI (72 / 150 / 300) and format (JPEG / PNG / WebP)
2. MuPDF: `page.toPixmap(matrix, colorspace)` → raw pixel buffer → paint to Canvas
3. `canvas.toBlob({ type: 'image/webp', quality: 0.9 })`
4. Single page: direct download. Multiple pages: zip with `fflate` → download as `.zip`
5. Show per-page progress: *"Converting page 3 of 12…"*

#### Image → PDF
**Engine:** `pdf-lib`

1. Accept: JPG, PNG, WebP, AVIF, GIF, TIFF (convert TIFF/AVIF to PNG via Canvas first)
2. Layout options: Fit to Page, Original Size, Custom margins
3. `pdf-lib`: `page.drawImage()` per image
4. Download as `.pdf`

---

### 5.5 🔐 Security & Repair

**Engine:** MuPDF exclusively. Do not use `pdf-lib` for any encryption operation.

#### Unlock PDF
1. Prompt user for password
2. MuPDF: `Document.openDocument(buffer, password)` → if authenticated, `save()` without encryption flags
3. Download clean, unlocked PDF

#### Protect PDF
1. User sets: open password, permissions password, permission flags (print, copy, edit)
2. MuPDF: apply AES-256 encryption on save
3. Download protected PDF

#### Repair PDF
1. Load damaged file with MuPDF (`openDocument` automatically attempts xref reconstruction)
2. Re-save → the act of loading + saving with MuPDF heals most corruption
3. Download repaired PDF
4. If MuPDF fails to load: show error with specific message from MuPDF exception

#### PDF/A Conversion
1. MuPDF: enforce PDF/A-1b or PDF/A-2b standard on save (embed all fonts, convert color profiles)
2. Validate output with MuPDF's built-in validator
3. Download conformant PDF/A file

---

### 5.6 📱 Scan to PDF

**Engine:** Browser Canvas (pure JS filter) + `pdf-lib`

1. **Input:** `<input type="file" accept="image/*" capture="environment">` for mobile camera, or `navigator.mediaDevices.getUserMedia` for live capture
2. **Image enhancement pipeline (Canvas):**
   - Grayscale conversion
   - Adaptive thresholding (Sauvola method — handles uneven lighting)  
   - Contrast boost (levels adjustment)
   - Optional: deskew (detect dominant line angle via Hough transform, rotate canvas)
3. Show before/after preview with toggle
4. `pdf-lib`: `page.drawImage()` per scan → download as `.pdf`

**Enhancement library note:** If deskew quality is insufficient with pure Canvas, consider adding `opencv.js` WASM (lazy-loaded) for perspective correction — this is a strong differentiator for a scan feature but adds ~8MB.

---

### 5.7 🔎 OCR PDF

**Worker:** `ocr.worker.ts`  
**Engine:** MuPDF (rasterize) + `tesseract.js` (recognize) + MuPDF (text layer)

1. **Language selection:** Let user choose language(s) before starting. Download `[lang].traineddata` to OPFS on first selection (not re-downloaded on subsequent uses)
2. **Rasterize:** MuPDF renders each page to Canvas at 200dpi (balance of accuracy vs speed)
3. **Recognize:** `Tesseract.recognize(canvas, lang, { logger: progressCallback })` per page
4. **Text layer composition:** Use MuPDF to write an invisible text layer over the original (preserves original visual appearance, adds searchable text)
5. **Progress:** Per-page progress — *"OCR: page 4 of 10 (42%)"*
6. Download searchable PDF

**Language data caching:**
```
OPFS/
  tessdata/
    eng.traineddata   (~10MB)
    fra.traineddata   (~12MB)
    deu.traineddata   (~12MB)
```

---

## 6. UI/UX Implementation Standards

### 6.1 WASM Engine Preparation UX

When a user triggers a feature that requires a WASM module for the first time, replace the tool's content area with a full preparation screen. This is a **one-time experience per engine per device** — after the Service Worker caches the file, subsequent loads are instant and this screen never appears again.

**Design intent:** Frame it as the tool being assembled for the user, not as a loading wait. The language should feel purposeful and precise, like a lab being set up.

**Copy per engine (use the appropriate line for each feature):**

| Engine | Headline | Subtext |
|---|---|---|
| MuPDF (`mupdf.wasm`, ~8MB) | "Preparing PDF Engine" | "Setting up the rendering library on your device." |
| Ghostscript (`ghostscript.wasm`, ~18MB) | "Preparing Compression Engine" | "Setting up the compression library on your device." |
| Tesseract (`tesseract-core.wasm`, ~10MB) | "Preparing OCR Engine" | "Setting up the text recognition library on your device." |
| Tesseract lang data (per language) | "Downloading Language Pack" | "Fetching the [English] recognition model (~10 MB)." |
| ZetaOffice (`soffice.wasm`, ~50MB) | "Preparing Office Engine" | "Setting up the document conversion library (~50MB). This only happens once." |

**Behaviour rules:**
- The preparation screen replaces the feature UI — do not show a modal or toast over the top of it
- The progress bar is driven by real `fetch` progress (`response.body` reader with `Content-Length` header) — not a fake animation
- On completion, crossfade the preparation screen out and the feature UI in (150ms fade)
- If the download fails, show: *"Couldn't fetch the engine. Check your connection and try again."* with a Retry button
- After first successful cache: the screen never appears again for that engine, even across sessions (Service Worker handles this)
- MuPDF should be pre-fetched silently in the background as soon as the user lands on any PDF tool page — so by the time they upload a file, it's already ready. Show no UI for this background fetch; only show the preparation screen if the user acts before it completes

### 6.2 Operation Progress

Every processing operation shows:
- Current stage label (*"Extracting images…"*, *"Re-compressing page 3 of 12…"*)
- Percent complete bar
- Cancel button (triggers `AbortController.abort()`)
- Estimated time remaining (simple moving average of per-page time)

### 6.3 File Size Budget

Trigger warnings at key thresholds:

| File Size | Action |
|---|---|
| > 50 MB | Stage to OPFS before processing |
| > 100 MB | Warn: *"Large file — processing may take a few minutes"* |
| > 200 MB on mobile | Warn: *"This file is very large for mobile. For best results, use a desktop browser."* |
| > 500 MB | Block with error: *"File too large for browser processing"* |

### 6.4 Mobile Constraints

Check `navigator.deviceMemory` at app load. Store result in Zustand global state.

```ts
// In store
deviceMemory: navigator.deviceMemory ?? 4, // default 4 if API unavailable
isLowMemoryDevice: (navigator.deviceMemory ?? 4) < 4,
```

Use `isLowMemoryDevice` to:
- Disable Ghostscript compression (offer MuPDF fallback)
- Reduce default OCR DPI from 200 to 150
- Lower the OPFS staging threshold from 50MB to 25MB
- Show "Max Compression unavailable on this device" in the UI

### 6.5 Output Filename Editing

Every operation that produces a downloadable file must allow the user to edit the filename before downloading. The default name is derived from the original input filename — never a generic name like `output.pdf`.

**Default name derivation rules:**

| Operation | Default output name |
|---|---|
| Compress PDF | `{original}-compressed.pdf` |
| Merge PDFs | `{first-file}-merged.pdf` |
| Split PDF | `{original}-page-{n}.pdf` |
| PDF → Word | `{original}.docx` |
| PDF → Excel | `{original}.xlsx` |
| PDF → PPT | `{original}.pptx` |
| PDF → JPG/PNG | `{original}-page-{n}.jpg` |
| PDF → ZIP (images) | `{original}-images.zip` |
| Word/Excel/PPT → PDF | `{original}.pdf` |
| OCR PDF | `{original}-ocr.pdf` |
| Protect PDF | `{original}-protected.pdf` |
| Unlock PDF | `{original}-unlocked.pdf` |
| Repair PDF | `{original}-repaired.pdf` |
| Watermark PDF | `{original}-watermarked.pdf` |

Where `{original}` is the input filename with its extension stripped.

**UI pattern — inline editable field shown just before download:**

After processing completes, show the result panel with an editable filename field rather than triggering the download immediately. The user can accept the default or type a new name, then click Download.

```
┌─────────────────────────────────────────────────────┐
│  ✓ Ready to download                                │
│                                                     │
│  Filename                                           │
│  ┌─────────────────────────────────────────────┐   │
│  │ report-compressed.pdf               ✎ edit │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Original: 4.2 MB  →  Compressed: 1.1 MB (−74%)   │
│                                                     │
│  [ Download ]                                       │
└─────────────────────────────────────────────────────┘
```

**Implementation (`src/hooks/useOutputFilename.ts`):**

```ts
export function useOutputFilename(
  inputFile: File | null,
  suffix: string,
  ext: string
): [string, (name: string) => void] {
  const defaultName = useMemo(() => {
    if (!inputFile) return `output.${ext}`;
    const base = inputFile.name.replace(/\.[^/.]+$/, ''); // strip extension
    return `${base}${suffix}.${ext}`;
  }, [inputFile, suffix, ext]);

  const [name, setName] = useState(defaultName);

  // Reset to new default whenever input file changes
  useEffect(() => setName(defaultName), [defaultName]);

  return [name, setName];
}

// Usage in any feature component
const [filename, setFilename] = useOutputFilename(file, '-compressed', 'pdf');

// Pass to download trigger
triggerDownload(resultBlob, filename);
```

**Filename sanitization — strip characters that are invalid on any OS:**

```ts
function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '-')  // invalid on Windows/Unix
    .replace(/\.+$/, '')              // no trailing dots
    .replace(/^\.+/, '')              // no leading dots
    .trim()
    || 'output';                      // fallback if result is empty
}
```

**For multi-file outputs (e.g. Split PDF producing N files):** Show a list with one editable name per output file. Provide a "Reset all to defaults" button. Bulk rename with a pattern is a nice-to-have but not required for v1.

---

### 6.6 Password-Protected PDF Handling

Every operation that accepts a PDF input must handle password-protected files gracefully. This applies to: Compress, Merge, Split, Redact, OCR, Convert, Repair, Rotate, Watermark, and PDF→Image. The only operations exempt are Protect PDF (creates new encryption) and Unlock PDF (already explicitly handles passwords).

**Two types of PDF passwords — understand the difference:**

| Type | Purpose | What it controls |
|---|---|---|
| **User password** (open password) | Required to open and view the PDF at all | Encrypts the entire file |
| **Owner password** (permissions password) | Required to change restrictions | Controls print, copy, edit permissions. File opens without it. |

MuPDF's `authenticatePassword()` returns a numeric code:

| Return value | Meaning |
|---|---|
| `0` | Password incorrect — try again |
| `2` | Authenticated as user (can view, restricted by permissions) |
| `4` | Authenticated as owner (full access, all restrictions lifted) |
| `6` | Authenticated as both user and owner simultaneously |

**Detection at file load:**

```ts
// src/lib/pdf-password.ts
export interface PasswordCheckResult {
  needsPassword: boolean;
  isOwnerLocked: boolean; // has permissions restrictions but no open password
}

export function checkPdfPassword(
  doc: mupdf.PDFDocument
): PasswordCheckResult {
  const needsPassword = doc.needsPassword();

  // Owner-only locked: opens fine but has permission restrictions
  // Authenticate with empty string — succeeds for owner-locked PDFs
  const authResult = needsPassword ? 0 : doc.authenticatePassword('');
  const isOwnerLocked = !needsPassword && authResult !== 4 && authResult !== 6;

  return { needsPassword, isOwnerLocked };
}

export function authenticateWithPassword(
  doc: mupdf.PDFDocument,
  password: string
): 'granted' | 'owner' | 'wrong' {
  const result = doc.authenticatePassword(password);
  if (result === 0) return 'wrong';
  if (result === 4 || result === 6) return 'owner';  // full access
  return 'granted';                                   // user access
}
```

**UI flow — password prompt modal:**

When `needsPassword` is `true` after file selection, show a password prompt before the file is processed. Do not proceed to the tool UI until authentication succeeds.

**Implementation in `pdf-core.worker.ts`:**

```ts
// Called for every PDF load — wraps openDocument with password support
export async function openPdfWithPassword(
  buffer: ArrayBuffer,
  getPassword: () => Promise<string>  // callback to UI to prompt user
): Promise<mupdf.PDFDocument> {
  const doc = mupdf.PDFDocument.openDocument(
    new Uint8Array(buffer),
    'application/pdf'
  );

  if (!doc.needsPassword()) return doc;  // no password needed

  // Try up to 3 times before giving up
  for (let attempt = 0; attempt < 3; attempt++) {
    const password = await getPassword();
    const result = doc.authenticatePassword(password);

    if (result !== 0) return doc;  // any non-zero = authenticated

    // Wrong password — signal to UI to show error and prompt again
    postMessage({ type: 'password-error', attempt });
  }

  throw new Error('PDF could not be unlocked after 3 attempts');
}
```

**Owner-locked PDFs (permissions restrictions):**

Some PDFs open without a password but have restrictions (no printing, no copying, no editing). Most operations need owner-level access to bypass these restrictions. MuPDF handles this transparently — authenticating as owner with the owner password lifts all restrictions.

For operations that need owner access (redact, compress with image resampling, content extraction), check `isOwnerLocked` and show a non-blocking notice:

```
ℹ  This PDF has permission restrictions.
   If results are incomplete, the owner password may be required.
   [ Enter owner password ]  [ Continue anyway ]
```

Do not block the operation — attempt it anyway and let MuPDF do what it can. Many operations (merge, split, render) work fine under user-level permissions.

**ZetaOffice (Office files):** ZetaOffice handles password-protected Office files natively via the `Password` property in `loadComponentFromURL`:

```ts
desktop.loadComponentFromURL(
  `file://${inputPath}`,
  '_blank',
  0,
  [
    { Name: 'Hidden', Value: true },
    { Name: 'Password', Value: userSuppliedPassword },  // add when known
  ]
);
```

If ZetaOffice throws on `loadComponentFromURL`, check if the error message contains "password" and show the password prompt before retrying.

**Password is never stored anywhere** — not in Zustand, not in IDB, not in OPFS. It lives only in the Worker's local scope for the duration of the operation. After the document is authenticated and the operation completes, the password goes out of scope and is garbage collected. Document this explicitly in your privacy policy.

---

## 7. IndexedDB Usage (via `idb`)

Use IDB for persistent user preferences and cached metadata. Do NOT store large file buffers in IDB — use OPFS for that.

```ts
// DB schema
interface PdfToolsDB {
  preferences: {
    compressionPreset: 'screen' | 'ebook' | 'print';
    ocrLanguages: string[];
    imageDpi: 72 | 150 | 300;
    imageFormat: 'jpeg' | 'png' | 'webp';
  };
  wasmCache: {
    // Metadata only — actual WASM in Service Worker cache
    ghostscript: { cachedAt: number; version: string };
    tesseract: { cachedAt: number; version: string };
  };
  ocrLanguages: {
    // Which lang files are in OPFS
    [langCode: string]: { storedAt: number; sizeBytes: number };
  };
}
```

---

## 9. Migration: Existing Redact Tool

**File:** `src/app/pdf/redact/page.tsx`

**Step-by-step:**

1. Delete `public/lib/mupdf/` directory entirely
2. Add WASM copy script to `package.json` (see §1.3)
3. Replace the dynamic import:
```ts
// Before (manual WASM file, fragile)
const mupdf = await import('/lib/mupdf/mupdf.js');

// After (official npm package)
import * as mupdf from 'mupdf';
```
4. Update any MuPDF API calls — the official package has slightly different method names than community forks. Check against [the official MuPDF.js docs](https://mupdf.readthedocs.io/en/latest/mupdf-js.html)
5. Test: redaction, save, download on a test PDF with images and text
6. Verify WASM loads from `public/mupdf.wasm` (check Network tab — should be one request, then cached)

---

## 10. Build & Performance Targets

| Metric | Target |
|---|---|
| Initial JS bundle (no WASM) | < 200KB gzipped |
| Time to interactive (no feature clicked) | < 2s on 4G |
| MuPDF first load (cold, Brotli) | < 4s on 4G (~3MB compressed) |
| Ghostscript first load (cold, Brotli) | < 8s on 4G (~7MB compressed) |
| ZetaOffice first load (cold, Brotli) | < 20s on 4G (~18MB compressed) |
| Any WASM subsequent loads | < 200ms (SW cache) |
| PDF preview — first page visible | < 500ms after file selected |
| Compress 10-page PDF (eBook preset) | < 15s on modern desktop |
| OCR 5-page PDF (English) | < 30s on modern desktop |
| Office → PDF (10-page DOCX, ZetaJS warm) | < 8s on modern desktop |

**Brotli note:** Confirm your CDN/host (Cloudflare) serves WASM with `Content-Encoding: br`. WASM compresses 50-60% with Brotli. Verify in Network tab — `mupdf.wasm` should transfer as ~3MB, not 8MB.

---

## 11. Implementation Order (Recommended)

Build in this sequence to ship value incrementally:

- [ ] AGPL compliance (GitHub repo public, footer link)
- [ ] WASM pipeline (`package.json` copy script, `next.config.ts`, headers)
- [ ] Migrate Redact tool to official `mupdf` package
- [ ] Worker pool + progress bus + `usePdfWorker` hook
- [ ] OPFS staging utility
- [ ] Service Worker (WASM caching)
- [ ] `useOutputFilename` hook + filename sanitizer (§6.5) — attach to every feature before shipping
- [ ] `pdf-password.ts` helpers + password prompt modal (§6.6) — required before any feature goes live
- [ ] Performance infrastructure (§13): predictive loader, idle prefetch, resource hints
- [ ] Compress PDF (MuPDF fallback first, then add Ghostscript)
- [ ] Merge / Split / Rotate (already likely done — migrate to new worker pool pattern)
- [ ] PDF ↔ Image (MuPDF render pipeline, `fflate` zip)
- [ ] Image → PDF (`pdf-lib`)
- [ ] Virtualized page renderer + LRU bitmap cache (§13.4)
- [ ] Protect / Unlock (MuPDF)
- [ ] Repair + PDF/A (MuPDF)
- [ ] PDF → Word / Excel (MuPDF extract + docx/xlsx)
- [ ] Office → PDF (ZetaJS)
- [ ] OCR PDF (Tesseract + MuPDF text layer)
- [ ] Scan to PDF (Canvas filters + pdf-lib)
- [ ] Mobile memory checks + low-memory fallbacks
- [ ] PWA manifest + offline mode
- [ ] Streaming download via File System Access API (§13.6)
- [ ] Performance audit: Lighthouse, bundle analyzer, Worker timing logs

---

## 13. Performance Intelligence

This section covers smart loading strategies, memory management, and rendering optimizations that together make the app feel fast even with multi-megabyte WASM dependencies.

---

### 13.1 Predictive WASM Loading

The biggest performance win is never making a user wait for a WASM download that you could have started earlier. The app knows what the user is likely to do before they do it — use that knowledge.

** A — Idle-time prefetch of MuPDF (always):**

MuPDF is needed for almost every feature. Start fetching it silently during browser idle time as soon as any PDF tool page loads. By the time the user selects a file, it's already cached.

```ts
// src/lib/predictive-loader.ts
export function prefetchMuPdfOnIdle(): void {
  const prefetch = () => {
    // Only fetch if not already cached
    if ('serviceWorker' in navigator) {
      fetch('/mupdf.wasm', { priority: 'low' }).catch(() => {});
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetch, { timeout: 5000 });
  } else {
    setTimeout(prefetch, 3000); // Fallback for Safari
  }
}
```

Call `prefetchMuPdfOnIdle()` in `layout.tsx` — fires on every PDF tool page, costs nothing if already cached, saves 4s if not.

**B — Hover-intent prefetch for heavy engines:**

When a user hovers over a feature card for more than 300ms, they are very likely about to click it. Start prefetching that feature's WASM immediately.

```ts
// Hook: attach to any feature card
function useHoverPrefetch(wasmUrl: string, delayMs = 300) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const onMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      fetch(wasmUrl, { priority: 'low' }).catch(() => {});
    }, delayMs);
  };

  const onMouseLeave = () => clearTimeout(timerRef.current);

  return { onMouseEnter, onMouseLeave };
}

// Usage on Compress feature card
const hoverProps = useHoverPrefetch('https://cdn/.../ghostscript.wasm');
<FeatureCard {...hoverProps} title="Compress PDF" />
```

| Feature hovered | WASM prefetched |
|---|---|
| Compress PDF | `ghostscript.wasm` |
| OCR PDF | `tesseract-core.wasm` |
| Any Office conversion | `soffice.wasm` (ZetaOffice) |
| Everything else | MuPDF already prefetched via Strategy A |


**Strategy D — Route-based prefetch:**

Next.js fires `router.prefetch()` on link hover automatically, but WASM isn't covered by that. Add explicit WASM prefetch triggers per route.

```ts
// In each feature page's useEffect
useEffect(() => {
  // This page needs MuPDF — ensure it's prefetched
  prefetchMuPdfOnIdle();
}, []);
```

---

### 13.2 Parallel Worker Warm-up

Workers have a ~200-500ms cold start cost (JS parse + WASM instantiation). Pre-instantiate them during idle time rather than on first use.

```ts
// worker-pool.ts — warm up on idle
export function warmUpWorkers(): void {
  requestIdleCallback(() => {
    // Instantiate pdf-core worker early — needed for almost all features
    workerPool.ensureWorker('pdf-core');
  }, { timeout: 8000 });
}
```

This means when the user actually triggers an operation, the worker is already alive and WASM is already instantiated. The operation starts in milliseconds instead of seconds.

Do NOT warm up `office-zeta.worker` or `pdf-compress.worker` preemptively — they are too heavy. Only warm them via hover-intent or file-drop signals.

---

### 13.3 Progressive PDF Preview Rendering

When a user selects a PDF file, show them a preview as fast as possible. Do not wait for full-quality rendering before displaying anything.

**Two-pass rendering:**

```
Pass 1 (immediate, ~100ms): Render page 1 at 72dpi → show low-res preview
Pass 2 (background, ~300ms): Re-render page 1 at 150dpi → swap in silently
Background: Render pages 2–N at 150dpi as user scrolls
```

```ts
async function renderPageProgressive(
  doc: mupdf.Document,
  pageIndex: number,
  canvas: HTMLCanvasElement
): Promise<void> {
  // Pass 1 — fast low-res
  const lowRes = doc.loadPage(pageIndex).toPixmap(
    mupdf.Matrix.scale(0.5, 0.5),   // 72dpi equivalent
    mupdf.ColorSpace.DeviceRGB
  );
  paintToCanvas(canvas, lowRes);
  lowRes.destroy();

  // Pass 2 — full quality, paint over low-res when ready
  await new Promise(r => requestAnimationFrame(r));  // yield to browser
  const fullRes = doc.loadPage(pageIndex).toPixmap(
    mupdf.Matrix.scale(1.5, 1.5),   // 150dpi
    mupdf.ColorSpace.DeviceRGB
  );
  paintToCanvas(canvas, fullRes);
  fullRes.destroy();
}
```

Users see something instantly. The quality upgrade is invisible because it happens before they notice the low-res version.

---

### 13.4 Virtualized Page Rendering + LRU Bitmap Cache

Never render all pages of a PDF upfront. Only render pages the user is likely to see.

**Render window:** Current page ± 2 pages. Use `IntersectionObserver` to detect which page containers are visible and trigger rendering for those pages only.

**LRU cache:** Keep the last 10 rendered page bitmaps in memory. If a user scrolls back to a page they already saw, serve it from cache instead of re-rendering.

```ts
// src/lib/page-render-cache.ts
class PageRenderCache {
  private cache = new Map<string, ImageBitmap>();
  private readonly maxSize = 10;

  get(docId: string, pageIndex: number): ImageBitmap | undefined {
    return this.cache.get(`${docId}:${pageIndex}`);
  }

  set(docId: string, pageIndex: number, bitmap: ImageBitmap): void {
    const key = `${docId}:${pageIndex}`;
    if (this.cache.size >= this.maxSize) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.get(firstKey)?.close();   // Release GPU memory
      this.cache.delete(firstKey);
    }
    this.cache.set(key, bitmap);
  }

  clear(): void {
    this.cache.forEach(bitmap => bitmap.close());
    this.cache.clear();
  }
}
```

**`ImageBitmap` over raw pixel data:** Transfer rendered page bitmaps from Worker to main thread as `ImageBitmap` (GPU-accelerated, hardware composited). Painting an `ImageBitmap` to Canvas is a single GPU blit — much faster than `putImageData`.

```ts
// In pdf-core.worker.ts
const pixmap = page.toPixmap(matrix, colorSpace);
const imageData = new ImageData(pixmap.samples, pixmap.width, pixmap.height);
const bitmap = await createImageBitmap(imageData);
pixmap.destroy();
page.destroy();

// Transfer as Transferable — zero copy
postMessage({ operationId, bitmap }, [bitmap]);
```

---

### 13.5 OffscreenCanvas for Zero Main-Thread Rendering

For processing operations that render pages (OCR, PDF→Image), use `OffscreenCanvas` to do all canvas work inside the Worker without touching the main thread at all.

```ts
// In pdf-core.worker.ts
const offscreen = new OffscreenCanvas(width, height);
const ctx = offscreen.getContext('2d')!;
const pixmap = page.toPixmap(matrix, colorSpace);

ctx.putImageData(
  new ImageData(pixmap.samples, pixmap.width, pixmap.height),
  0, 0
);

const blob = await offscreen.convertToBlob({ type: 'image/webp', quality: 0.9 });
pixmap.destroy();
page.destroy();
```

The main thread is never involved. UI stays at 60fps during processing.

---

### 13.6 Streaming Output via File System Access API

For large output files (compressed PDFs, multi-page image zips), do not build the entire result as a Blob in memory before triggering download. Stream it directly to disk.

```ts
// src/lib/streaming-download.ts
async function streamingDownload(
  filename: string,
  writeCallback: (writer: FileSystemWritableFileStream) => Promise<void>
): Promise<void> {
  if ('showSaveFilePicker' in window) {
    // File System Access API — streams directly to disk, no memory spike
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ accept: { 'application/pdf': ['.pdf'] } }],
    });
    const writable = await handle.createWritable();
    await writeCallback(writable);
    await writable.close();
  } else {
    // Fallback — collect chunks in memory, then download
    const chunks: Uint8Array[] = [];
    const pseudoWriter = {
      write: async (chunk: Uint8Array) => chunks.push(chunk),
      close: async () => {
        const blob = new Blob(chunks, { type: 'application/pdf' });
        triggerBlobDownload(blob, filename);
      },
    };
    await writeCallback(pseudoWriter as any);
  }
}
```

For a 100MB compressed PDF, this is the difference between the browser tab crashing and a smooth download.

**Browser support:** `showSaveFilePicker` is available in Chrome and Edge (90%+ of desktop users). Safari and Firefox fall back to the in-memory Blob approach automatically.

---

### 13.7 MuPDF Memory Discipline

MuPDF WASM does not garbage collect C++ objects automatically. Every `Page`, `Pixmap`, `Document`, and `StrokeState` object must be explicitly destroyed or you will leak WASM linear memory — which cannot be recovered without reloading the page.

**Rules:**

```ts
// ALWAYS destroy in this order: Pixmap → Page → Document
const doc = mupdf.Document.openDocument(buffer, 'application/pdf');
const page = doc.loadPage(0);
const pixmap = page.toPixmap(matrix, colorSpace);

try {
  // use pixmap...
} finally {
  pixmap.destroy();   // 1. destroy pixmap first
  page.destroy();     // 2. then page
  // doc.destroy() only when completely done with the document
}
```

**Monitor WASM memory usage** in development:

```ts
// Log WASM heap usage after each operation — catches leaks immediately
if (process.env.NODE_ENV === 'development') {
  const used = (performance as any).memory?.usedJSHeapSize;
  console.debug(`[MuPDF] WASM heap after operation: ${(used / 1024 / 1024).toFixed(1)}MB`);
}
```

If heap size grows monotonically across operations without leveling off, there is a leak — find the missing `destroy()` call.

---

### 13.8 Network Resource Hints

Add these to `src/app/layout.tsx` `<head>` to pre-warm connections before any WASM fetch starts. This eliminates the DNS + TLS handshake time (~200-500ms) from the first ZetaOffice request.

```tsx
// layout.tsx
<head>
  {/* Pre-warm connection to ZetaOffice CDN */}
  <link rel="preconnect" href="https://cdn.zetaoffice.net" />
  <link rel="dns-prefetch" href="https://cdn.zetaoffice.net" />

  {/* Pre-warm connection to Tesseract CDN if you use their hosted lang data */}
  <link rel="preconnect" href="https://tessdata.projectnaptha.com" />
</head>
```

This costs nothing and shaves 200-500ms off the first ZetaOffice fetch.

---

### 13.9 Bundle Size Discipline

Keep the initial JS bundle under 200KB gzipped. Every byte loaded on initial page load delays time-to-interactive.

**Rules:**
- All workers are dynamically imported — never included in the main bundle
- `fflate`, `idb`, `zustand` are the only libraries allowed in the main bundle
- `mupdf`, `mammoth`, `docx`, `xlsx`, `pptxgenjs`, `zetajs`, `tesseract.js`, `@squoosh/lib` are Worker-only imports — they never appear in any client component's import tree
- Use `next/dynamic` with `ssr: false` for any component that imports a heavy library

**Verify regularly:**

```bash
# After each significant dependency addition
npx @next/bundle-analyzer
# Check that no Worker-only package appears in the main bundle chunks
```

**Size budget per chunk:**

| Chunk | Budget |
|---|---|
| Main bundle (initial load) | < 200KB gzipped |
| Per-route page chunk | < 50KB gzipped |
| Each Worker script (excl. WASM) | < 100KB gzipped |
| WASM files | Covered by lazy loading + SW cache |

---
