/**
 * Pluggable Database Architecture
 * Allows StaySync PG to run on native browser IndexedDB today,
 * and seamlessly switch to Supabase, MongoDB Atlas, Firebase, or PostgreSQL in the future
 * without changing application business logic or UI code.
 */

export type DatabaseEngine = 'indexeddb' | 'supabase' | 'mongodb' | 'firebase';

export interface DatabaseAdapter {
  name: string;
  engine: DatabaseEngine;
  init(): Promise<void>;
  
  // Generic collection operations
  getAll<T>(collection: string): Promise<T[]>;
  getById<T>(collection: string, id: string): Promise<T | null>;
  create<T extends { id: string }>(collection: string, item: T): Promise<T>;
  update<T extends { id: string } = any>(collection: string, id: string, updates: Partial<T> | Record<string, any>): Promise<T>;
  delete(collection: string, id: string): Promise<boolean>;
  bulkPut<T extends { id: string }>(collection: string, items: T[]): Promise<void>;
  clear(collection: string): Promise<void>;
}

export interface DatabaseBackupPayload {
  version: number;
  exportedAt: string;
  engine: string;
  data: {
    buildings: any[];
    rooms: any[];
    tenants: any[];
    coOccupants: any[];
    payments: any[];
    electricityRecords: any[];
  };
}
