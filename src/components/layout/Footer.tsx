'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui';

export function Footer() {
    return (
        <footer className="border-t border-zinc-900 bg-background-app py-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-gradient-to-br from-brand-primary to-brand-primary-active rounded flex items-center justify-center shadow-sm">
                            <Logo className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-zinc-300">Modufile</span>
                    </div>
                    <p className="text-sm text-zinc-500">
                        Modufile is a privacy-first file manipulator that runs entirely in your browser. If a tool requires upload, it requires trust. Modufile removes that requirement.
                    </p>
                </div>
                <div>
                    <h4 className="text-zinc-100 font-medium mb-4">PDF Tools</h4>
                    <ul className="space-y-2 text-sm text-zinc-500">
                        <li><Link href="/pdf/merge" className="hover:text-zinc-300">Merge PDF</Link></li>
                        <li><Link href="/pdf/split" className="hover:text-zinc-300">Split PDF</Link></li>
                        <li><Link href="/pdf/watermark" className="hover:text-zinc-300">Watermark PDF</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-zinc-100 font-medium mb-4">Image Tools</h4>
                    <ul className="space-y-2 text-sm text-zinc-500">
                        <li><Link href="/image/convert" className="hover:text-zinc-300">Convert Image</Link></li>
                        <li><Link href="/image/compress" className="hover:text-zinc-300">Compress Image</Link></li>
                        <li><Link href="/image/batch" className="hover:text-zinc-300">Batch Edit</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-zinc-100 font-medium mb-4">Project</h4>
                    <ul className="space-y-2 text-sm text-zinc-500">
                        <li><Link href="/ocr" className="hover:text-zinc-300">OCR</Link></li>
                        <li><Link href="/thanks" className="hover:text-zinc-300">Libraries & Credits</Link></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}
