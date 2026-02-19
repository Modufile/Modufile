'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, Info, Cpu } from 'lucide-react';
import { FaqSection } from '@/components/ui/FaqSection';
import type { FAQ, TechSetup } from '@/data/tool-faqs';

interface ToolPageLayoutProps {
    title: string;
    description: string;
    parentCategory: string;
    parentHref: string;
    children: ReactNode;
    sidebar: ReactNode;
    about?: string;
    techSetup?: TechSetup[];
    faqs?: FAQ[];
}

export function ToolPageLayout({
    title,
    description,
    parentCategory,
    parentHref,
    children,
    sidebar,
    about,
    techSetup,
    faqs
}: ToolPageLayoutProps) {
    return (
        <div className="min-h-screen bg-[#09090B] text-zinc-100">
            {/* Toolbar / Breadcrumbs */}
            <div className="border-b border-zinc-800 bg-[#09090B]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Breadcrumbs */}
                        <Link href={parentHref} className="text-sm text-zinc-400 hover:text-white capitalize flex items-center gap-1">
                            {parentCategory}
                        </Link>
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                        <span className="text-sm text-zinc-100 font-medium">{title}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Stage */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-2xl font-semibold mb-2">{title}</h1>
                            <p className="text-zinc-400">{description}</p>
                        </div>
                        {children}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {sidebar}
                    </div>
                </div>

                {/* About Section */}
                {about && (
                    <section className="mt-16 border-t border-zinc-800 pt-12">
                        <div className="flex items-center gap-2 mb-4">
                            <Info className="w-5 h-5 text-[#3A76F0]" />
                            <h2 className="text-lg font-semibold text-zinc-100">About {title}</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed max-w-3xl">{about}</p>
                    </section>
                )}

                {/* Tech Stack Section */}
                {techSetup && techSetup.length > 0 && (
                    <section className={about ? 'mt-10 pt-10' : 'mt-16 border-t border-zinc-800 pt-12'}>
                        <div className="flex items-center gap-2 mb-6">
                            <Cpu className="w-5 h-5 text-[#3A76F0]" />
                            <h2 className="text-lg font-semibold text-zinc-100">Tech Stack</h2>
                        </div>
                        <div className="space-y-3 max-w-3xl">
                            {techSetup.map((tech, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="shrink-0 mt-0.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-[#3A76F0]">
                                        {tech.library}
                                    </span>
                                    <span className="text-sm text-zinc-400">{tech.purpose}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* FAQ Section */}
                {faqs && faqs.length > 0 && (
                    <FaqSection faqs={faqs} />
                )}
            </div>
        </div>
    );
}

