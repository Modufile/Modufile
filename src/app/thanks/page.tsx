import { ArrowLeft, Star, Heart, Code2, Cpu, Box, Share2, Layers, Type, Image as ImageIcon, Video, Database, CheckSquare } from 'lucide-react';
import Link from 'next/link';

interface Library {
    name: string;
    description: string;
    url: string;
    icon: React.ReactNode;
}

const libraries: Library[] = [
    // Core
    { name: 'Next.js', description: 'The React Framework for the Web', url: 'https://nextjs.org', icon: <Cpu className="w-4 h-4" /> },
    { name: 'React', description: 'The library for web and native user interfaces', url: 'https://react.dev', icon: <Code2 className="w-4 h-4" /> },
    { name: 'Tailwind CSS', description: 'A utility-first CSS framework', url: 'https://tailwindcss.com', icon: <Layers className="w-4 h-4" /> },

    // PDF Engines
    { name: 'MuPDF.js', description: 'High-performance PDF rendering & redaction (WASM)', url: 'https://mupdf.com', icon: <Box className="w-4 h-4 text-emerald-400" /> },
    { name: 'PDF-Lib', description: 'Create and modify PDF documents in JavaScript', url: 'https://pdf-lib.js.org', icon: <Box className="w-4 h-4" /> },
    { name: 'PDF.js', description: 'PDF Reader in JavaScript', url: 'https://mozilla.github.io/pdf.js/', icon: <Box className="w-4 h-4" /> },

    // Media & Processing
    { name: 'FFmpeg.wasm', description: 'Video & Audio processing in browser', url: 'https://ffmpegwasm.netlify.app', icon: <Video className="w-4 h-4" /> },
    { name: 'ImageMagick', description: 'Image manipulation (WASM)', url: 'https://imagemagick.org', icon: <ImageIcon className="w-4 h-4" /> },
    { name: 'Tesseract.js', description: 'Pure Javascript OCR for 100+ Languages', url: 'https://tesseract.projectnaptha.com', icon: <Type className="w-4 h-4" /> },
    { name: 'Sharp', description: 'High performance Node.js image processing', url: 'https://sharp.pixelplumbing.com', icon: <ImageIcon className="w-4 h-4" /> },

    // UI & Interactions
    { name: 'Framer Motion', description: 'Motion library for React', url: 'https://www.framer.com/motion/', icon: <Share2 className="w-4 h-4" /> },
    { name: 'Lucide React', description: 'Beautiful & consistent icons', url: 'https://lucide.dev', icon: <Star className="w-4 h-4" /> },
    { name: 'Sonner', description: 'An opinionated toast component for React', url: 'https://sonner.emilkowal.ski', icon: <CheckSquare className="w-4 h-4" /> },
    { name: 'DnD Kit', description: 'Modern drag & drop toolkit for React', url: 'https://dndkit.com', icon: <Box className="w-4 h-4" /> },

    // Utilities
    { name: 'Zustand', description: 'Small, fast and scalable state-management', url: 'https://zustand-demo.pmnd.rs', icon: <Database className="w-4 h-4" /> },
    { name: 'IDB', description: 'IndexedDB, but with promises', url: 'https://github.com/jakearchibald/idb', icon: <Database className="w-4 h-4" /> },
    { name: 'fflate', description: 'High performance (de)compression in pure JS', url: 'https://github.com/101arrowz/fflate', icon: <Box className="w-4 h-4" /> },
];

export default function ThanksPage() {
    return (
        <div className="min-h-screen bg-black text-zinc-100 selection:bg-[#3A76F0] selection:text-white">
            <div className="max-w-4xl mx-auto px-6 py-24">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <MotionHeader />

                <div className="space-y-16">
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Heart className="w-6 h-6 text-red-500 fill-red-500/20" />
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                                Open Source Credits
                            </h2>
                        </div>
                        <p className="text-zinc-400 mb-10 text-lg leading-relaxed max-w-2xl">
                            Modufile is made possible by these incredible open source projects. We are deeply grateful to the maintainers and contributors who build the foundation of the modern web.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {libraries.map((lib) => (
                                <a
                                    key={lib.name}
                                    href={lib.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-300 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                                            {lib.icon}
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                            <Share2 className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-zinc-200 group-hover:text-white mb-1 transition-colors">
                                        {lib.name}
                                    </h3>
                                    <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors line-clamp-2">
                                        {lib.description}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </section>

                    <section className="pt-16 border-t border-zinc-900">
                        <div className="text-center">
                            <p className="text-zinc-500 text-sm">
                                Built with <Heart className="w-3 h-3 inline text-red-500 mx-1 align-baseline" /> using Next.js & Cloudflare
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function MotionHeader() {
    return (
        <div className="mb-16">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Thank <span className="text-[#3A76F0]">You</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                Software is a collaborative effort. We stand on the shoulders of giants.
            </p>
        </div>
    );
}
