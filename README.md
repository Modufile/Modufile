# Modufile

**Privacy-first file tools that run entirely in your browser.**
No uploads. No servers. No accounts. Everything processed locally via WebAssembly.

> _"Modify files. Privately. Instantly. In your browser."_

---

## Features

### PDF Studio
- **Organize** — Merge, Split, Rotate, Reorder, Remove Pages
- **Edit** — Full PDF editor: add text, shapes, freehand draw, stamps, whiteout
- **Redact** — Permanent content removal at the content-stream level (not a visual overlay)
- **Convert** — PDF ↔ Word (text extraction), PDF ↔ Excel, Office → PDF
- **Optimize** — Compress, Flatten layers, Repair corrupted files
- **Security** — Password protect, Unlock, Watermark
- **Metadata** — View and edit hidden document properties
- **Utilities** — Add page numbers, Resize pages, PDF/A conversion, OCR

### Image Lab
- Convert between HEIC, WebP, AVIF, TIFF, JPG, PNG
- Resize, compress, batch process

### OCR
- Extract text from images and scanned PDFs (100+ languages via Tesseract.js)

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# 1. Clone
git clone https://github.com/modufile/modufile.git
cd modufile

# 2. Install dependencies
npm install

# 3. Copy WASM binaries from node_modules → public/
#    Copies MuPDF (mupdf.js, mupdf-wasm.wasm) and the PDF.js worker.
#    This runs automatically before `dev` and `build`, but you can run it manually:
npm run copy:wasm

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (runs `copy:wasm` first via `predev`) |
| `npm run build` | Production build (runs `copy:wasm` first via `prebuild`) |
| `npm run copy:wasm` | Copy all WASM assets from `node_modules/` to `public/` |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Build and deploy to Cloudflare Pages via Wrangler |

### Optional: Large WASM Assets

Some tools require large WASM binaries (~50–200 MB total) that are not committed to this repository. They must be obtained from their vendors and placed under `public/` before those tools will function. `npm run copy:wasm` handles placement automatically once the packages are installed.

---

#### 1. PDF Compress — Ghostscript WASM

**Source:** npm — [`@bentopdf/gs-wasm`](https://www.npmjs.com/package/@bentopdf/gs-wasm)
**License:** AGPL-3.0 (Artifex Software, Inc.) — commercial use requires a [license from Artifex](https://artifex.com/licensing/)
**Destination:** `public/wasm/gs/`

```bash

```

---

#### 2. PDF → Word / PDF → Excel — PyMuPDF + Pyodide WASM

**Source:** npm — [`@bentopdf/pymupdf-wasm`](https://www.npmjs.com/package/@bentopdf/pymupdf-wasm)
**License:** AGPL-3.0 (Artifex Software, Inc.) — commercial use requires a [license from Artifex](https://artifex.com/licensing/)
**Destination:** `public/wasm/pymupdf/`

```bash
npm install @bentopdf/pymupdf-wasm
npm run copy:wasm
```

> These packages include Pyodide (Python runtime compiled to WASM) and can be several hundred MB. Installation may take a few minutes.

---

#### 3. Office → PDF — LibreOffice WASM (Zeta)

**Source:** Zeta project — LibreOffice compiled to WebAssembly
**License:** MPL-2.0 / LGPL-3.0+ ([The Document Foundation](https://www.libreoffice.org/about-us/licenses/))
**Destination:** `public/zeta/` (served via Cloudflare R2 edge function)

The Office → PDF tool serves LibreOffice WASM from **Cloudflare R2** rather than bundling it with the app. The edge functions in `functions/zeta/` proxy requests to an R2 bucket.

To set up:
1. Obtain the Zeta LibreOffice WASM build: `soffice.js`, `soffice.data`, `soffice.data.js.metadata`, `zeta.js`
2. Upload them to a Cloudflare R2 bucket
3. Bind the bucket to your Cloudflare Pages deployment as `ASSETS_BUCKET`
4. The edge functions in `functions/zeta/` will serve the files automatically

---

#### 4. Image Processing — ImageMagick WASM

**Source:** npm — [`@imagemagick/magick-wasm`](https://www.npmjs.com/package/@imagemagick/magick-wasm) (included in `npm install`)
**License:** Apache-2.0
**Destination:** `public/magick.wasm`

This is already listed as a standard dependency and copied automatically by `npm run copy:wasm`. No extra steps needed.

---

## Project Structure

```
src/
├── app/                     # Next.js App Router — one route per tool
│   ├── pdf/                 # PDF Studio (merge, split, editor, redact, …)
│   ├── image/               # Image Lab
│   └── ocr/                 # OCR tool
├── components/
│   ├── layout/              # Header, Footer
│   ├── pdf/                 # PDF editor, thumbnails, annotation toolbar
│   ├── tools/               # Shared tool page layout, file panels
│   └── ui/                  # Primitives: Dropzone, DownloadToast, …
├── workers/
│   ├── pdf-core.worker.ts   # MuPDF: rendering, encryption, repair
│   ├── pdf-editor.worker.ts # Persistent PDF editor (annotations, redaction)
│   └── pdf-compress.worker.ts  # Ghostscript compression
├── lib/
│   ├── core/                # WASM loaders, business logic
│   └── infrastructure/      # External service adapters (auth, storage)
├── hooks/                   # Custom React hooks
├── stores/                  # Zustand state stores
└── data/                    # Tool content, FAQs

public/
├── wasm/
│   ├── gs/                  # Ghostscript WASM (copied from @bentopdf/gs-wasm)
│   └── pymupdf/             # PyMuPDF WASM (copied from @bentopdf/pymupdf-wasm)
├── sw.js                    # Service Worker (offline WASM caching)
└── _headers                 # Cloudflare Pages response headers
```

---

## Architecture

Modufile follows a strict **4-layer architecture** to keep UI logic decoupled from file-processing logic:

| Layer | Role | Tech |
|-------|------|------|
| **Presentation** | Dumb UI, layouts, routing | Next.js App Router, Tailwind |
| **Application** | State, orchestration | Zustand, React hooks |
| **Domain Core** | Business logic, WASM wrappers | TypeScript, Web Workers |
| **Infrastructure** | External I/O adapters | IndexedDB |

Heavy processing (MuPDF, Ghostscript, Tesseract) runs in **Web Workers** to keep the UI thread unblocked.

---

### ⚠️ AGPL-3.0 Dependency Notice

This project uses the following components licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**:

| Component | Copyright | License |
|-----------|-----------|---------|
| **MuPDF** | © Artifex Software, Inc. | [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) |
| **Ghostscript** | © Artifex Software, Inc. | [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) |
| **PyMuPDF** | © Artifex Software, Inc. | [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) |

**What this means for you:**

- ✅ **Open source use** — Fully permitted. The AGPL requires that source code of any application using these components be made publicly available. This repository satisfies that requirement.
- ❌ **Proprietary / closed-source use** — If you intend to build a closed-source product using Modufile or its WASM-based PDF processing, you **must** obtain commercial licenses for MuPDF and Ghostscript from [Artifex Software](https://artifex.com/licensing/).

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a Pull Request with a clear description

---

## Acknowledgements

Modufile is built on top of an incredible open-source ecosystem.
Full credits and license notices: [modufile.com/thanks](https://modufile.com/thanks)