'use client';

import { TOOLS } from '@/config/tools';
import { ToolCard } from '@/components/ui';

export default function ImageToolsPage() {
    const imageTools = TOOLS.filter(t => t.category === 'Image');

    return (
        <div className="min-h-screen bg-[#0A0A0A] p-6 pt-12 md:pt-20">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="space-y-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">Image Tools</h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        Advanced image processing using WebAssembly.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {imageTools.map((tool) => (
                        <ToolCard
                            key={tool.href}
                            {...tool}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
