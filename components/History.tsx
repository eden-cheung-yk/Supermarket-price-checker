
import React from 'react';
import { Receipt } from '../types';
import { Trash2, ChevronRight, Store, Calendar } from 'lucide-react';
import { translations, Language } from '../translations';

interface HistoryProps {
  receipts: Receipt[];
  onDelete: (id: string) => void;
  lang: Language;
}

export const History: React.FC<HistoryProps> = ({ receipts, onDelete, lang }) => {
  const t = translations[lang].history;

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
       <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-500">{t.desc}</p>
      </header>

      <div className="space-y-4">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-shadow hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-primary">
                  <Store size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{receipt.storeName || 'Unknown Store'}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar size={12} />
                    {receipt.date}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-gray-900">${receipt.totalAmount?.toFixed(2)}</div>
                <div className="text-xs text-gray-400">{receipt.items.length} items</div>
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto py-2 mb-2">
                {receipt.items.slice(0, 3).map((item, i) => (
                    <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md whitespace-nowrap border border-gray-100">
                        {item.name}
                    </span>
                ))}
                {receipt.items.length > 3 && <span className="text-xs text-gray-400 py-1">+ more</span>}
            </div>

            <div className="flex justify-end border-t pt-3 mt-2">
               <button 
                 onClick={() => {
                   if(confirm('Delete this receipt?')) onDelete(receipt.id);
                 }}
                 className="text-red-500 text-sm flex items-center gap-1 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
               >
                 <Trash2 size={16} /> {t.delete}
               </button>
            </div>
          </div>
        ))}
        
        {receipts.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
                <HistoryIcon size={48} className="mb-4 opacity-20" />
                <p>{t.noReceipts}</p>
            </div>
        )}
      </div>
    </div>
  );
};

const HistoryIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
    </svg>
);
