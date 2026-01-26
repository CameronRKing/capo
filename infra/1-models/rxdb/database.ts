import './plugins';
import storage from './storage';
export { storage };
import collections from '../collections';
import { Types, NutopiaDatabase, Collections } from './types';
export type { Types, NutopiaDatabase, Collections };
export { useDB, useColl, useDoc } from './hooks';
import { createRxDatabase, RxStorage } from 'rxdb';
import { ajv } from '../ajv';

ajv;

// Database instance
let dbPromise: Promise<NutopiaDatabase> | null = null;

export async function getDb<T, X>(storage: RxStorage<T, X>): Promise<NutopiaDatabase> {
  if (!dbPromise) {
    dbPromise = createRxDatabase<NutopiaDatabase>({
      name: 'nutopia',
      storage
    }).then(async (db) => {

      const dbColl = Object.entries(collections)
        .reduce((acc, [key, val]) => ({
          ...acc,
          [key]: { schema: val }
        }), {});
      await db.addCollections(dbColl);
      
      // @ts-ignore
      window.db = db;
      return db;
    });
  }
  
  return dbPromise;
}
