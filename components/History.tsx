
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Receipt, ProductItem } from '../types';
import { Trash2, Store, Calendar, Search, Filter, ArrowUp, ArrowDown, Edit2, X, Plus, Check, Loader2, ScanBarcode } from 'lucide-react';
import { translations, Language } from '../translations';
import { generateId } from '../services/utils';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getProductByBarcode } from '../services/db';

interface HistoryProps {
  receipts: Receipt[];
  onDelete: (id: string) => void;
  onUpdate: (receipt: Receipt) => Promise<void>;
  lang: Language;
  categories: string[];
}

type SortMode = 'newest' | 'oldest' | 'highest' | 'lowest';

export const History: React.FC<HistoryProps> = ({ receipts, onDelete, onUpdate, lang, categories }) => {
  const t = translations[lang].history;
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit State
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Barcode Scanner State (for Editing)
  const [activeBarcodeIndex, setActiveBarcodeIndex] = useState<number | null>(null);
  const barcodeScannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Filter & Sort Logic
  const processedReceipts = useMemo(() => {
    let result = [...receipts];

    // Search
    if (search) {
        const q = search.toLowerCase();
        result = result.filter(r => 
            r.storeName.toLowerCase().includes(q) || 
            r.date.includes(q) ||
            r.totalAmount.toString().includes(q) ||
            r.items.some(i => i.name.toLowerCase().includes(q) || i.barcode === q)
        );
    }

    // Sort
    result.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt).getTime();
        const dateB = new Date(b.date || b.createdAt).getTime();
        
        switch (sortMode) {
            case 'newest': return dateB - dateA;
            case 'oldest': return dateA - dateB;
            case 'highest': return b.totalAmount - a.totalAmount;
            case 'lowest': return a.totalAmount - b.totalAmount;
            default: return 0;
        }
    });

    return result;
  }, [receipts, search, sortMode]);

  // --- BARCODE SCANNER EFFECT ---
  useEffect(() => {
    if (activeBarcodeIndex !== null) {
        // Small delay to let the modal render the div
        const timeout = setTimeout(() => {
            if (barcodeScannerRef.current) return;
            
            const onScanSuccess = async (decodedText: string) => {
                if (barcodeScannerRef.current) {
                    try { await barcodeScannerRef.current.clear(); } catch(e){}
                    barcodeScannerRef.current = null;
                }

                // Update Item with Barcode
                await handleBarcodeDetected(activeBarcodeIndex, decodedText);
                setActiveBarcodeIndex(null);
            };

            const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
            const scanner = new Html5QrcodeScanner("mini-reader-history", config, false);
            barcodeScannerRef.current = scanner;
            scanner.render(onScanSuccess, () => {});
        }, 100);

        return () => {
            clearTimeout(timeout);
            if (barcodeScannerRef.current) {
                try { barcodeScannerRef.current.clear(); } catch(e){}
                barcodeScannerRef.current = null;
            }
        };
    }
  }, [activeBarcodeIndex]);

  const handleBarcodeDetected = async (index: number, barcode: string) => {
      if (!editingReceipt) return;
      
      const newItems = [...editingReceipt.items];
      
      // Auto-fill Logic
      const existingProduct = await getProductByBarcode(barcode);
      let updatedItem = { ...newItems[index], barcode: barcode };
      
      if (existingProduct) {
          updatedItem.name = existingProduct.name;
          if (existingProduct.category) updatedItem.category = existingProduct.category;
      }

      newItems[index] = updatedItem;
      setEditingReceipt({ ...editingReceipt, items: newItems });
  };

  // --- EDITING HANDLERS ---

  const handleEditSave = async () => {
    if (!editingReceipt) return;
    setIsSaving(true);
    try {
        // Recalculate total
        const total = editingReceipt.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
        const updated = { ...editingReceipt, totalAmount: total };
        await onUpdate(updated);
        setEditingReceipt(null);
    } catch (e) {
        alert("Failed to save changes. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  const updateEditField = (field: keyof Receipt, value: any) => {
    if (!editingReceipt) return;
    setEditingReceipt({ ...editingReceipt, [field]: value });
  };

  const updateEditItem = (index: number, field: keyof ProductItem, value: any) => {
      if (!editingReceipt) return;
      const newItems = [...editingReceipt.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setEditingReceipt({ ...editingReceipt, items: newItems });
  };

  // NEW: Reverse Calc Logic (Same as Scanner.tsx)
  const handleLineTotalChange = (index: number, newTotalString: string) => {
    if (!editingReceipt) return;
    const newTotal = parseFloat(newTotalString);
    if (isNaN(newTotal)) return;

    const newItems = [...editingReceipt.items];
    const qty = newItems[index].quantity || 1;
    
    // Reverse Calculate Unit Price
    const newUnitPrice = newTotal / qty;
    
    newItems[index] = { ...newItems[index], price: parseFloat(newUnitPrice.toFixed(3)) }; 
    setEditingReceipt({ ...editingReceipt, items: newItems });
  };

  const removeEditItem = (index: number) => {
      if (!editingReceipt) return;
      const newItems = editingReceipt.items.filter((_, i) => i !== index);
      setEditingReceipt({ ...editingReceipt, items: newItems });
  };

  const addEditItem = () => {
      if (!editingReceipt) return;
      const newItem: ProductItem = { id: generateId(), name: '', price: 0, quantity: 1, category: '' };
      setEditingReceipt({ ...editingReceipt, items: [...editingReceipt.items, newItem] });
  };

  return (
    <div className="p-4 pb-28 md:pb-12 max-w-3xl mx-auto space-y-6">
       
       <header className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-black text-gray-900">{t.title}</h1>
            <p className="text-gray-500 font-medium">{receipts.length} {t.desc}</p>
        </div>
        <div className="bg-white p-2 rounded-full shadow-sm border border-gray-200 text-gray-400">
            <Store size={24} />
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-green-100 outline-none transition-all shadow-sm"
            />
        </div>
        <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
        >
            <Filter size={20} />
        </button>
      </div>

      {/* Filter Options (Collapsible) */}
      {showFilters && (
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-fadeIn flex flex-wrap gap-2">
             {(['newest', 'oldest', 'highest', 'lowest'] as SortMode[]).map(mode => (
                 <button 
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        sortMode === mode ? 'bg-green-50 text-primary border-green-200' : 'bg-white text-gray-500 border-gray-200'
                    }`}
                 >
                    {mode === 'newest' && <span className="flex items-center gap-1"><ArrowDown size={12}/> {t.filters.sortNew}</span>}
                    {mode === 'oldest' && <span className="flex items-center gap-1"><ArrowUp size={12}/> {t.filters.sortOld}</span>}
                    {mode === 'highest' && <span className="flex items-center gap-1"><ArrowUp size={12}/> {t.filters.sortHigh}</span>}
                    {mode === 'lowest' && <span className="flex items-center gap-1"><ArrowDown size={12}/> {t.filters.sortLow}</span>}
                 </button>
             ))}
          </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {processedReceipts.map((receipt) => (
          <div key={receipt.id} className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center cursor-pointer" onClick={() => setEditingReceipt(receipt)}>
            
            <div className="flex items-center gap-4">
               {/* Store Icon Placeholder */}
               <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-primary transition-colors">
                  <Store size={20} />
               </div>
               
               <div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">{receipt.storeName}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 font-medium">
                     <span className="flex items-center gap-1"><Calendar size={10} /> {receipt.date}</span>
                     <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                     <span>{receipt.items.length} items</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col items-end gap-2">
                <span className="font-black text-lg text-gray-900">${receipt.totalAmount.toFixed(2)}</span>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setEditingReceipt(receipt); }}
                        className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Receipt"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) onDelete(receipt.id); }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Receipt"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

          </div>
        ))}
        
        {processedReceipts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search size={24} className="opacity-30" />
                </div>
                <p>{t.noReceipts}</p>
            </div>
        )}
      </div>

      {/* --- EDIT MODAL --- */}
      {editingReceipt && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center p-5 border-b border-gray-100">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                          <Edit2 size={20} className="text-blue-500"/> Edit Receipt
                      </h2>
                      <button onClick={() => setEditingReceipt(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Body */}
                  <div className="p-5 overflow-y-auto space-y-6">
                      
                      {/* Top Info */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Store</label>
                              <input 
                                  type="text" 
                                  value={editingReceipt.storeName}
                                  onChange={(e) => updateEditField('storeName', e.target.value)}
                                  className="w-full font-bold text-lg border-b border-gray-200 py-1 focus:border-blue-500 outline-none"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Date</label>
                              <input 
                                  type="date" 
                                  value={editingReceipt.date}
                                  onChange={(e) => updateEditField('date', e.target.value)}
                                  className="w-full font-bold text-lg border-b border-gray-200 py-1 focus:border-blue-500 outline-none"
                              />
                          </div>
                      </div>

                      {/* Items */}
                      <div>
                          <div className="flex justify-between items-end mb-2 border-b border-gray-100 pb-2">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</label>
                              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex gap-8 pr-4">
                                  <span className="w-12 text-center">Qty</span>
                                  <span className="w-20 text-right">Unit $</span>
                                  <span className="w-20 text-right">Total</span>
                              </div>
                          </div>
                          <div className="space-y-2">
                              {editingReceipt.items.map((item, idx) => (
                                  <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                      <div className="flex-1 space-y-1">
                                          <input 
                                              className="w-full text-sm font-medium border border-gray-200 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                              value={item.name}
                                              onChange={(e) => updateEditItem(idx, 'name', e.target.value)}
                                              placeholder="Item Name"
                                          />
                                           {item.barcode && (
                                                <div className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded w-fit mt-1 flex items-center gap-1">
                                                    <ScanBarcode size={10} /> {item.barcode}
                                                </div>
                                            )}
                                          <div className="flex gap-1">
                                              <select
                                                  className="flex-1 text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 outline-none bg-white"
                                                  value={item.category || ''}
                                                  onChange={(e) => updateEditItem(idx, 'category', e.target.value)}
                                              >
                                                  <option value="">Uncategorized</option>
                                                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                              </select>
                                              <button 
                                                onClick={() => setActiveBarcodeIndex(idx)}
                                                className={`p-1 rounded ${item.barcode ? 'text-primary bg-green-100' : 'text-gray-400 bg-gray-200'}`}
                                                title="Scan Barcode"
                                              >
                                                  <ScanBarcode size={14}/>
                                              </button>
                                          </div>
                                      </div>
                                      
                                      <input 
                                          type="number"
                                          className="w-12 text-center text-sm font-bold border border-gray-200 rounded py-1 outline-none bg-white"
                                          value={item.quantity}
                                          onChange={(e) => updateEditItem(idx, 'quantity', e.target.value)}
                                      />
                                      
                                      <input 
                                          type="number"
                                          step="0.01"
                                          className="w-20 text-right text-sm font-bold border border-gray-200 rounded py-1 outline-none bg-white"
                                          value={item.price}
                                          onChange={(e) => updateEditItem(idx, 'price', e.target.value)}
                                      />

                                      {/* New Total Field */}
                                      <input 
                                          type="number"
                                          step="0.01"
                                          className="w-20 text-right text-sm font-bold border border-blue-100 bg-blue-50 rounded py-1 outline-none text-blue-600"
                                          value={(item.price * item.quantity).toFixed(2)}
                                          onChange={(e) => handleLineTotalChange(idx, e.target.value)}
                                          title="Line Total (Edit to calc unit price)"
                                      />

                                      <button 
                                          onClick={() => removeEditItem(idx)}
                                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                      >
                                          <X size={16} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                          <button 
                              onClick={addEditItem}
                              className="mt-4 w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                          >
                              <Plus size={16} /> Add Item
                          </button>
                      </div>

                  </div>

                  {/* Footer */}
                  <div className="p-5 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-2xl">
                       <div className="text-sm font-medium text-gray-500">
                          Total: <span className="text-xl font-black text-gray-900 ml-1">
                              ${editingReceipt.items.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0).toFixed(2)}
                          </span>
                       </div>
                       <div className="flex gap-3">
                           <button 
                              onClick={() => setEditingReceipt(null)}
                              className="px-4 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                           >
                               Cancel
                           </button>
                           <button 
                              onClick={handleEditSave}
                              disabled={isSaving}
                              className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
                           >
                               {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Check size={18}/>}
                               Save Changes
                           </button>
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- MINI SCANNER MODAL (FOR EDITING) --- */}
      {activeBarcodeIndex !== null && (
            <div className="fixed inset-0 bg-black/80 z-[150] flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden p-4">
                    <h3 className="text-center font-bold text-gray-800 mb-2">Scan Product Barcode</h3>
                    <div id="mini-reader-history" className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden"></div>
                    <button 
                        onClick={() => setActiveBarcodeIndex(null)}
                        className="mt-4 w-full bg-red-100 text-red-600 font-bold py-2 rounded-lg"
                    >
                        Cancel
                    </button>
                </div>
            </div>
      )}

    </div>
  );
};
