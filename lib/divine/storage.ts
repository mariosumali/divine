import type { ReadingRecord } from './types';

const DB_NAME = 'divine-journal';
const STORE = 'readings';
const VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined')
      return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('system', 'system');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Unable to open journal'));
  });
}

async function withDatabase<T>(
  work: (db: IDBDatabase) => Promise<T>,
): Promise<T> {
  const db = await openDatabase();
  try {
    return await work(db);
  } finally {
    db.close();
  }
}

export async function saveReading(record: ReadingRecord): Promise<void> {
  await withDatabase(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).put(record);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Unable to save reading'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Saving was interrupted'));
      }),
  );
}

export async function listReadings(): Promise<ReadingRecord[]> {
  const records = await withDatabase(
    (db) =>
      new Promise<ReadingRecord[]>((resolve, reject) => {
        const request = db
          .transaction(STORE, 'readonly')
          .objectStore(STORE)
          .getAll();
        request.onsuccess = () => resolve(request.result as ReadingRecord[]);
        request.onerror = () =>
          reject(request.error ?? new Error('Unable to read journal'));
      }),
  );
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteReading(id: string): Promise<void> {
  await withDatabase(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Unable to delete reading'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Deletion was interrupted'));
      }),
  );
}

export async function clearReadings(): Promise<void> {
  await withDatabase(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Unable to clear journal'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Clearing was interrupted'));
      }),
  );
}
