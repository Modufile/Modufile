# Modufile Project Constitution (claude.md)

## 1. Project Vision
**Modufile.com** is a privacy-first, fully in-browser file manipulation and conversion platform.

**Core Principles:**
*   **Zero file uploads** to servers (default).
*   All processing in **browser via WASM/Web APIs**.
*   **Cross-browser** + mobile compatible.
*   Simple, fast, reliable utilities.
*   Long-tail SEO-driven micro-tools.

**Brand Promise:**
> "Modify files. Privately. Instantly. In your browser."

---

## 2. Core Value Proposition
*   **Privacy:** Zero server uploads.
*   **Speed:** Instant processing via WASM.
*   **Versatility:** "The Swiss Army Knife" for files.

## 3. Product Scope: The Modufile Suite

### A. PDF Studio (Flagship)
1.  **Organize:** Merge, Split, Extract Pages, Remove Pages, Rotate, Reorder.
2.  **Edit (Overlay Mode):**
    *   Add Text, Images, Shapes.
    *   Whiteout/Redact content.
    *   Freehand Draw (Signatures).
    *   Fill Forms.
3.  **Convert:** PDF to JPG/PNG, PDF to Word (Text extraction), Word to PDF.
4.  **Optimize:** Compress PDF (Ghostscript/QPDF WASM), Flatten Layers.

### B. Image Lab
1.  **Converter:** Universal conversion (HEIC/WebP/AVIF/TIFF <-> JPG/PNG).
2.  **Compressor:** Smart compression (Squoosh logic).
3.  **Editor:** Crop, Resize, Rotate, Filter (Grayscale, Sepia).
4.  **Vector:** SVG Editor (cleaning, basic path manipulation).

### C. Media Station (Video/Audio)
1.  **Converter:** MP4/WebM/MOV converter. Audio extraction (Video -> MP3).
2.  **Trimmer:** Simple start/end timestamp cutting.
3.  **GIF Maker:** Video to GIF editor.

### D. Data & Office Desk
1.  **Spreadsheet:** CSV <-> Excel (XLSX). Viewer/Editor (Luckysheet).
2.  **Documents:** DOCX to PDF, Markdown <-> HTML.
3.  **OCR:** Image/PDF -> Text (Tesseract.js).

## 4. Architecture Principles
*   **Micro-Tool Architecture:** Each tool is a separate route (`/tools/pdf-merge`) for SEO.
*   **Unified Workspace:** A "Studio" mode where a file can be passed between tools (e.g., PDF -> Images -> Compress -> PDF).
*   **Offline First:** PWA capabilities for core tools.

## 5. Technology Stack & Layered Architecture

To ensure security, performance, and future-proof separation, we enforce a strict **4-Layer Architecture**:

### Layer 1: Presentation (The "Frontend")
*   **Role:** Dumb UI components, Layouts, Routing.
*   **Tech:** Next.js (App Router), Tailwind, Shadcn/UI.
*   **Rule:** logic-less. Only displays data from Layer 2.

### Layer 2: Application (The "Controller")
*   **Role:** State management, Orchestration.
*   **Tech:** Zustand, React Query.
*   **Rule:** Connects UI to Core. Handles loading states and user intent.

### Layer 3: Domain Core (The "Virtual Backend")
*   **Role:** Business logic, File Processing, WASM wrappers.
*   **Tech:** `pdf-lib`, `ffmpeg.wasm`, Pure TypeScript Classes.
*   **Rule:** **Platform Agnostic.** This code should run in a Web Worker, Node.js, or Electron without changes. This is our "Backend running in the Browser."

### Layer 4: Infrastructure (The "Gateway")
*   **Role:** External I/O.
*   **Tech:** Service Adapters (SupabaseAuthAdapter, IndexedDBStorageAdapter).
*   **Rule:** The only layer that knows "who" the provider is.

*   **WASM Core:**
    *   `pdf-lib` + `fontkit`
    *   `ffmpeg.wasm` (@ffmpeg/ffmpeg 0.12+)
    *   `magick-wasm` / `sharp-wasm` (experimental)
    *   `tesseract.js`
    *   `mammoth.js`

## 6. Business Logic Rules
*   **Free Tier:** 100% features, limited by *browser memory* and *batch size* (e.g., 5 files at a time).
*   **Pro Tier:** "Unlocks" isn't about capability (since it's all client-side), but about *convenience*:
    *   Batch processing (unlimited).
    *   Saved presets/templates.
    *   Cloud Backup (optional future feature).

## 7. SEO Strategy
*   Individual pages per tool (e.g., `/pdf-merge-online`).
*   Static rendering.
*   Rich educational content per tool.
*   **Programmatic SEO:** Generate pages for every permutation: "Convert X to Y".
*   **Rich Snippets:** How-to schema markup on every tool page.

## 8. PWA
*   Offline capability.
*   Local WASM caching.
*   Installable.

## 9. Security
*   Strict CSP.
*   No upload endpoints.
*   Memory wiping after processing.

---

## 10. Monetization (Future)
*   **Free:** Small files, limited batch.
*   **Pro:** Larger files, unlimited batch, advanced editor, OCR.

---


---

## 11. SOPs & Invariants
1.  **"Data-First" Rule:** Define Data Schema in `gemini.md` before building.
2.  **Self-Annealing:** Analyze -> Patch -> Test -> Update Architecture.
3.  **Client-Only Default:** All tools must work offline/local-only unless explicitly cloud-dependent.
4.  **B.L.A.S.T. Protocol:** Follow the phases.
5.  **Abstraction Layers:** All external I/O (Database, Auth, Storage) must be wrapped in **Service Interfaces**.
    *   *Rule:* UI components must never import vendor SDKs (e.g., `supabase-js`) directly. They must use `userService`, `storageService`, etc.
    *   *Goal:* Ability to swap backend providers (e.g., Supabase -> Firebase) without touching UI code.