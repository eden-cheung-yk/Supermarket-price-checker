import { Receipt, PriceHistoryPoint } from '../types';
import { openDB, DBSchema } from 'idb';

const API_URL = '/api/receipts';
const DB_NAME = 'smartprice-db';
const STORE_NAME = 'receipts';

// --- IndexedDB Setup (Fallback) ---
interface SmartPriceDB extends DBSchema {
  receipts: {
    key: string;
    value: Receipt;
  };
}

const getLocalDB = async () => {
  return openDB<SmartPriceDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    },
  });
};

// --- Hybrid Data Service ---

export const getAllReceipts = async (): Promise<Receipt[]> => {
  try {
    // 1. Try Server
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Server unavailable');
    const receipts = await response.json();
    return receipts.sort((a: Receipt, b: Receipt) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    // 2. Fallback to Local
    console.warn("Backend unavailable, using local storage.");
    const db = await getLocalDB();
    const receipts = await db.getAll(STORE_NAME);
    return receipts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
};

export const saveReceipt = async (receipt: Receipt): Promise<void> => {
  try {
    // 1. Try Server
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receipt),
    });
    if (!response.ok) throw new Error('Server unavailable');
  } catch (error) {
    // 2. Fallback to Local
    console.warn("Backend unavailable, saving locally.");
    const db = await getLocalDB();
    await db.put(STORE_NAME, receipt);
  }
};

export const deleteReceipt = async (id: string): Promise<void> => {
  try {
    // 1. Try Server
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Server unavailable');
  } catch (error) {
    // 2. Fallback to Local
    console.warn("Backend unavailable, deleting locally.");
    const db = await getLocalDB();
    await db.delete(STORE_NAME, id);
  }
};

export const getItemHistory = async (query: string): Promise<PriceHistoryPoint[]> => {
  const receipts = await getAllReceipts(); // This now handles the fallback logic internally
  const history: PriceHistoryPoint[] = [];
  
  const lowerQuery = query.toLowerCase();

  receipts.forEach(r => {
    if (!r.items) return;
    r.items.forEach(item => {
      if (item.name && item.name.toLowerCase().includes(lowerQuery)) {
        history.push({
          date: r.date || new Date(r.createdAt).toLocaleDateString(),
          store: r.storeName,
          price: item.price
        });
      }
    });
  });

  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};