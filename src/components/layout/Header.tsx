'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';

export function Header() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#3A76F0] to-[#2D5AB8] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(58,118,240,0.3)]">
                        M
                    </div>
                    <span className="font-semibold text-zinc-100 text-lg tracking-tight">modufile</span>
                </Link>

                <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
                    <Link href="/pdf" className="hover:text-zinc-100 transition-colors">PDF Tools</Link>
                    <Link href="/image" className="hover:text-zinc-100 transition-colors">Image Tools</Link>
                    <Link href="/ocr" className="hover:text-zinc-100 transition-colors">OCR</Link>
                </nav>
            </div>
        </header>
    );
}
