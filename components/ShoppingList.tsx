import React, { useState, useEffect } from 'react';
import { ShoppingItem } from '../types';
import { translations, Language } from '../translations';
import { getShoppingList, saveShoppingItem, deleteShoppingItem } from '../services/db';
import { generateId } from '../services/utils';
import { Plus, Trash2, CheckSquare, Square, RefreshCcw } from 'lucide-react';

interface ShoppingListProps {
  lang: Language;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ lang }) => {
  const t = translations[lang].shoppingList;
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    const list = await getShoppingList();
    setItems(list);
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;
    const item: ShoppingItem = {
      id: generateId(),
      name: newItemName.trim(),
      isChecked: false
    };
    // Optimistic update
    setItems([item, ...items]);
    setNewItemName('');
    await saveShoppingItem(item);
    loadList(); // Re-sync
  };

  const toggleItem = async (item: ShoppingItem) => {
    const updated = { ...item, isChecked: !item.isChecked };
    
    // Sort items so checked go to bottom
    const newItems = items.map(i => i.id === item.id ? updated : i)
                          .sort((a, b) => Number(a.isChecked) - Number(b.isChecked));
    
    setItems(newItems);
    await saveShoppingItem(updated);
  };

  const deleteItem = async (id: string) => {
    setItems(items.filter(i => i.id !== id));
    await deleteShoppingItem(id);
  };

  const clearCompleted = async () => {
    const completed = items.filter(i => i.isChecked);
    if (confirm(`Remove ${completed.length} completed items?`)) {
      const remaining = items.filter(i => !i.isChecked);
      setItems(remaining);
      for (const item of completed) {
        await deleteShoppingItem(item.id);
      }
    }
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <button onClick={loadList} className="p-2 text-gray-400 hover:text-primary transition-colors">
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Input */}
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder={t.placeholder}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-green-100 outline-none transition-all shadow-sm"
        />
        <button 
          onClick={addItem}
          className="bg-primary hover:bg-green-600 text-white px-6 rounded-xl font-bold shadow-md active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {items.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            {t.empty}
          </div>
        )}

        {items.map((item) => (
          <div 
            key={item.id} 
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              item.isChecked 
                ? 'bg-gray-50 border-gray-100 opacity-60' 
                : 'bg-white border-gray-100 shadow-sm'
            }`}
          >
            <button 
              onClick={() => toggleItem(item)}
              className={`p-1 rounded-full transition-colors ${item.isChecked ? 'text-primary' : 'text-gray-300 hover:text-gray-400'}`}
            >
              {item.isChecked ? <CheckSquare size={24} /> : <Square size={24} />}
            </button>
            
            <span className={`flex-1 font-medium ${item.isChecked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {item.name}
            </span>

            <button 
              onClick={() => deleteItem(item.id)}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {items.some(i => i.isChecked) && (
        <button 
          onClick={clearCompleted}
          className="w-full py-3 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
        >
          {t.clearCompleted}
        </button>
      )}
    </div>
  );
};