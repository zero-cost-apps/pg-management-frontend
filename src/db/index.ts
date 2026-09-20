import { DatabaseAdapter, DatabaseEngine, DatabaseBackupPayload } from './types';
import { IndexedDBAdapter } from './indexedDBAdapter';
import { SupabaseAdapter, MongoAdapter, FirebaseAdapter } from './cloudAdapters';

export * from './types';
export * from './indexedDBAdapter';
export * from './cloudAdapters';

/**
 * Configure your default active database engine.
 * Currently active: 'indexeddb'
 * In the future, change to 'supabase', 'mongodb', or 'firebase'.
 */
export const ACTIVE_DATABASE_ENGINE: DatabaseEngine = 'indexeddb';

let activeAdapterInstance: DatabaseAdapter | null = null;

export function getDatabaseAdapter(engine: DatabaseEngine = ACTIVE_DATABASE_ENGINE): DatabaseAdapter {
  if (activeAdapterInstance && activeAdapterInstance.engine === engine) {
    return activeAdapterInstance;
  }

  switch (engine) {
    case 'supabase':
      activeAdapterInstance = new SupabaseAdapter({
        supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL,
        supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
      });
      break;
    case 'mongodb':
      activeAdapterInstance = new MongoAdapter();
      break;
    case 'firebase':
      activeAdapterInstance = new FirebaseAdapter();
      break;
    case 'indexeddb':
    default:
      activeAdapterInstance = new IndexedDBAdapter();
      break;
  }

  return activeAdapterInstance;
}

/**
 * Utility to export a complete JSON snapshot of all entities across the database
 */
export async function exportDatabaseBackup(adapter: DatabaseAdapter = getDatabaseAdapter()): Promise<DatabaseBackupPayload> {
  const [buildings, rooms, tenants, coOccupants, payments, electricityRecords] = await Promise.all([
    adapter.getAll('buildings'),
    adapter.getAll('rooms'),
    adapter.getAll('tenants'),
    adapter.getAll('coOccupants'),
    adapter.getAll('payments'),
    adapter.getAll('electricityRecords')
  ]);

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    engine: adapter.name,
    data: {
      buildings,
      rooms,
      tenants,
      coOccupants,
      payments,
      electricityRecords
    }
  };
}

/**
 * Utility to restore or import a JSON snapshot into the database
 */
export async function importDatabaseBackup(
  payload: DatabaseBackupPayload,
  adapter: DatabaseAdapter = getDatabaseAdapter()
): Promise<boolean> {
  if (!payload.data) return false;

  await Promise.all([
    payload.data.buildings?.length ? adapter.bulkPut('buildings', payload.data.buildings) : Promise.resolve(),
    payload.data.rooms?.length ? adapter.bulkPut('rooms', payload.data.rooms) : Promise.resolve(),
    payload.data.tenants?.length ? adapter.bulkPut('tenants', payload.data.tenants) : Promise.resolve(),
    payload.data.coOccupants?.length ? adapter.bulkPut('coOccupants', payload.data.coOccupants) : Promise.resolve(),
    payload.data.payments?.length ? adapter.bulkPut('payments', payload.data.payments) : Promise.resolve(),
    payload.data.electricityRecords?.length ? adapter.bulkPut('electricityRecords', payload.data.electricityRecords) : Promise.resolve()
  ]);

  return true;
}
