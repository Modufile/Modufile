# Task Plan

## Phases & Goals

### Phase 1: B - Blueprint [COMPLETE]
- [x] Vision & Schema
- [x] Research
- [x] Feature Mapping

### Phase 2: L - Link [COMPLETE]
- [x] Scaffold Next.js Project
- [x] `next.config.js` Headers (SharedArrayBuffer)
- [x] Handshake Lab (`/lab`)

### Phase 3: A - Architect (Tool Implementation) [COMPLETE]
- [x] **Core Infrastructure**:
    - `magick.ts` (WASM singleton)
    - `download.ts` (Zip/Blob helpers)
    - Shared UI Components (`ToolPageLayout`, `FloatingActionBar`)
- [x] **PDF Tools (`pdf-lib`)**:
    - [x] Merge
    - [x] Split (Extract/Burst)
    - [x] Rotate
    - [x] Remove Pages
    - [x] Extract Pages
    - [x] Watermark
    - [x] Metadata
    - [x] Flatten
- [x] **Image Tools (`magick-wasm`)**:
    - [x] Convert (Universal)
    - [x] Compress (Quality/Format)
    - [x] Resize & Crop
    - [x] Batch Processor (Pipeline)
- [x] **OCR (`tesseract.js`)**:
    - [x] Image to Text

### Phase 4: S - Stylize (UI/UX) [COMPLETE]
- [x] Design System Definition (`design.md`)
- [x] Homepage Layout & Grid
- [x] Consistent Tool Layouts
- [x] Final Polish (Animations, Transitions)
- [x] Mobile Responsiveness Checks (via simplistic layout)

### Phase 5: T - Trigger [IN PROGRESS]
- [x] **Config**: Configure `output: 'export'` for Next.js.
- [x] **Guide**: Create deployment verification guide.
- [ ] **CI/CD**: Create GitHub Actions workflow (`deploy.yml`) for Playwright + Cloudflare.
- [ ] **Deploy**: Connect Cloudflare Pages.
- [ ] **Testing**: Full E2E with Playwright.
