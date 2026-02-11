# Modufile Brand & Design Constitution

## 1. Brand Personality & Voice

**Archetype:** The "Architect" mixed with the "Guardian."
*   **Architect:** We build precise, structured tools that empower users to construct their workflows.
*   **Guardian:** We intricately protect their data and privacy.

**Voice Attributes:**
*   **Concise:** We don't waste pixels or words. (Like Vercel)
*   **Transparent:** We explain *how* it works locally to build trust. (Like Signal)
*   **Calm:** No aggressive upsells or flashy distractions. (Like Linear)
*   **Competent:** We speak like engineers and marketers.

**What Modufile IS:**
*   A Swiss Army Knife.
*   A clean, well-lit workshop.
*   A privacy fortress.

**What Modufile is NOT:**
*   A "growth hack" tool with popups.
*   A colorful, childish playground (like Canva).
*   A faceless corporate utility (like Adobe).

---

## 2. Global Color System (Semantic Tokens)

We use a semantic token system to ensure consistency. These tokens map to our core palette (Zinc, Signal Blue, Privacy Purple).

### Brand
| Token | Light Mode | Dark Mode | Description |
| :--- | :--- | :--- | :--- |
| `brand.bg` | `#FFFFFF` | `#09090B` | App root background |
| `brand.primary` | `#3A76F0` | `#3A76F0` | Main action color (Signal Blue) |
| `brand.primaryHover` | `#2563EB` | `#60A5FA` | Hover state for primary actions |
| `brand.primaryActive` | `#1D4ED8` | `#3B82F6` | Active/Pressed state |
| `brand.accent` | `#6D4AFF` | `#6D4AFF` | Secondary/Magic actions (Privacy Purple) |
| `brand.accentHover` | `#5B21B6` | `#7C3AED` | Hover for accent |
| `brand.focusRing` | `#3A76F0` (30%) | `#3A76F0` (50%) | Focus outline glow |

### Background
| Token | Light Mode | Dark Mode | Description |
| :--- | :--- | :--- | :--- |
| `background.app` | `#FCFCFD` | `#09090B` | Base canvas (slightly off-white for light) |
| `background.surface` | `#FFFFFF` | `#18181B` | Cards, panels, tool containers |
| `background.surfaceHover` | `#F4F4F5` | `#27272A` | Hover state for interactive surfaces |
| `background.raised` | `#FFFFFF` | `#27272A` | Modals, dropdowns (needs shadow) |
| `background.overlay` | `#000000` (40%) | `#000000` (60%) | Backdrop overlays |
| `background.inset` | `#F4F4F5` | `#09090B` | Input backgrounds, code blocks |

### Border
| Token | Light Mode | Dark Mode | Description |
| :--- | :--- | :--- | :--- |
| `border.default` | `#E4E4E7` | `#27272A` | Standard borders (Cards, Inputs) |
| `border.subtle` | `#F4F4F5` | `#18181B` | Dividers within minimal components |
| `border.strong` | `#D4D4D8` | `#3F3F46` | Emphasis borders |
| `border.interactive` | `#A1A1AA` | `#52525B` | Hover states for borders |
| `border.focus` | `#3A76F0` | `#3A76F0` | Active input borders |

### Text
| Token | Light Mode | Dark Mode | Description |
| :--- | :--- | :--- | :--- |
| `text.primary` | `#18181B` | `#F4F4F5` | Main headings and body |
| `text.secondary` | `#71717A` | `#A1A1AA` | Descriptions, labels |
| `text.tertiary` | `#A1A1AA` | `#52525B` | Placeholders, disabled text |
| `text.inverse` | `#FFFFFF` | `#FFFFFF` | Text on brand backgrounds |
| `text.link` | `#3A76F0` | `#60A5FA` | Interactive links |

### Semantic (Status)
| Status | Background | Text | Border |
| :--- | :--- | :--- | :--- |
| **Success** | `#ECFDF5` / `#064E3B` | `#047857` / `#34D399` | `#A7F3D0` / `#059669` |
| **Warning** | `#FFFBEB` / `#451A03` | `#B45309` / `#FCD34D` | `#FDE68A` / `#D97706` |
| **Error** | `#FEF2F2` / `#450A0A` | `#B91C1C` / `#F87171` | `#FECACA` / `#DC2626` |
| **Info** | `#EFF6FF` / `#172554` | `#1D4ED8` / `#60A5FA` | `#BFDBFE` / `#2563EB` |

### Component Specifics
*   **Button Primary:** `brand.primary` background, `text.inverse` text.
*   **Button Secondary:** `background.surface` background, `border.default` border, `text.primary` text.
*   **Input:** `background.surface` (or `inset`) background, `border.default` border. Focus: `border.focus` + `brand.focusRing`.
*   **Sidebar:** `background.app` (Light) / `background.surface` (Dark).

