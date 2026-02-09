# Findings

## Research: Comprehensive Feature Feasibility

### 1. PDF Tools (The Flagship)
*   **Editing Capability:** True "edit existing text" (like Word) is technically extremely difficult in pure WASM/JS without commercial SDKs (Apryse).
    *   *Decision:* The "PDF Editor" will be an **Overlay/Annotation Editor**: Whiteout existing text, type over it, add images, signatures, and shapes. This covers 90% of user "edit" needs (filling forms, fixing typos).
*   **Organization:** `pdf-lib` handles Merge, Split, Rotate, and Reorder perfectly.
*   **Conversion:** `pdf-lib` + `canvas` for PDF -> Image. `jspdf` for Image -> PDF.

### 2. Image Tools (High Volume SEO)
*   **Conversion:** `magick-wasm` supports 100+ formats (HEIC, TIFF, WebP, AVIF).
*   **Compression:** `squoosh` logic (MozJPEG/OxiPNG pipelines) is industry best-in-class for browser.
*   **Vector:** `Method Draw` (d3/svg-edit functionality) can be ported for an "SVG Editor".

### 3. Video Tools (Differentiator)
*   **Library:** `ffmpeg.wasm` is capable but heavy.
*   **Features:** Transcoding (MKV->MP4), Trimming (keyframe based), Gif creation.
*   **Constraint:** strictly limited by browser memory (2GB-4GB limit). 4K video editing is likely out of scope for MVP; 1080p short files are fine.

### 4. Audio Tools
*   **Library:** `ffmpeg.wasm` covers conversion (WAV/MP3/AAC).
*   **Wavesurfer.js:** Excellent for client-side audio visualization and simple trimming UI.

### 5. Office/Data Tools
*   **Excel:** `SheetJS` for parsing. `Luckysheet` or `Jspreadsheet` for a "Google Sheets-lite" viewer/editor.
*   **DOCX:** `mammoth.js` for viewing. Editing DOCX in browser is complex; likely limited to "Convert to PDF" or simple text extraction.

### 6. OCR (Optical Character Recognition)
*   **Library:** `tesseract.js` (WASM).
*   **Performance:** Slower than server-side, but 100% private.
*   **Feature:** "PDF to Text", "Image to Text".

## SEO Strategy: "The Long Tail of Micro-Tools"
High-volume keywords to target with dedicated landing pages:
- "Merge PDF free"
- "Compress PDF 200kb"
- "JPG to PDF converter"
- "HEIC to JPG" (iPhone users)
- "Edit PDF text online"
- "Add signature to PDF"

## Technical Constraints & Requirements
1.  **SharedArrayBuffer:** Required for `ffmpeg.wasm` multi-threading. Needs `COOP` and `COEP` headers.
2.  **Memory Management:** Explicit cleanup of WASM memory is critical to prevent tab crashes.
3.  **Persistence:** Use `IndexedDB` (via `idb-keyval` or similar) to store large files temporarily so they survive page reloads.