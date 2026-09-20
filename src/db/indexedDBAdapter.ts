import { DatabaseAdapter, DatabaseEngine } from './types';

const DB_NAME = 'StaySyncPG_DB';
const DB_VERSION = 2;

const STORES = [
  'buildings',
  'rooms',
  'tenants',
  'coOccupants',
  'payments',
  'electricityRecords',
  'settings'
];

export class IndexedDBAdapter implements DatabaseAdapter {
  name = 'Browser IndexedDB Storage';
  engine: DatabaseEngine = 'indexeddb';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private memoryFallback: Map<string, Map<string, any>> = new Map();

  constructor() {
    STORES.forEach(store => {
      this.memoryFallback.set(store, new Map());
    });
  }

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB is not available in this environment. Falling back to memory storage.');
        resolve();
        return;
      }

      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          STORES.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: storeName === 'settings' ? 'key' : 'id' });
            }
          });
        };

        request.onsuccess = (event: Event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve();
        };

        request.onerror = (event: Event) => {
          console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
          // Fall back gracefully to memory so the app never crashes
          resolve();
        };
      } catch (err) {
        console.error('Failed to initialize IndexedDB:', err);
        resolve();
      }
    });

    return this.initPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore | null> {
    await this.init();
    if (!this.db) return null;

    try {
      if (!this.db.objectStoreNames.contains(storeName)) {
        return null;
      }
      const tx = this.db.transaction(storeName, mode);
      return tx.objectStore(storeName);
    } catch (e) {
      console.warn(`Error getting store ${storeName}:`, e);
      return null;
    }
  }

  async getAll<T>(collection: string): Promise<T[]> {
    const store = await this.getStore(collection, 'readonly');
    if (!store) {
      const fallbackMap = this.memoryFallback.get(collection);
      return fallbackMap ? (Array.from(fallbackMap.values()) as T[]) : [];
    }

    return new Promise((resolve) => {
      try {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => {
          const fallbackMap = this.memoryFallback.get(collection);
          resolve(fallbackMap ? (Array.from(fallbackMap.values()) as T[]) : []);
        };
      } catch (err) {
        const fallbackMap = this.memoryFallback.get(collection);
        resolve(fallbackMap ? (Array.from(fallbackMap.values()) as T[]) : []);
      }
    });
  }

  async getById<T>(collection: string, id: string): Promise<T | null> {
    const store = await this.getStore(collection, 'readonly');
    if (!store) {
      const fallbackMap = this.memoryFallback.get(collection);
      return fallbackMap?.get(id) || null;
    }

    return new Promise((resolve) => {
      try {
        const request = store.get(id);
        request.onsuccess = () => resolve((request.result as T) || null);
        request.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  }

  async create<T extends { id: string }>(collection: string, item: T): Promise<T> {
    // Keep fallback in sync
    const fallbackMap = this.memoryFallback.get(collection);
    if (fallbackMap) fallbackMap.set(item.id, item);

    const store = await this.getStore(collection, 'readwrite');
    if (!store) return item;

    return new Promise((resolve, reject) => {
      try {
        const request = store.put(item);
        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
      } catch (err) {
        resolve(item);
      }
    });
  }

  async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    const current = await this.getById<T>(collection, id);
    if (!current) {
      throw new Error(`Item with id ${id} not found in collection ${collection}`);
    }

    const merged = { ...current, ...updates };
    return this.create(collection, merged);
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const fallbackMap = this.memoryFallback.get(collection);
    if (fallbackMap) fallbackMap.delete(id);

    const store = await this.getStore(collection, 'readwrite');
    if (!store) return true;

    return new Promise((resolve) => {
      try {
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  async bulkPut<T extends { id: string }>(collection: string, items: T[]): Promise<void> {
    const fallbackMap = this.memoryFallback.get(collection);
    if (fallbackMap) {
      items.forEach(item => fallbackMap.set(item.id, item));
    }

    const store = await this.getStore(collection, 'readwrite');
    if (!store) return;

    return new Promise((resolve, reject) => {
      try {
        let completed = 0;
        if (items.length === 0) {
          resolve();
          return;
        }

        items.forEach(item => {
          const req = store.put(item);
          req.onsuccess = () => {
            completed++;
            if (completed === items.length) resolve();
          };
          req.onerror = () => {
            completed++;
            if (completed === items.length) resolve();
          };
        });
      } catch (err) {
        resolve();
      }
    });
  }

  async clear(collection: string): Promise<void> {
    const fallbackMap = this.memoryFallback.get(collection);
    if (fallbackMap) fallbackMap.clear();

    const store = await this.getStore(collection, 'readwrite');
    if (!store) return;

    return new Promise((resolve) => {
      try {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  }
}
