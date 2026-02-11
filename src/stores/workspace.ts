/**
 * Workspace Store (Layer 2: Application State)
 * 
 * Manages files currently in the workspace.
 * Uses Zustand for simple, performant state management.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Modufile, ProcessingJob, FileStatus } from '@/types';

interface WorkspaceStore {
    // State
    files: Modufile[];
    selection: string[];
    processingQueue: ProcessingJob[];

    // Actions
    addFiles: (files: Modufile[]) => void;
    removeFile: (id: string) => void;
    updateFileStatus: (id: string, status: FileStatus) => void;
    clearWorkspace: () => void;

    // Selection
    selectFile: (id: string) => void;
    deselectFile: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;

    // Processing Queue
    addJob: (job: ProcessingJob) => void;
    updateJobProgress: (jobId: string, progress: number) => void;
    completeJob: (jobId: string, result: ProcessingJob['result']) => void;
    failJob: (jobId: string, error: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial State
                files: [],
                selection: [],
                processingQueue: [],

                // File Actions
                addFiles: (newFiles) =>
                    set((state) => ({
                        files: [...state.files, ...newFiles],
                    })),

                removeFile: (id) =>
                    set((state) => ({
                        files: state.files.filter((f) => f.id !== id),
                        selection: state.selection.filter((s) => s !== id),
                    })),

                updateFileStatus: (id, status) =>
                    set((state) => ({
                        files: state.files.map((f) =>
                            f.id === id ? { ...f, status } : f
                        ),
                    })),

                clearWorkspace: () =>
                    set({
                        files: [],
                        selection: [],
                        processingQueue: [],
                    }),

                // Selection Actions
                selectFile: (id) =>
                    set((state) => ({
                        selection: state.selection.includes(id)
                            ? state.selection
                            : [...state.selection, id],
                    })),

                deselectFile: (id) =>
                    set((state) => ({
                        selection: state.selection.filter((s) => s !== id),
                    })),

                selectAll: () =>
                    set((state) => ({
                        selection: state.files.map((f) => f.id),
                    })),

                clearSelection: () => set({ selection: [] }),

                // Processing Queue Actions
                addJob: (job) =>
                    set((state) => ({
                        processingQueue: [...state.processingQueue, job],
                    })),

                updateJobProgress: (jobId, progress) =>
                    set((state) => ({
                        processingQueue: state.processingQueue.map((j) =>
                            j.id === jobId ? { ...j, progress, status: 'running' } : j
                        ),
                    })),

                completeJob: (jobId, result) =>
                    set((state) => ({
                        processingQueue: state.processingQueue.map((j) =>
                            j.id === jobId
                                ? { ...j, status: 'completed', progress: 100, result }
                                : j
                        ),
                    })),

                failJob: (jobId, error) =>
                    set((state) => ({
                        processingQueue: state.processingQueue.map((j) =>
                            j.id === jobId ? { ...j, status: 'failed', error } : j
                        ),
                    })),
            }),
            {
                name: 'modufile-workspace',
                // Don't persist File objects (they can't be serialized)
                partialize: (state) => ({
                    // Only persist file metadata, not actual File objects
                    selection: state.selection,
                }),
            }
        ),
        { name: 'WorkspaceStore' }
    )
);
