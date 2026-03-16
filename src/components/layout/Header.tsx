'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github } from 'lucide-react';
import { Logo } from '@/components/ui';

export function Header() {
    const pathname = usePathname();
    const isToolPage = pathname?.match(/^\/(pdf|image|ocr)\/.+/);

    if (isToolPage) return null;

    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background-app/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                <Link prefetch={false} href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-primary-active rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--brand-focus-ring)]">
                        <Logo className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-zinc-100 text-lg tracking-tight">Modufile</span>
                </Link>

                <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
                    <Link prefetch={false} href="/pdf" className="hover:text-zinc-100 transition-colors">PDF Tools</Link>
                    <Link prefetch={false} href="/image" className="hover:text-zinc-100 transition-colors">Image Tools</Link>
                    <Link prefetch={false} href="/ocr" className="hover:text-zinc-100 transition-colors">OCR</Link>
                </nav>
            </div>
        </header>
    );
}
