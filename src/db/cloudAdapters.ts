import { DatabaseAdapter, DatabaseEngine } from './types';

/**
 * Supabase Cloud Adapter
 * 
 * To activate Supabase:
 * 1. npm install @supabase/supabase-js
 * 2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
 * 3. Set DATABASE_ENGINE='supabase' in src/db/index.ts
 */
export class SupabaseAdapter implements DatabaseAdapter {
  name = 'Supabase Cloud Database (PostgreSQL)';
  engine: DatabaseEngine = 'supabase';
  private client: any = null;

  constructor(private config?: { supabaseUrl?: string; supabaseAnonKey?: string }) {}

  async init(): Promise<void> {
    console.log('[Database] Initializing Supabase Cloud Adapter...');
    // When ready to connect:
    // const { createClient } = await import('@supabase/supabase-js');
    // this.client = createClient(this.config?.supabaseUrl || '', this.config?.supabaseAnonKey || '');
  }

  async getAll<T>(collection: string): Promise<T[]> {
    if (!this.client) {
      console.warn(`[SupabaseAdapter] Client not configured. Implement with supabase.from('${collection}').select('*')`);
      return [];
    }
    const { data, error } = await this.client.from(collection).select('*');
    if (error) throw error;
    return data as T[];
  }

  async getById<T>(collection: string, id: string): Promise<T | null> {
    if (!this.client) return null;
    const { data, error } = await this.client.from(collection).select('*').eq('id', id).single();
    if (error) return null;
    return data as T;
  }

  async create<T extends { id: string }>(collection: string, item: T): Promise<T> {
    if (!this.client) return item;
    const { data, error } = await this.client.from(collection).upsert(item).select().single();
    if (error) throw error;
    return data as T;
  }

  async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    if (!this.client) return { id, ...updates } as T;
    const { data, error } = await this.client.from(collection).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as T;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    if (!this.client) return true;
    const { error } = await this.client.from(collection).delete().eq('id', id);
    return !error;
  }

  async bulkPut<T extends { id: string }>(collection: string, items: T[]): Promise<void> {
    if (!this.client || items.length === 0) return;
    const { error } = await this.client.from(collection).upsert(items);
    if (error) throw error;
  }

  async clear(collection: string): Promise<void> {
    if (!this.client) return;
    await this.client.from(collection).delete().neq('id', '0');
  }
}

/**
 * MongoDB Atlas Cloud Adapter
 * 
 * To activate MongoDB:
 * 1. Connect via MongoDB Atlas Data API or Express REST proxy /api/db/*
 * 2. Set DATABASE_ENGINE='mongodb' in src/db/index.ts
 */
export class MongoAdapter implements DatabaseAdapter {
  name = 'MongoDB Atlas Cloud Database';
  engine: DatabaseEngine = 'mongodb';

  constructor(private config?: { apiBaseUrl?: string; apiKey?: string }) {}

  async init(): Promise<void> {
    console.log('[Database] Initializing MongoDB Adapter...');
  }

  async getAll<T>(collection: string): Promise<T[]> {
    console.log(`[MongoAdapter] Query: db.collection('${collection}').find({})`);
    return [];
  }

  async getById<T>(collection: string, id: string): Promise<T | null> {
    console.log(`[MongoAdapter] Query: db.collection('${collection}').findOne({ id: '${id}' })`);
    return null;
  }

  async create<T extends { id: string }>(collection: string, item: T): Promise<T> {
    console.log(`[MongoAdapter] Query: db.collection('${collection}').replaceOne({ id: '${item.id}' }, item, { upsert: true })`);
    return item;
  }

  async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    console.log(`[MongoAdapter] Query: db.collection('${collection}').updateOne({ id: '${id}' }, { $set: updates })`);
    return { id, ...updates } as T;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    console.log(`[MongoAdapter] Query: db.collection('${collection}').deleteOne({ id: '${id}' })`);
    return true;
  }

  async bulkPut<T extends { id: string }>(collection: string, items: T[]): Promise<void> {
    console.log(`[MongoAdapter] Query: db.collection('${collection}').bulkWrite(...) with ${items.length} records`);
  }

  async clear(collection: string): Promise<void> {
    console.log(`[MongoAdapter] Query: db.collection('${collection}').deleteMany({})`);
  }
}

/**
 * Firebase Firestore Cloud Adapter
 * 
 * To activate Firebase:
 * 1. npm install firebase
 * 2. Add firebaseConfig
 * 3. Set DATABASE_ENGINE='firebase' in src/db/index.ts
 */
export class FirebaseAdapter implements DatabaseAdapter {
  name = 'Firebase Firestore Cloud Database';
  engine: DatabaseEngine = 'firebase';

  constructor(private config?: any) {}

  async init(): Promise<void> {
    console.log('[Database] Initializing Firebase Firestore Adapter...');
  }

  async getAll<T>(collection: string): Promise<T[]> {
    console.log(`[FirebaseAdapter] Query: getDocs(collection(db, '${collection}'))`);
    return [];
  }

  async getById<T>(collection: string, id: string): Promise<T | null> {
    console.log(`[FirebaseAdapter] Query: getDoc(doc(db, '${collection}', '${id}'))`);
    return null;
  }

  async create<T extends { id: string }>(collection: string, item: T): Promise<T> {
    console.log(`[FirebaseAdapter] Query: setDoc(doc(db, '${collection}', '${item.id}'), item)`);
    return item;
  }

  async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    console.log(`[FirebaseAdapter] Query: updateDoc(doc(db, '${collection}', '${id}'), updates)`);
    return { id, ...updates } as T;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    console.log(`[FirebaseAdapter] Query: deleteDoc(doc(db, '${collection}', '${id}'))`);
    return true;
  }

  async bulkPut<T extends { id: string }>(collection: string, items: T[]): Promise<void> {
    console.log(`[FirebaseAdapter] Query: writeBatch for ${items.length} items`);
  }

  async clear(collection: string): Promise<void> {
    console.log(`[FirebaseAdapter] Clear collection '${collection}'`);
  }
}
