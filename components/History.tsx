
import React, { useState, useMemo } from 'react';
import { Receipt } from '../types';
import { Trash2, Store, Calendar, Search, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { translations, Language } from '../translations';

interface HistoryProps {
  receipts: Receipt[];
  onDelete: (id: string) => void;
  lang: Language;
}

type SortMode = 'newest' | 'oldest' | 'highest' | 'lowest';

export const History: React.FC<HistoryProps> = ({ receipts, onDelete, lang }) => {
  const t = translations[lang].history;
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Filter & Sort Logic
  const processedReceipts = useMemo(() => {
    let result = [...receipts];

    // Search
    if (search) {
        const q = search.toLowerCase();
        result = result.filter(r => 
            r.storeName.toLowerCase().includes(q) || 
            r.date.includes(q) ||
            r.totalAmount.toString().includes(q)
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
          <div key={receipt.id} className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
            
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
                <button 
                    onClick={() => { if(confirm('Delete?')) onDelete(receipt.id); }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                </button>
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
    </div>
  );
};
