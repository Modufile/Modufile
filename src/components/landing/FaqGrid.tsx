'use client';

import { motion } from 'framer-motion';
import { Shield, WifiOff, Cpu, Database, Github, Users, ArrowRight, Smartphone, Laptop } from 'lucide-react';

const cards = [
    {
        id: '01',
        title: 'How is it 100% private?',
        description: 'We utilize a local-only architecture. Your files never leave your device; all processing happens in-browser via WebAssembly.',
        icon: Shield,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        colSpan: 'col-span-1 md:col-span-2 lg:col-span-1',
    },
    {
        id: '02',
        title: 'Can I use it offline?',
        description: 'Yes. Modufile is a Progressive Web App (PWA). Once loaded, it caches the core engine and functions entirely without an internet connection.',
        icon: WifiOff,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        colSpan: 'col-span-1 md:col-span-2 lg:col-span-1',
    },
    {
        id: '03',
        title: 'What libraries do you use?',
        description: 'We utilize pdf-lib for PDF manipulation, @imagemagick/magick-wasm for image processing, and mupdf for robust rendering.',
        icon: Cpu,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        colSpan: 'col-span-1 md:col-span-2 lg:col-span-1',
        tags: ['pdf-lib', 'imagemagick', 'mupdf', 'tesseract.js']
    },
    {
        id: '04',
        title: 'Local-Only Loop',
        description: 'Data flows strictly between your device storage and the browser sandbox. No server uploads, no metadata leakage.',
        icon: Database,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
        colSpan: 'col-span-1 md:col-span-2 lg:col-span-2',
        hasVisual: true
    },
    {
        id: '05',
        title: 'What about file size limits?',
        description: 'File size is limited only by your browser\'s allocated memory. Generally, files up to 1GB are handled smoothly on modern devices.',
        icon: Database,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        colSpan: 'col-span-1 md:col-span-2 lg:col-span-1',
    },
    {
        id: '06',
        title: 'Is the project open source?',
        description: 'Absolutely. We believe trust is earned through transparency. Our core components are available for audit.',
        icon: Github,
        color: 'text-white',
        bg: 'bg-zinc-800',
        colSpan: 'col-span-1 md:col-span-2 lg:col-span-1',
    }
];

export function FaqGrid() {
    return (
        <section className="py-24 bg-[#09090B]">
            <div className="max-w-6xl mx-auto px-6">

                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px w-8 bg-blue-500"></div>
                        <span className="text-blue-500 text-xs font-mono uppercase tracking-widest">Technical Specs</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Transparency by Design.</h2>
                    <p className="text-zinc-400 max-w-2xl text-lg">
                        Modufile operates on a zero-trust, local-first architecture.
                        Explore how our protocols keep your data yours.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => (
                        <motion.div
                            key={card.id}
                            className={`group relative p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors ${card.colSpan}`}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Card ID */}
                            <span className="absolute top-8 right-8 text-zinc-800 text-xs font-mono font-bold">{card.id}</span>

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color} mb-6`}>
                                <card.icon className="w-6 h-6" />
                            </div>

                            {/* Content */}
                            <div className={card.hasVisual ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : ''}>
                                <div>
                                    <h3 className="text-xl font-semibold text-zinc-100 mb-3">{card.title}</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                        {card.description}
                                    </p>

                                    {/* Library Tags */}
                                    {card.tags && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {card.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 font-mono">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Local Loop Visual */}
                                {card.hasVisual && (
                                    <div className="relative h-40 md:h-auto flex items-center justify-center overflow-hidden">
                                        <div className="flex items-center gap-12 relative z-10">
                                            {/* Device Node */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-lg border border-blue-500/30 bg-blue-500/10 flex items-center justify-center">
                                                    <Laptop className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Device</span>
                                            </div>

                                            {/* Browser Node */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-lg border border-purple-500/30 bg-purple-500/10 flex items-center justify-center">
                                                    <Smartphone className="w-5 h-5 text-purple-500" />
                                                </div>
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Sandbox</span>
                                            </div>

                                            {/* Connecting line */}
                                            <div className="absolute top-[24px] left-[24px] right-[24px] h-[1px] bg-zinc-800 -z-10"></div>

                                            {/* Moving Dot */}
                                            <motion.div
                                                className="absolute top-[21px] left-[24px] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                                animate={{
                                                    x: [0, 80, 0],
                                                    opacity: [0, 1, 0]
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        </div>


                                    </div>
                                )}
                            </div>

                            {/* Bottom decorations for specific cards */}
                            {card.id === '04' && (
                                <div className="absolute bottom-4 left-8 flex gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700">SANDBOX</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700">ENCRYPTED</span>
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {/* Integrated Footer Call to Action */}
                    <motion.div
                        className="col-span-1 md:col-span-2 lg:col-span-2 rounded-2xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-zinc-800 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group"
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-2">Still have questions?</h3>
                        </div>
                        <button className="relative z-10 group flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-colors whitespace-nowrap">
                            Contact
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
}
