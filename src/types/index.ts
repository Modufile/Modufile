/**
 * Modufile Core Types
 * Based on gemini.md data schema
 */

// ============================================
// User & Auth Types
// ============================================

export type SubscriptionTier = 'free' | 'pro';

export interface UserProfile {
    id: string;
    email: string;
    tier: SubscriptionTier;
    quotas: {
        dailyConversions: number;
        maxFileSize: number; // in bytes
        maxBatchSize: number;
    };
}

// ============================================
// Workspace Types
// ============================================

export type FileStatus = 'idle' | 'processing' | 'done' | 'error';

export interface FileMetadata {
    type: string; // MIME type
    size: number;
    name: string;
    lastModified: number;
    pageCount?: number; // for PDFs
    dimensions?: { width: number; height: number }; // for images
    duration?: number; // for audio/video in seconds
}

/**
 * Modufile - Wrapper around native File object with metadata
 * This is the core data structure passed between tools
 */
export interface Modufile {
    id: string; // UUID
    originalFile: File; // Native browser File object
    metadata: FileMetadata;
    previewUrl?: string; // Blob URL for thumbnail
    status: FileStatus;
}

export interface WorkspaceState {
    files: Modufile[];
    selection: string[]; // IDs of selected files
    processingQueue: ProcessingJob[];
}

// ============================================
// Processing Types
// ============================================

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ProcessingJob {
    id: string;
    toolId: string;
    inputFiles: string[]; // Modufile IDs
    options: Record<string, unknown>;
    status: JobStatus;
    progress: number; // 0-100
    result?: {
        files: File[];
        logs: string[];
    };
    error?: string;
}

// ============================================
// Tool Definition Types
// ============================================

export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    path: string; // URL route
    icon: string; // Lucide icon name
    acceptedMimeTypes: string[];
    outputMimeTypes: string[];
    maxFileSize: number;
    isProOnly: boolean;
    category: 'pdf' | 'image' | 'video' | 'data' | 'convert';
    wasmModule?: string;
}

// ============================================
// Application State
// ============================================

export interface AppState {
    user: UserProfile | null;
    activeTool: ToolDefinition | null;
    workspace: WorkspaceState;
    isOnline: boolean;
    theme: 'light' | 'dark' | 'system';
}

// ============================================
// Service Interfaces (Layer 4 Contracts)
// ============================================

/**
 * Auth Service Interface
 * UI components use this, never vendor SDKs directly
 */
export interface IAuthService {
    getCurrentUser(): Promise<UserProfile | null>;
    signInWithEmail(email: string, password: string): Promise<UserProfile>;
    signInWithOAuth(provider: 'google' | 'github'): Promise<UserProfile>;
    signOut(): Promise<void>;
    onAuthStateChange(callback: (user: UserProfile | null) => void): () => void;
}

/**
 * Storage Service Interface
 * For IndexedDB file persistence
 */
export interface IStorageService {
    saveFile(file: Modufile): Promise<void>;
    getFile(id: string): Promise<Modufile | null>;
    getAllFiles(): Promise<Modufile[]>;
    deleteFile(id: string): Promise<void>;
    clearAll(): Promise<void>;
}

/**
 * Database Service Interface
 * For Supabase/Postgres operations
 */
export interface IDatabaseService {
    logUsage(toolId: string, fileCount: number, bytesProcessed: number): Promise<void>;
    getFeatureFlags(): Promise<Record<string, boolean>>;
    getUserTier(userId: string): Promise<SubscriptionTier>;
}
