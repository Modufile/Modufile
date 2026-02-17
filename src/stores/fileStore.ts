import { create } from 'zustand';

interface FileStore {
    files: File[];
    source: 'homepage' | 'direct' | null; // Track where the files came from
    setFiles: (files: File[], source?: 'homepage' | 'direct') => void;
    addFiles: (files: File[]) => void;
    clearFiles: () => void;
    removeFile: (id: string) => void; // Assuming we might add IDs, or index-based
}

export const useFileStore = create<FileStore>((set) => ({
    files: [],
    source: null,
    setFiles: (files, source = 'direct') => set({ files, source }),
    addFiles: (newFiles) => set((state) => ({ files: [...state.files, ...newFiles] })),
    clearFiles: () => set({ files: [], source: null }),
    removeFile: (fileName) => set((state) => ({
        files: state.files.filter(f => f.name !== fileName)
    })),
}));
