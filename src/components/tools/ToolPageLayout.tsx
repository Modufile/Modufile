'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { FaqSection } from '@/components/ui/FaqSection';
import type { FAQ } from '@/data/tool-faqs';

interface ToolPageLayoutProps {
    title: string;
    description: string;
    parentCategory: string;
    parentHref: string;
    children: ReactNode;
    sidebar: ReactNode;
    faqs?: FAQ[];
}

export function ToolPageLayout({
    title,
    description,
    parentCategory,
    parentHref,
    children,
    sidebar,
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

                {/* FAQ Section */}
                {faqs && faqs.length > 0 && (
                    <FaqSection faqs={faqs} />
                )}
            </div>
        </div>
    );
}
