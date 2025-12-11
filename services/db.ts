
import { createClient } from '@supabase/supabase-js';
import { Receipt, PriceHistoryPoint, ShoppingItem, ProductItem } from '../types';

// --- SUPABASE CONFIG ---
// Safely access env variables to prevent crashes in environments where import.meta.env is undefined
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// Initialize Supabase only if keys exist to prevent immediate errors
const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

if (!supabase) {
  console.warn("⚠️ Supabase not initialized. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
}

// Helper to check if supabase is ready
const checkSupabase = () => {
  if (!supabase) throw new Error("Database connection not set up. Please set VITE_SUPABASE_URL variables.");
  return supabase;
};

// --- TYPES FOR DB ---
// We use camelCase in Typescript. The SQL schema in README uses quoted identifiers 
// (e.g. "storeName") to match these keys exactly.

// --- RECEIPTS ---

export const getAllReceipts = async (): Promise<Receipt[]> => {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching receipts:", error);
    return [];
  }
  return data as Receipt[];
};

export const saveReceipt = async (receipt: Receipt): Promise<void> => {
  const db = checkSupabase();
  // We use upsert so it handles both create and update based on ID
  const { error } = await db
    .from('receipts')
    .upsert(receipt);

  if (error) throw new Error(error.message);
};

export const deleteReceipt = async (id: string): Promise<void> => {
  const db = checkSupabase();
  const { error } = await db
    .from('receipts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
};

export const clearAllData = async (onlyInvalid: boolean = false): Promise<void> => {
  const db = checkSupabase();
  if (onlyInvalid) {
    // Delete receipts where totalAmount is 0 OR items is empty
    const { data } = await db.from('receipts').select('id, totalAmount, items');
    if (!data) return;

    const idsToDelete = data
      .filter((r: any) => r.totalAmount === 0 || !r.items || r.items.length === 0)
      .map((r: any) => r.id);

    if (idsToDelete.length > 0) {
      await db.from('receipts').delete().in('id', idsToDelete);
    }
  } else {
    // Delete ALL. We use a trick '.neq' on a non-existent ID to effectively select all rows if we don't pass a where clause?
    // Actually, Supabase requires a WHERE clause for delete.
    const { error } = await db.from('receipts').delete().neq('id', 'impossible_id_placeholder'); 
    if (error) throw new Error(error.message);
  }
};

export const getServerStats = async (): Promise<{receiptCount: number, listCount: number}> => {
  if (!supabase) return { receiptCount: 0, listCount: 0 };

  // Check connection by doing a light count
  const { count: receiptCount, error: rError } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true });

  const { count: listCount, error: lError } = await supabase
    .from('shopping_list')
    .select('*', { count: 'exact', head: true });

  if (rError || lError) {
    return { receiptCount: 0, listCount: 0 };
  }

  return { 
    receiptCount: receiptCount || 0, 
    listCount: listCount || 0 
  };
};

// --- PRICE HISTORY ---

export const getItemHistory = async (query: string): Promise<PriceHistoryPoint[]> => {
  if (!supabase) return [];
  
  const { data: receipts, error } = await supabase
    .from('receipts')
    .select('storeName, date, items, createdAt');

  if (error || !receipts) return [];

  const history: PriceHistoryPoint[] = [];
  const lowerQuery = query.toLowerCase();

  receipts.forEach((r: any) => {
    if (!r.items || !Array.isArray(r.items)) return;
    
    r.items.forEach((item: any) => {
      // Check Name OR Barcode
      const nameMatch = item.name && item.name.toLowerCase().includes(lowerQuery);
      const barcodeMatch = item.barcode && item.barcode === query;

      if (nameMatch || barcodeMatch) {
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

/**
 * Finds the most recent usage of a specific barcode to auto-fill details
 */
export const getProductByBarcode = async (barcode: string): Promise<{name: string, category: string} | null> => {
  if (!supabase || !barcode) return null;

  const { data: receipts } = await supabase
    .from('receipts')
    .select('items, date')
    .order('date', { ascending: false })
    .limit(200); // Search last 200 receipts to increase hit rate for historical items

  if (!receipts) return null;

  for (const r of receipts) {
    if (r.items && Array.isArray(r.items)) {
      const match = r.items.find((i: ProductItem) => i.barcode === barcode);
      if (match && match.name) {
        return { name: match.name, category: match.category || '' };
      }
    }
  }

  return null;
};

// --- SHOPPING LIST ---

export const getShoppingList = async (): Promise<ShoppingItem[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('shopping_list')
    .select('*')
    .order('name', { ascending: true });

  if (error) return [];
  return data as ShoppingItem[];
};

export const saveShoppingItem = async (item: ShoppingItem): Promise<void> => {
  const db = checkSupabase();
  const { error } = await db
    .from('shopping_list')
    .upsert(item);
  
  if (error) throw new Error(error.message);
};

export const deleteShoppingItem = async (id: string): Promise<void> => {
  const db = checkSupabase();
  const { error } = await db
    .from('shopping_list')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
};
