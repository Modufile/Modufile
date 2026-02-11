/**
 * Storage Service (Layer 4: Infrastructure Adapter)
 * 
 * Implements IStorageService using IndexedDB via 'idb' library.
 * Handles large file persistence for offline/PWA support.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { IStorageService, Modufile } from '@/types';

const DB_NAME = 'modufile-storage';
const DB_VERSION = 1;
const STORE_NAME = 'files';

class IndexedDBStorageAdapter implements IStorageService {
    private dbPromise: Promise<IDBPDatabase> | null = null;

    private async getDB(): Promise<IDBPDatabase> {
        if (!this.dbPromise) {
            this.dbPromise = openDB(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    }
                },
            });
        }
        return this.dbPromise;
    }

    async saveFile(file: Modufile): Promise<void> {
        const db = await this.getDB();
        await db.put(STORE_NAME, file);
    }

    async getFile(id: string): Promise<Modufile | null> {
        const db = await this.getDB();
        const file = await db.get(STORE_NAME, id);
        return file || null;
    }

    async getAllFiles(): Promise<Modufile[]> {
        const db = await this.getDB();
        return db.getAll(STORE_NAME);
    }

    async deleteFile(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORE_NAME, id);
    }

    async clearAll(): Promise<void> {
        const db = await this.getDB();
        await db.clear(STORE_NAME);
    }
}

// Export singleton instance
export const storageService: IStorageService = new IndexedDBStorageAdapter();
