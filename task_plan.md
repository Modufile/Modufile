# Task Plan

## Phases & Goals

### Phase 1: B - Blueprint [COMPLETE]
- [x] Vision & Schema
- [x] Research
- [x] Feature Mapping

### Phase 2: L - Link [NEXT]
- [ ] Scaffold Next.js Project
- [ ] `next.config.js` Headers
- [ ] Handshake Lab (`/lab`)

### Phase 3: A - Architect
- [ ] **SOPs**: Create Architecture docs for:
    - `routing.md` (Micro-tool URL structure)
    - `wasm_worker.md` (Worker thread patterns)
    - `storage.md` (IndexedDB file handling)
    - `services.md` (Service Layer & Adapter Pattern)
- [ ] **Core Components**:
    - [ ] Define `createService` interfaces (Auth, DB, Storage).
    - [ ] Implement Supabase Adapters.

### Phase 4: S - Stylize [IN PROGRESS]
- [x] Design System Definition (`design.md`)
- [ ] Component Library Install (Shadcn/UI)
- [ ] Landing Page

### Phase 5: T - Trigger
- [ ] **CI/CD**: Create GitHub Actions workflow (`deploy.yml`) for Playwright + Cloudflare.
- [ ] **Deploy**: Connect Cloudflare Pages.

