'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t border-zinc-900 bg-[#0A0A0A] py-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-gradient-to-br from-[#3A76F0] to-[#2D5AB8] rounded flex items-center justify-center text-white text-xs font-bold">
                            M
                        </div>
                        <span className="font-semibold text-zinc-300">modufile</span>
                    </div>
                    <p className="text-sm text-zinc-500">
                        Privacy-first file manipulation toolkit. Built for privacy, and simplicity.
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
                    </ul>
                </div>
            </div>
        </footer>
    );
}
