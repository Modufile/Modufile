'use client';

import { AlertTriangle, FileCode2, Wand2 } from 'lucide-react';

interface MermaidCodeEditorProps {
    code: string;
    validationError: string | null;
    onChange: (code: string) => void;
    onFormat: () => void;
}

export function MermaidCodeEditor({ code, validationError, onChange, onFormat }: MermaidCodeEditorProps) {
    const lineCount = Math.max(1, code.split('\n').length);

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800/70 bg-[#0D0E10]">
            <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
                <div className="flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-[#60A5FA]" />
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-100">Mermaid Code</h3>
                        <p className="text-xs text-zinc-500">Two-way sync with validation, formatting, and native-feeling scroll.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onFormat}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                    <Wand2 className="h-3.5 w-3.5" />
                    Format
                </button>
            </div>

            {validationError && (
                <div className="flex items-start gap-2 border-b border-rose-900/60 bg-rose-950/40 px-4 py-3 text-xs text-rose-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{validationError}</p>
                </div>
            )}

            <div className="grid flex-1 min-h-0 grid-cols-[52px_1fr] overflow-hidden bg-[#090A0C] font-mono text-[13px] leading-6">
                <div className="overflow-hidden border-r border-zinc-800/70 bg-[#0B0C0E] px-2 py-4 text-right text-zinc-600">
                    {Array.from({ length: lineCount }, (_, index) => (
                        <div key={index} className="h-6 text-[12px] leading-6">
                            {index + 1}
                        </div>
                    ))}
                </div>

                <div className="relative min-h-0 overflow-auto">
                    <pre
                        aria-hidden="true"
                        className="pointer-events-none min-h-full whitespace-pre-wrap break-words px-4 py-4 text-zinc-200"
                        dangerouslySetInnerHTML={{ __html: highlightMermaid(code || 'flowchart TB\n') }}
                    />
                    <textarea
                        value={code}
                        spellCheck={false}
                        onChange={(event) => onChange(event.target.value)}
                        className="absolute inset-0 h-full w-full resize-none bg-transparent px-4 py-4 font-mono text-[13px] leading-6 text-transparent caret-white outline-none"
                    />
                </div>
            </div>
        </section>
    );
}

function highlightMermaid(source: string) {
    return escapeHtml(source)
        .replace(/^(flowchart)\s+(TB|BT|LR|RL)/gm, '<span class="text-cyan-300">$1</span> <span class="text-emerald-300">$2</span>')
        .replace(/^(%%.*)$/gm, '<span class="text-zinc-500">$1</span>')
        .replace(/\b(style|linkStyle)\b/g, '<span class="text-fuchsia-300">$1</span>')
        .replace(/\b([A-Za-z][\w-]*)\b(?=\[|\{|\(|\s*(?:-->|---|-.-|-.->|==>|===))/g, '<span class="text-amber-300">$1</span>')
        .replace(/(-->|---|-.-|-.->|==>|===)/g, '<span class="text-sky-300">$1</span>')
        .replace(/\|([^|]+)\|/g, '<span class="text-emerald-300">|$1|</span>')
        .replace(/(fill|stroke|color|font-family|font-size|stroke-width):/g, '<span class="text-violet-300">$1</span>:');
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
