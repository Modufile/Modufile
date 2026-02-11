# Data Schemas (gemini.md)

## 1. Database Schema (Supabase / Postgres)

This schema manages user identity, entitlements, and feature flags. *No file data is stored here.*

### `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (matches `auth.users`) |
| `email` | `text` | User email |
| `created_at` | `timestamptz` | Account creation date |
| `last_active_at` | `timestamptz` | Last login/activity |
| `subscription_tier` | `text` | 'free', 'pro' (default: 'free') |
| `stripe_customer_id` | `text` | Link to Stripe |

### `subscriptions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> `users.id` |
| `status` | `text` | 'active', 'canceled', 'past_due' |
| `current_period_end` | `timestamptz` | Expiry date |
| `plan_id` | `text` | Stripe Price ID |

### `usage_logs` (Aggregated/Privacy-Safe)
*Tracks processing volume for quota enforcement, NOT file content.*
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> `users.id` |
| `tool_id` | `text` | e.g., 'pdf-merge', 'img-convert' |
| `action_count` | `int` | Number of files processed |
| `bytes_processed` | `bigint` | Total size (approx) |
| `occurred_at` | `timestamptz` | Timestamp |

### `feature_flags`
| Column | Type | Description |
| :--- | :--- | :--- |
| `flag_key` | `text` | PK (e.g., 'ocr_enabled') |
| `is_enabled` | `boolean` | Global switch |
| `min_tier` | `text` | Minimum tier required ('free', 'pro') |
| `rollout_percentage`| `int` | 0-100 for gradual release |

---

## 2. Client-Side Data Structures (TypeScript Interfaces)

These define the "Payloads" passed between Navigation and Tools in the browser.

### Application State `AppState`
```typescript
interface AppState {
  user: UserProfile | null;
  activeTool: ToolDefinition | null;
  workspace: WorkspaceState;
  ui: UIState;
}

interface UserProfile {
  id: string;
  tier: 'free' | 'pro';
  quotas: {
    dailyconversions: number;
    maxFileSize: number; // in bytes
  };
}
```

### Workspace `WorkspaceState`
The "Source of Truth" for the currently open files in the browser.
```typescript
interface WorkspaceState {
  files: Modufile[];
  selection: string[]; // IDs of selected files
  processingQueue: ProcessingJob[];
  history: ActionHistory[];
}

// Wrapper around native File object with metadata
interface Modufile {
  id: string; // UUID
  originalFile: File; // Native browser File object
  metadata: {
    type: string; // MIME type
    size: number;
    name: string;
    lastModified: number;
    pageCount?: number; // populated for PDFs
    dimensions?: { width: number; height: number }; // for images
  };
  previewUrl?: string; // Blob URL for thumbnail
  status: 'idle' | 'processing' | 'done' | 'error';
}
```

### Processing Job `ProcessingJob`
Data shape for a transformation request.
```typescript
interface ProcessingJob {
  id: string;
  toolId: string; // e.g. 'pdf-merge'
  inputFiles: string[]; // Modufile IDs
  options: Record<string, any>; // Tool-specific options (e.g. { compressionLevel: 0.8 })
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: {
    files: File[]; // Resulting native Files
    logs: string[];
  };
  error?: string;
}
```

### Tool Definition `ToolDefinition`
Configuration for a tool's capabilities.
```typescript
interface ToolDefinition {
  id: string;
  name: string;
  path: string; // URL route
  acceptedMimeTypes: string[];
  outputMimeTypes: string[];
  maxFileSize: number; // Tier-dependent override
  isProOnly: boolean;
  wasmModule?: string; // URL to required WASM
}
```
