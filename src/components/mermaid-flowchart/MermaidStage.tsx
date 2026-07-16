'use client';

import { Code2, Loader2 } from 'lucide-react';

interface MermaidStageProps {
    svgMarkup: string | null;
    loading: boolean;
    error: string | null;
    notice?: string | null;
}

export function MermaidStage({ svgMarkup, loading, error, notice }: MermaidStageProps) {
    return (
        <section className="relative flex h-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-zinc-800/70 bg-[#070709]">
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-[#101113]/92 px-3 py-2 text-[11px] text-zinc-400 backdrop-blur">
                <Code2 className="h-3.5 w-3.5 text-zinc-500" />
                <span>Code-driven Mermaid sample</span>
            </div>

            {notice && (
                <div className="absolute right-4 top-4 z-20 max-w-sm rounded-xl border border-zinc-800/80 bg-[#101113]/92 px-3 py-2 text-[11px] text-zinc-400 backdrop-blur">
                    {notice}
                </div>
            )}

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,_rgba(58,118,240,0.08),_transparent_42%),#08090B] p-10">
                {loading && (
                    <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-sm text-zinc-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rendering diagram...
                    </div>
                )}
                {!loading && error && (
                    <div className="max-w-md rounded-2xl border border-rose-900/70 bg-rose-950/30 p-4 text-sm text-rose-200">
                        {error}
                    </div>
                )}
                {!loading && !error && svgMarkup && (
                    <div
                        className="rounded-2xl border border-zinc-800 bg-white/95 p-5 shadow-2xl"
                        dangerouslySetInnerHTML={{ __html: svgMarkup }}
                    />
                )}
            </div>
        </section>
    );
}
