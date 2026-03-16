'use client';

import { ArrowLeft, Heart, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface LibraryEntry {
    name: string;
    description: string;
    url: string;
    license: string;
    licenseUrl: string;
    author?: string;
    agpl?: boolean;
}

const LIBRARY_GROUPS: { heading: string; libraries: LibraryEntry[] }[] = [
    {
        heading: 'Framework & Runtime',
        libraries: [
            {
                name: 'Next.js',
                description: 'React framework with App Router, static export, and edge runtime.',
                url: 'https://nextjs.org',
                license: 'MIT',
                licenseUrl: 'https://github.com/vercel/next.js/blob/canary/license.md',
                author: 'Vercel',
            },
            {
                name: 'React',
                description: 'The library for building user interfaces.',
                url: 'https://react.dev',
                license: 'MIT',
                licenseUrl: 'https://github.com/facebook/react/blob/main/LICENSE',
                author: 'Meta',
            },
            {
                name: 'TypeScript',
                description: 'Typed superset of JavaScript that compiles to plain JS.',
                url: 'https://www.typescriptlang.org',
                license: 'Apache-2.0',
                licenseUrl: 'https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt',
                author: 'Microsoft',
            },
        ],
    },
    {
        heading: 'PDF Processing',
        libraries: [
            {
                name: 'MuPDF',
                description: 'High-performance PDF engine used for rendering, annotation, and permanent content-stream redaction via WebAssembly.',
                url: 'https://mupdf.com',
                license: 'AGPL-3.0',
                licenseUrl: 'https://www.gnu.org/licenses/agpl-3.0.html',
                author: 'Artifex Software, Inc.',
                agpl: true,
            },
            {
                name: 'Ghostscript',
                description: 'PostScript and PDF interpreter used for advanced PDF compression via WebAssembly.',
                url: 'https://www.ghostscript.com',
                license: 'AGPL-3.0',
                licenseUrl: 'https://www.gnu.org/licenses/agpl-3.0.html',
                author: 'Artifex Software, Inc.',
                agpl: true,
            },
            {
                name: 'PyMuPDF',
                description: 'Python bindings for MuPDF, used for PDF-to-Word and PDF-to-Excel conversion via Pyodide WASM.',
                url: 'https://pymupdf.readthedocs.io',
                license: 'AGPL-3.0',
                licenseUrl: 'https://www.gnu.org/licenses/agpl-3.0.html',
                author: 'Artifex Software, Inc.',
                agpl: true,
            },
            {
                name: 'PDF.js',
                description: "Mozilla's PDF renderer — used for page rendering and text extraction in the browser.",
                url: 'https://mozilla.github.io/pdf.js/',
                license: 'Apache-2.0',
                licenseUrl: 'https://github.com/mozilla/pdf.js/blob/master/LICENSE',
                author: 'Mozilla',
            },
            {
                name: 'pdf-lib',
                description: 'Create and modify PDFs in JavaScript — used for merging, metadata editing, watermarking, and page operations.',
                url: 'https://pdf-lib.js.org',
                license: 'MIT',
                licenseUrl: 'https://github.com/Hopding/pdf-lib/blob/master/LICENSE.md',
                author: 'Andrew Dillon',
            },
        ],
    },
    {
        heading: 'Office & Document Formats',
        libraries: [
            {
                name: 'Pyodide',
                description: 'Python runtime compiled to WebAssembly — hosts the PyMuPDF environment for document conversion in the browser.',
                url: 'https://pyodide.org',
                license: 'MPL-2.0',
                licenseUrl: 'https://github.com/pyodide/pyodide/blob/main/LICENSE',
                author: 'Mozilla / Pyodide contributors',
            },
            {
                name: 'LibreOffice WASM (Zeta)',
                description: 'LibreOffice compiled to WebAssembly for in-browser Office-to-PDF conversion.',
                url: 'https://www.libreoffice.org',
                license: 'MPL-2.0 / LGPL-3.0+',
                licenseUrl: 'https://www.libreoffice.org/about-us/licenses/',
                author: 'The Document Foundation',
            },
            {
                name: 'SheetJS',
                description: 'Spreadsheet data parsing and writing — used for Excel (XLSX) conversion.',
                url: 'https://sheetjs.com',
                license: 'Apache-2.0',
                licenseUrl: 'https://github.com/SheetJS/sheetjs/blob/master/LICENSE',
                author: 'SheetJS LLC',
            },
            {
                name: 'docx',
                description: 'Generate .docx Word documents in JavaScript.',
                url: 'https://docx.js.org',
                license: 'MIT',
                licenseUrl: 'https://github.com/dolanmiu/docx/blob/master/LICENSE',
                author: 'Dolan Miu',
            },
            {
                name: 'PptxGenJS',
                description: 'Create PowerPoint PPTX presentations in JavaScript.',
                url: 'https://gitbrent.github.io/PptxGenJS/',
                license: 'MIT',
                licenseUrl: 'https://github.com/gitbrent/PptxGenJS/blob/master/LICENSE',
                author: 'Brent Ely',
            },
        ],
    },
    {
        heading: 'Image & Media',
        libraries: [
            {
                name: 'ImageMagick WASM',
                description: 'ImageMagick compiled to WebAssembly for image conversion, resizing, and format support (HEIC, AVIF, WebP, TIFF).',
                url: 'https://imagemagick.org',
                license: 'Apache-2.0',
                licenseUrl: 'https://imagemagick.org/script/license.php',
                author: 'ImageMagick Studio LLC',
            },
            {
                name: 'FFmpeg.wasm',
                description: 'FFmpeg compiled to WebAssembly for video and audio processing in the browser.',
                url: 'https://ffmpegwasm.netlify.app',
                license: 'LGPL-2.1',
                licenseUrl: 'https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/LICENSE',
                author: 'Jerome Wu',
            },
        ],
    },
    {
        heading: 'OCR',
        libraries: [
            {
                name: 'Tesseract.js',
                description: 'Pure JavaScript OCR engine supporting 100+ languages — extracts text from images and scanned PDFs.',
                url: 'https://tesseract.projectnaptha.com',
                license: 'Apache-2.0',
                licenseUrl: 'https://github.com/naptha/tesseract.js/blob/master/LICENSE.md',
                author: 'Project Naptha',
            },
        ],
    },
    {
        heading: 'UI & Interactions',
        libraries: [
            {
                name: 'Tailwind CSS',
                description: 'Utility-first CSS framework used for all styling.',
                url: 'https://tailwindcss.com',
                license: 'MIT',
                licenseUrl: 'https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE',
                author: 'Tailwind Labs',
            },
            {
                name: 'Framer Motion',
                description: 'Production-ready motion library for React.',
                url: 'https://www.framer.com/motion/',
                license: 'MIT',
                licenseUrl: 'https://github.com/framer/motion/blob/main/LICENSE.md',
                author: 'Framer',
            },
            {
                name: 'Lucide React',
                description: 'Beautiful and consistent open-source icon set.',
                url: 'https://lucide.dev',
                license: 'ISC',
                licenseUrl: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE',
                author: 'Lucide contributors',
            },
            {
                name: 'dnd kit',
                description: 'Lightweight, performant drag-and-drop toolkit for React — used for reordering PDF pages.',
                url: 'https://dndkit.com',
                license: 'MIT',
                licenseUrl: 'https://github.com/clauderic/dnd-kit/blob/master/LICENSE',
                author: 'Claudéric Demers',
            },
            {
                name: 'tailwind-merge',
                description: 'Utility to merge Tailwind CSS class names without conflicts.',
                url: 'https://github.com/dcastil/tailwind-merge',
                license: 'MIT',
                licenseUrl: 'https://github.com/dcastil/tailwind-merge/blob/v1/LICENSE.md',
                author: 'Dany Castillo',
            },
            {
                name: 'clsx',
                description: 'Tiny utility for constructing className strings conditionally.',
                url: 'https://github.com/lukeed/clsx',
                license: 'MIT',
                licenseUrl: 'https://github.com/lukeed/clsx/blob/master/license',
                author: 'Luke Edwards',
            },
        ],
    },
    {
        heading: 'State & Storage',
        libraries: [
            {
                name: 'Zustand',
                description: 'Small, fast, and scalable state management for React.',
                url: 'https://zustand-demo.pmnd.rs',
                license: 'MIT',
                licenseUrl: 'https://github.com/pmndrs/zustand/blob/main/LICENSE',
                author: 'Poimandres',
            },
            {
                name: 'idb',
                description: 'IndexedDB with a promise-based API — used for local persistence.',
                url: 'https://github.com/jakearchibald/idb',
                license: 'ISC',
                licenseUrl: 'https://github.com/jakearchibald/idb/blob/main/LICENSE',
                author: 'Jake Archibald',
            },
        ],
    },
    {
        heading: 'Utilities',
        libraries: [
            {
                name: 'fflate',
                description: 'High-performance (de)compression in pure JavaScript — used for ZIP and GZIP operations.',
                url: 'https://github.com/101arrowz/fflate',
                license: 'MIT',
                licenseUrl: 'https://github.com/101arrowz/fflate/blob/master/LICENSE',
                author: 'Arjun Barrett',
            },
        ],
    },
];

const LICENSE_COLORS: Record<string, string> = {
    'MIT': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'Apache-2.0': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    'ISC': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'LGPL-2.1': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    'MPL-2.0': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    'MPL-2.0 / LGPL-3.0+': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    'AGPL-3.0': 'bg-red-500/15 text-red-400 border-red-500/25',
};

function LicenseBadge({ license, url }: { license: string; url: string }) {
    const colorClass = LICENSE_COLORS[license] ?? 'bg-zinc-700/50 text-zinc-400 border-zinc-600';
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono font-semibold tracking-wide hover:opacity-80 transition-opacity ${colorClass}`}
        >
            {license}
        </a>
    );
}

function LibraryCard({ lib }: { lib: LibraryEntry }) {
    return (
        <a
            href={lib.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-2.5 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200"
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-zinc-100 group-hover:text-white text-sm transition-colors">
                    {lib.name}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0 mt-0.5 transition-colors" />
            </div>

            {lib.author && (
                <p className="text-[11px] text-zinc-600">by {lib.author}</p>
            )}

            <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                {lib.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
                <LicenseBadge license={lib.license} url={lib.licenseUrl} />
                {lib.agpl && (
                    <span className="text-[10px] text-red-500/70">commercial use requires Artifex license</span>
                )}
            </div>
        </a>
    );
}

export default function ThanksPage() {
    return (
        <div className="min-h-screen bg-black text-zinc-100">
            <div className="max-w-5xl mx-auto px-6 py-20">

                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 group text-sm">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                {/* Hero */}
                <div className="mb-14">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
                        Open Source <span className="text-[#3A76F0]">Credits</span>
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
                        Modufile is built entirely on open-source software. We are grateful to every maintainer and contributor whose work makes this possible.
                    </p>
                </div>

                {/* AGPL Notice */}
                <div className="mb-14 p-5 rounded-xl border border-red-500/25 bg-red-950/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-red-400">AGPL-3.0 License Notice</p>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                This application uses{' '}
                                <strong className="text-zinc-300">MuPDF</strong>,{' '}
                                <strong className="text-zinc-300">Ghostscript</strong>, and{' '}
                                <strong className="text-zinc-300">PyMuPDF</strong>{' '}
                                — all © Artifex Software, Inc. and licensed under the{' '}
                                <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline underline-offset-2">
                                    GNU Affero General Public License v3.0
                                </a>.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-start gap-2.5 text-sm">
                                    <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                                    <span className="text-zinc-400">
                                        <strong className="text-zinc-300">Open source use:</strong> Fully permitted.
                                        The AGPL requires that source code of any application using these components
                                        (including over a network) be publicly available.
                                        This repository satisfies that requirement.
                                    </span>
                                </div>
                                <div className="flex items-start gap-2.5 text-sm">
                                    <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                                    <span className="text-zinc-400">
                                        <strong className="text-zinc-300">Proprietary / commercial use:</strong>{' '}
                                        If you build a closed-source product using this code or the WASM binaries,
                                        you must obtain a commercial license from{' '}
                                        <a href="https://artifex.com/licensing/" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline underline-offset-2">
                                            Artifex Software
                                        </a>.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Library groups */}
                <div className="space-y-14">
                    {LIBRARY_GROUPS.map((group) => (
                        <section key={group.heading}>
                            <h2 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-5 pb-3 border-b border-zinc-900">
                                {group.heading}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {group.libraries.map((lib) => (
                                    <LibraryCard key={lib.name} lib={lib} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-20 pt-10 border-t border-zinc-900 text-center space-y-3">
                    <p className="text-xs text-zinc-700">
                        Missing a credit or incorrect license?{' '}
                        <a
                            href="https://github.com/modufile/modufile/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-600 hover:text-zinc-400 underline underline-offset-2 transition-colors"
                        >
                            Open an issue on GitHub
                        </a>.
                    </p>
                </div>

            </div>
        </div>
    );
}