### File Status Colors
*   **Processing:** `#3A76F0` (Blue - Pulse)
*   **Ready:** `#10B981` (Emerald)
*   **Failed:** `#EF4444` (Red)
*   **Queued:** `#71717A` (Gray)

### File Type Colors (Icons/Badges)
*   **PDF:** `#EF4444` (Red)
*   **Image:** `#3A76F0` (Blue)
*   **Spreadsheet:** `#10B981` (Green)
*   **Code:** `#6D4AFF` (Purple)
*   **Archive:** `#F59E0B` (Amber)
*   **Unknown:** `#71717A` (Gray)

---

## 3. Typography System

**Primary Font:** **Inter** (Variable)
*   *Why:* The standard for modern SaaS. Highly legible, neutral, and features excellent tabular figures for data.
*   *Weights:* Regular (400), Medium (500), Semibold (600). Avoid Bold (700) except for huge headers.
*   *Tracking:* Tight tracking (`-0.025em`) on headings for that "San Francisco" feel.

**Mono Font:** **JetBrains Mono** or **Geist Mono**
*   *Usage:* File paths, sizes, logs, JSON data, checksums.
*   *Why:* Reinforces the "Developer Tool" aesthetic and precision.

---

## 4. UI Design Principles

### Layout Philosophy: "The Bento Box"
*   **Density:** Medium-High. Like Linear, we want to show information efficiently.
*   **Borders:** Subtle 1px borders (`Zinc-200` light / `Zinc-800` dark) define structure.
*   **Whitespace:** Intentional but not excessive.

### Component Styles
*   **Buttons:**
    *   *Primary:* Solid Black (Light Mode) / Solid White (Dark Mode). Height: 40px. Radius: 6px.
    *   *Action:* Solid Blue (`#3A76F0`).
    *   *Secondary:* White with 1px Border/Shadow.
*   **Cards:**
    *   Flat, 1px border. No drop shadows in default state.
    *   *Hover:* Slight interaction lift + subtle shadow (`shadow-sm`).
*   **Inputs:**
    *   Minimalist. No background. Bottom border or 1px full border.
    *   Focus ring: Blue glow (`ring-2 ring-blue-500/20`).
*   **Radius:**
    *   Small: `4px` (Tags, checkboxes)
    *   Medium: `6px` (Buttons, Inputs)
    *   Large: `12px` (Modals, Large Cards)

---

## 5. Interaction & Motion Guidelines

*   **Speed:** Instant. 150ms transitions. `ease-out`.
*   **Feedback:** Every click has a state.
*   **Loaders:**
    *   *indeterminate:* Slim blue progress bar at very top (GitHub/YouTube style).
    *   *Processing:* Mathematical/Geometric loaders (e.g., a spinning hexagon), not generic spinners.
*   **Drag & Drop:** The entire "Dropzone" should pulse or highlight (`bg-blue-500/10`, `border-blue-500`) when a file enters the window.

---

## 6. Accessibility & Trust Signals

*   **Contrast:** All text must meet WCAG AA.
*   **Focus:** Visible focus rings on everything navigable by keyboard.
*   **Trust Badges:**
    *   "🛡️ Client-Side Only" badge visible near every "Convert" button.
    *   "Offline Ready" indicator in the footer.

---

## 7. Light/Dark Mode Strategy

*   **Default:** System Preference.
*   **Light Mode:** Paper-like. `bg-white` cards on `bg-zinc-50` background.
*   **Dark Mode:** Deep space. `bg-zinc-900` cards on `bg-black` background.
*   **Strategy:** Modufile should look like a "Professional Tool" in Dark Mode (like VS Code).

---

## 8. Brand Imagery

*   **No Illustrations:** Avoid "Big Tech Art" (flat humans with purple skin).
*   **Iconography:** `Lucide React` icons. Stroke width: `1.5px` or `2px`. Precise, consistent.
*   **Visuals:** Use **Abstract Geometry** or **Technical Schematics** for backgrounds.
    *   *Example:* A subtle grid pattern or a blurred wireframe of a file structure.

---

## 9. Competitive Differentiation

| Competitor | Their Vibe | Modufile Vibe |
| :--- | :--- | :--- |
| **SmallPDF** | Colorful, Bouncy, Consumer | Precise, Monochromatic, Engineer |
| **iLovePDF** | Cluttered, Ad-heavy | Clean, Zen, Ad-free feel |
| **Adobe** | Corporate, Heavy, Login-wall | Lightweight, Instant, Open |

**The "Modufile Difference":**
We treat the user like an adult who wants to get work done, not a customer to be funnelled.

---

## 10. Frontend Engineering Handoff

### Tailwind Config (Draft)
```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-inter)', ...fontFamily.sans],
      mono: ['var(--font-jetbrains)', ...fontFamily.mono],
    },
    colors: {
      brand: {
        DEFAULT: '#09090B',
        blue: '#3A76F0',
        purple: '#6D4AFF',
      }
    },
    borderRadius: {
      'DEFAULT': '6px',
    }
  }
}
```

