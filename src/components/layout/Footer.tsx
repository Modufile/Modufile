'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui';

export function Footer() {
    const pathname = usePathname();
    const isToolPage = pathname?.match(/^\/(pdf|image|ocr)\/.+/);

    if (isToolPage) return null;

    return (
        <footer className="border-t border-zinc-900 bg-background-app py-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-gradient-to-br from-brand-primary to-brand-primary-active rounded flex items-center justify-center shadow-sm">
                                <Logo className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-semibold text-zinc-300">Modufile</span>
                        </div>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Privacy-first file tools that run entirely in your browser. Your files do not leave your device. No file or metadata tracking.
                        </p>
                    </div>

                    {/* PDF Organize */}
                    <div>
                        <h4 className="text-zinc-100 font-medium mb-4 text-sm">PDF — Organize</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><Link href="/pdf/merge" className="hover:text-zinc-300 transition-colors">Merge PDF</Link></li>
                            <li><Link href="/pdf/split" className="hover:text-zinc-300 transition-colors">Split PDF</Link></li>
                            <li><Link href="/pdf/rotate" className="hover:text-zinc-300 transition-colors">Rotate PDF</Link></li>
                            <li><Link href="/pdf/remove-pages" className="hover:text-zinc-300 transition-colors">Remove Pages</Link></li>
                            <li><Link href="/pdf/organize" className="hover:text-zinc-300 transition-colors">Organize Pages</Link></li>
                        </ul>
                    </div>

                    {/* PDF Edit & Security */}
                    <div>
                        <h4 className="text-zinc-100 font-medium mb-4 text-sm">PDF — Edit & Security</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><Link href="/pdf/editor" className="hover:text-zinc-300 transition-colors">PDF Editor</Link></li>
                            <li><Link href="/pdf/redact" className="hover:text-zinc-300 transition-colors">Redact PDF</Link></li>
                            <li><Link href="/pdf/watermark" className="hover:text-zinc-300 transition-colors">Watermark PDF</Link></li>
                            <li><Link href="/pdf/unlock" className="hover:text-zinc-300 transition-colors">Unlock PDF</Link></li>
                            <li><Link href="/pdf/metadata" className="hover:text-zinc-300 transition-colors">Edit Metadata</Link></li>
                            <li><Link href="/pdf/flatten" className="hover:text-zinc-300 transition-colors">Flatten PDF</Link></li>
                        </ul>
                    </div>

                    {/* PDF Convert */}
                    <div>
                        <h4 className="text-zinc-100 font-medium mb-4 text-sm">PDF — Convert</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><Link href="/pdf/pdf-to-word" className="hover:text-zinc-300 transition-colors">PDF to Word</Link></li>
                            <li><Link href="/pdf/pdf-to-excel" className="hover:text-zinc-300 transition-colors">PDF to Excel</Link></li>
                            <li><Link href="/pdf/office-to-pdf" className="hover:text-zinc-300 transition-colors">Office to PDF</Link></li>
                            <li><Link href="/pdf/scan" className="hover:text-zinc-300 transition-colors">PDF to Images</Link></li>
                            <li><Link href="/pdf/ocr" className="hover:text-zinc-300 transition-colors">PDF OCR</Link></li>
                            <li><Link href="/pdf/pdfa" className="hover:text-zinc-300 transition-colors">PDF/A Convert</Link></li>
                        </ul>
                    </div>

                    {/* Image + Other */}
                    <div>
                        <h4 className="text-zinc-100 font-medium mb-4 text-sm">Image & More</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><Link href="/image/convert" className="hover:text-zinc-300 transition-colors">Convert Image</Link></li>
                            <li><Link href="/image/compress" className="hover:text-zinc-300 transition-colors">Compress Image</Link></li>
                            <li><Link href="/image/resize" className="hover:text-zinc-300 transition-colors">Resize Image</Link></li>
                            <li><Link href="/image/batch" className="hover:text-zinc-300 transition-colors">Batch Edit</Link></li>
                            <li><Link href="/ocr" className="hover:text-zinc-300 transition-colors">OCR</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
                    <div className="flex items-center gap-4">
                        <span>© {new Date().getFullYear()} Modufile</span>
                        <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="https://github.com/Modufile/Modufile/" className="hover:text-zinc-400 transition-colors">GitHub</Link>
                        <Link href="/thanks" className="hover:text-zinc-400 transition-colors">Open Source Credits</Link>
                        <Link href="/contact" className="hover:text-zinc-400 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
