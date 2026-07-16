import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
    MermaidFlowchartDocument,
    MermaidHistoryEntry,
    MermaidViewport,
} from '@/types/mermaid-flowchart';
import { cloneDocument, defaultDocument, serializeDocument } from '@/lib/mermaid-flowchart';

interface MermaidFlowchartStore {
    present: MermaidFlowchartDocument;
    past: MermaidFlowchartDocument[];
    future: MermaidFlowchartDocument[];
    selection: string[];
    viewport: MermaidViewport;
    connectFrom: string | null;
    exportScale: number;
    outputFilename: string;
    codeDraft: string;
    validationError: string | null;
    history: MermaidHistoryEntry[];
    setDocument: (document: MermaidFlowchartDocument, options?: { preserveHistory?: boolean; codeDraft?: string }) => void;
    setSelection: (selection: string[]) => void;
    setViewport: (viewport: Partial<MermaidViewport>) => void;
    setConnectFrom: (nodeId: string | null) => void;
    setExportScale: (scale: number) => void;
    setOutputFilename: (filename: string) => void;
    setCodeDraft: (code: string) => void;
    setValidationError: (error: string | null) => void;
    saveHistoryEntry: (entry?: { title?: string; code?: string }) => void;
    loadHistoryEntry: (id: string) => void;
    undo: () => void;
    redo: () => void;
    reset: (document?: MermaidFlowchartDocument) => void;
}

const initialDocument = defaultDocument();

export const useMermaidFlowchartStore = create<MermaidFlowchartStore>()(
    devtools(
        persist(
            (set) => ({
                present: initialDocument,
                past: [],
                future: [],
                selection: [],
                viewport: { x: -220, y: -40, zoom: 1 },
                connectFrom: null,
                exportScale: 2,
                outputFilename: 'mermaid-flowchart.mmd',
                codeDraft: serializeDocument(initialDocument),
                validationError: null,
                history: [],
                setDocument: (document, options) =>
                    set((state) => {
                        const preserveHistory = options?.preserveHistory ?? false;
                        const nextDocument = cloneDocument(document);
                        const nextPast = preserveHistory ? state.past : [...state.past.slice(-39), cloneDocument(state.present)];
                        return {
                            present: nextDocument,
                            past: nextPast,
                            future: preserveHistory ? state.future : [],
                            codeDraft: options?.codeDraft ?? serializeDocument(nextDocument),
                            validationError: null,
                        };
                    }),
                setSelection: (selection) => set({ selection }),
                setViewport: (viewport) => set((state) => ({ viewport: { ...state.viewport, ...viewport } })),
                setConnectFrom: (nodeId) => set({ connectFrom: nodeId }),
                setExportScale: (scale) => set({ exportScale: scale }),
                setOutputFilename: (filename) => set({ outputFilename: filename }),
                setCodeDraft: (codeDraft) => set({ codeDraft }),
                setValidationError: (validationError) => set({ validationError }),
                saveHistoryEntry: (entry) =>
                    set((state) => {
                        const code = entry?.code ?? state.codeDraft;
                        const title = entry?.title ?? state.present.title;
                        const nextEntry: MermaidHistoryEntry = {
                            id: crypto.randomUUID(),
                            title,
                            code,
                            createdAt: new Date().toISOString(),
                        };
                        const deduped = state.history.filter((item) => item.code !== code);
                        return { history: [nextEntry, ...deduped].slice(0, 30) };
                    }),
                loadHistoryEntry: (id) =>
                    set((state) => {
                        const found = state.history.find((item) => item.id === id);
                        if (!found) return state;
                        return { codeDraft: found.code, validationError: null };
                    }),
                undo: () =>
                    set((state) => {
                        if (state.past.length === 0) return state;
                        const previous = state.past[state.past.length - 1];
                        return {
                            present: cloneDocument(previous),
                            past: state.past.slice(0, -1),
                            future: [cloneDocument(state.present), ...state.future].slice(0, 40),
                            codeDraft: serializeDocument(previous),
                            selection: [],
                            connectFrom: null,
                            validationError: null,
                        };
                    }),
                redo: () =>
                    set((state) => {
                        if (state.future.length === 0) return state;
                        const [next, ...future] = state.future;
                        return {
                            present: cloneDocument(next),
                            past: [...state.past, cloneDocument(state.present)].slice(-40),
                            future,
                            codeDraft: serializeDocument(next),
                            selection: [],
                            connectFrom: null,
                            validationError: null,
                        };
                    }),
                reset: (document = defaultDocument()) => set({
                    present: cloneDocument(document),
                    past: [],
                    future: [],
                    selection: [],
                    viewport: { x: -220, y: -40, zoom: 1 },
                    connectFrom: null,
                    codeDraft: serializeDocument(document),
                    validationError: null,
                }),
            }),
            {
                name: 'modufile-mermaid-flowchart',
            }
        ),
        { name: 'MermaidFlowchartStore' }
    )
);