### Implementation Rules
1.  **Shadcn/UI:** Use as the base component library. It aligns 100% with this aesthetic (Zinc theme).
2.  **Lucide Icons:** Use exclusively.
3.  **Motion:** Use `framer-motion` for complex states (file lists reordering), CSS transitions for simple hover states.

---

## 11. Site Map & Page Architecture

### A. Core Navigation Pages
*   **Homepage (`/`)**
    *   *Hero:* Large "Drag & Drop" zone immediately visible. North Star value prop.
    *   *Quick Tools:* Grid of top 6 tools (Merge PDF, Compress Image, etc.).
    *   *Recent Files:* (Client-side usage history) "Continue working on...".
    *   *Trust Section:* "How Modufile protects your data" (Visual explainer of Client-side processing).
*   **About (`/about`)**
    *   Manifesto on privacy-first software.
*   **Auth Pages** (Minimalist, centered card layout)
    *   `login`, `signup`, `forgot-password`.
    *   Auth providers: Google, GitHub, Magic Link.
*   **Contact & Support (`/contact`)**
    *   *Support Form:* Subject (Dropdown: Bug, Privacy, Feature), Message, file attachment (optional).
    *   *Direct Contact:* `mailto:contact@modufile.com` clearly visible.
    *   *Trust:* "We usually reply within 24 hours."

### B. The "Workbench" (Tool Interfaces)
*   **Generic Tool Layout (`/tool/[slug]`)**
    *   *Header:* Tool Name, Breadcrumbs, Settings Button.
    *   *Main Stage:* Large Dropzone -> File List / Preview.
    *   *Sidebar (Collapsible):* Tool-specific options (e.g., Compression quality slider).
    *   *Action Bar:* Floating bottom bar: "Process 5 Files" (Primary Action).
*   **PDF Studio (`/pdf/editor`)**
    *   *Left Sidebar:* Page thumbnails (reorder/delete via drag-drop).
    *   *Top Toolbar:* Tools (Text, Image, Whiteout, Shape, Sign).
    *   *Main View:* PDF.js Canvas renderer with Overlay layer.
    *   *Right Sidebar:* Properties panel (Font size, Color) for selected annotation.
*   **Image Lab (`/image/convert`, `/image/compress`)**
    *   *Split View:* Before vs After slider (for compression).
    *   *Grid View:* Bulk conversion status.
*   **Video Station (`/video/trim`)**
    *   *Timeline View:* Waveform visualization + trim handles.

### C. Legal & Trust (Footer Links)
*   **Privacy Policy (`/legal/privacy`)**
    *   Plain English summary at the top, legalese below.
    *   Explicit section on "We do not see your files."
*   **Terms of Service (`/legal/terms`)**
*   **Do Not Sell My Data (`/legal/do-not-sell-my-data`)**
    *   A simple toggle (that does nothing but confirm we don't hold data anyway, or disables analytics).
*   **Cookie Policy (`/legal/cookies/`)**

### D. SEO Landing Pages (Programmatically Generated)
*   **Pattern:** `/convert/[from]-to-[to]` (e.g., `/convert/pdf-to-jpg`)
    *   *Above Fold:* The actual tool (Drag & Drop). Immediate utility.
    *   *Below Fold:*
        *   "How to convert [X] to [Y]" (Step-by-step guide with Schema markup).
        *   "Why use Modufile?" (Privacy/Speed benefits).
        *   FAQ Section.
        *   Related Tools links.
*   **Top High-Volume Pages:**
    *   `/pdf/merge`
    *   `/pdf/split`
    *   `/pdf/compress`
    *   `/image/compress`
    *   `/video/to-gif`

### E. User Dashboard (`/dashboard`)
*   *Settings:* Account management, billing portal.
*   *History:* Local storage history of processed files (clearable).
*   *Presets:* Saved workflow settings (e.g., "My Watermark", "Standard Compression").

---

## 12. Feature Matrix & Requirements

| Page/Tool | Essential Features | Technical Requirement |
| :--- | :--- | :--- |
| **PDF Editor** | Overlay text, Image insert, Draw, Whiteout | `pdf-lib` (write), `pdf.js` (read) |
| **PDF Organize** | Merge, Split, Rotate, Sort | `pdf-lib` |
| **PDF Compress** | Reduce file size | `qpdf` WASM or `ghostscript` WASM |
| **Image Convert** | HEIC/WebP/AVIF -> JPG/PNG | `magick-wasm` |
| **Image Compress** | Lossy/Lossless optimization | `squoosh` logic |
| **Video Trim** | Cut start/end, Transcode container | `ffmpeg.wasm` (SharedArrayBuffer) |
| **Spreadsheet** | View/Edit CSV/XLSX | `sheetjs` + `luckysheet` (or virtual list) |
| **OCR** | Extract text from Image/PDF | `tesseract.js` (Worker) |
| **Global** | Batch Processing, Zip Download | `jszip` |