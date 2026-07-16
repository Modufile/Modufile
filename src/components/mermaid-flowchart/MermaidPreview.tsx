'use client';

import { useEffect, useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';

interface MermaidPreviewProps {
    code: string;
    svgMarkup: string;
    validationError: string | null;
}

export function MermaidPreview({ code, svgMarkup, validationError }: MermaidPreviewProps) {
    return <MermaidPreviewInner key={`${code}::${validationError ?? 'ok'}`} code={code} svgMarkup={svgMarkup} validationError={validationError} />;
}

function MermaidPreviewInner({ code, svgMarkup, validationError }: MermaidPreviewProps) {
    const [state, setState] = useState<{ loading: boolean; svg: string | null; error: string | null }>({
        loading: !validationError,
        svg: null,
        error: null,
    });

    useEffect(() => {
        if (validationError) return;

        let cancelled = false;
        const timer = window.setTimeout(() => {
            try {
                if (cancelled) return;
                setState({ loading: false, svg: svgMarkup, error: null });
            } catch (error) {
                if (cancelled) return;
                const message = error instanceof Error ? error.message : 'Unable to render Mermaid preview.';
                setState({ loading: false, svg: null, error: message });
            }
        }, 160);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [code, svgMarkup, validationError]);

    const activeError = validationError ?? state.error;
    const isLoading = validationError ? false : state.loading;

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800/70 bg-[#0D0E10]">
            <div className="flex items-center gap-2 border-b border-zinc-800/70 px-4 py-3">
                <Eye className="h-4 w-4 text-[#60A5FA]" />
                <div>
                    <h3 className="text-sm font-semibold text-zinc-100">Preview</h3>
                    <p className="text-xs text-zinc-500">Preview and export share the same vector renderer.</p>
                </div>
            </div>

            <div className="relative flex flex-1 min-h-0 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,_rgba(58,118,240,0.08),_transparent_42%),#08090B] p-6">
                {isLoading && (
                    <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-sm text-zinc-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rendering diagram...
                    </div>
                )}
                {!isLoading && activeError && (
                    <div className="max-w-md rounded-2xl border border-rose-900/70 bg-rose-950/30 p-4 text-sm text-rose-200">
                        {activeError}
                    </div>
                )}
                {!isLoading && !activeError && state.svg && (
                    <div
                        className="mermaid-preview rounded-2xl border border-zinc-800 bg-white/95 p-4 shadow-2xl"
                        dangerouslySetInnerHTML={{ __html: state.svg }}
                    />
                )}
            </div>
        </section>
    );
}
