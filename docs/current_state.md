# Current Project State

**Last Updated:** 2026-02-17
**Version:** 0.1.0

## 1. Overview
Modufile is a privacy-first, client-side only document modification platform. It runs entirely in the browser using WebAssembly (WASM) technologies, ensuring user data never leaves their device.

## 2. Technology Stack

### Core Framework
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS V4
- **State Management:** Zustand
- **Deployment:** Cloudflare Pages (Static Export)

### Key Libraries (WASM & Client-Side)
- **PDF Manipulation:** `pdf-lib` (Creation, Modification), `mupdf` (Redaction, Rendering), `pdfjs-dist` (Rendering).
- **Image Processing:** `@imagemagick/magick-wasm` (Conversion, Editing).
- **Video Processing:** `@ffmpeg/ffmpeg` (WASM).
- **OCR:** `tesseract.js` (Client-side worker).
- **UI/Animation:** `framer-motion`, `lucide-react` (Icons), `clsx`, `tailwind-merge`.
- **Infrastructure:** `idb` (IndexedDB for large file storage), `@supabase/supabase-js` (Auth/Cloud sync - optional).

## 3. Architecture

### Directory Structure
```
o:\CreativeCoding\modufile\src
├── app/                  # Next.js App Router Pages
│   ├── pdf/              # PDF Tool Routes (merge, split, editor, etc.)
│   ├── image/            # Image Tool Routes (convert, compress, etc.)
│   ├── ocr/              # OCR Tool Routes
│   ├── lab/              # Experimental WASM playground
│   └── ...
├── components/           # React Components
│   ├── ui/               # Generic UI atoms (Buttons, Inputs, Dropzone)
│   ├── tools/            # Tool-specific layouts (ToolPageLayout, FloatingActionBar)
│   └── ...
├── lib/                  # Core Logic
│   ├── core/             # Helpers (download, format, magick init)
│   ├── infrastructure/   # Auth, Storage, DB adapters
│   └── ...
└── stores/               # Zustand Global Stores (fileStore, etc.)
```

### UI Patterns
- **ToolPageLayout:** A wrapper component providing the standard header, sidebar, and workspace layout for single-purpose tools.
- **FloatingActionBar:** A sticky footer action bar for executing the primary tool action (e.g., "Merge PDFs").
- **Dropzone:** Standardized file input component with drag-and-drop support.

## 4. Feature Matrix (Implemented)

### PDF Tools
| Tool | Path | Description | Status |
| :--- | :--- | :--- | :--- |
| **PDF Editor** | `/pdf/editor` | Full-screen editor with annotations, images, and redaction. | ✅ Implemented |
| **Merge** | `/pdf/merge` | Combine multiple PDFs. | ✅ Implemented (Custom Layout) |
| **Split** | `/pdf/split` | Split PDF into separate files. | ✅ Implemented |
| **Redact** | `/pdf/redact` | Securely remove content (WASM). | ✅ Implemented |
| **Compress** | `/pdf/compress` | Reduce file size. | 🚧 In Progress |
| **Convert** | `/pdf/convert` | PDF to Image / Image to PDF. | ✅ Implemented |
| **Organize** | `/pdf/organize` | Reorder/Delete pages. | ✅ Implemented |
| **Watermark** | `/pdf/watermark` | Add text/image watermarks. | ✅ Implemented |
| **Rotate** | `/pdf/rotate` | Rotate pages. | ✅ Implemented |
| **Flatten** | `/pdf/flatten` | Flatten form fields. | ✅ Implemented |
| **Page #** | `/pdf/page-numbers`| Add page numbers. | ✅ Implemented |
| **Metadata** | `/pdf/metadata` | Edit PDF metadata. | ✅ Implemented |
| **Extract** | `/pdf/extract` | Extract specific pages. | ✅ Implemented |
| **Remove** | `/pdf/remove-pages`| Delete specific pages. | ✅ Implemented |

### Image Tools
| Tool | Path | Description | Status |
| :--- | :--- | :--- | :--- |
| **Convert** | `/image/convert` | Format conversion (HEIC/WebP/etc). | ✅ Implemented |
| **Compress** | `/image/compress` | File size reduction. | ✅ Implemented |
| **Resize** | `/image/resize` | Change dimensions. | ✅ Implemented |
| **Batch** | `/image/batch` | Bulk processing. | ✅ Implemented |

### Other
- **OCR:** Browser-based text extraction.
- **Lab:** Testing ground for WASM capabilities.

## 5. Deployment
- **Platform:** Cloudflare Pages
- **Build Command:** `npm run build` (Next.js Static Export)
- **Output Directory:** `out`
- **Configuration:** `next.config.ts` sets `output: 'export'`.
- **Headers:** Requires `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` for WASM threading (SharedArrayBuffer).

## 6. Development Guidelines
- **Run Locally:** `npm run dev`
- **Lint:** `npm run lint`
- **Code Style:** Strict TypeScript, Tailwind utility classes.
- **Performance:** Avoid main-thread blocking; use Workers/WASM where possible.
