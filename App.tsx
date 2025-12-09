
import React, { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { History } from './components/History';
import { PriceCheck } from './components/PriceCheck';
import { ViewState, Receipt } from './types';
import { getAllReceipts, saveReceipt, deleteReceipt } from './services/db';
import { BookOpen, Camera, Search, Server, Tag, Plus, Trash2, Edit2, ShieldCheck, Globe } from 'lucide-react';
import { translations, Language } from './translations';

// --- Sub-component: Settings & Guide View ---
interface SettingsProps {
  lang: Language;
  setLang: (l: Language) => void;
  categories: string[];
  setCategories: (cats: string[]) => void;
}

const SettingsView: React.FC<SettingsProps> = ({ lang, setLang, categories, setCategories }) => {
  const t = translations[lang].settings;
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`${t.deleteCategory} "${cat}"?`)) {
      setCategories(categories.filter(c => c !== cat));
    }
  };

  const handleEditCategory = (oldCat: string) => {
    const newName = prompt(t.editCategory, oldCat);
    if (newName && newName.trim() !== oldCat) {
      setCategories(categories.map(c => c === oldCat ? newName.trim() : c));
    }
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-500">{t.desc}</p>
      </header>

      {/* Language Selector */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
            <Globe className="text-blue-500" size={24} />
            <span className="font-bold text-gray-800">{t.language}</span>
        </div>
        <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as Language)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-primary"
        >
            <option value="en">English</option>
            <option value="zh">繁體中文</option>
        </select>
      </div>

      {/* Category Management */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <Tag className="text-orange-500" size={24} />
            <span className="font-bold text-gray-800">{t.categories}</span>
        </div>
        
        <div className="flex gap-2">
            <input 
                type="text" 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={t.enterCategory}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button 
                onClick={handleAddCategory}
                className="bg-primary text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                title={t.addCategory}
            >
                <Plus size={20} />
            </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-700 text-sm ml-2">{cat}</span>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => handleEditCategory(cat)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                            title={t.editCategory}
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title={t.deleteCategory}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
            {categories.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-2">No categories defined.</div>
            )}
        </div>
      </div>

      {/* System Status Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <Server className="text-green-400" size={24} />
          <h2 className="font-bold text-lg">{t.status}</h2>
        </div>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span>Storage</span>
            <span className="font-mono text-white">Local / NAS</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span>Version</span>
            <span className="font-mono text-white">v1.4.0 (Cats)</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 my-6"></div>

      {/* User Guide Section */}
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <BookOpen size={24} className="text-primary" />
        {t.guide}
      </h2>

      <div className="space-y-4">
        
        {/* Guide: Scanning */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex gap-4">
          <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-primary">
            <Camera size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{t.guideScan}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {t.guideScanDesc}
            </p>
          </div>
        </div>

        {/* Guide: Price Check */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex gap-4">
          <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-purple-600">
            <Search size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{t.guidePrice}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {t.guidePriceDesc}
            </p>
          </div>
        </div>

        {/* Guide: Data Privacy */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex gap-4">
          <div className="bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-orange-500">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{t.guidePrivacy}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {t.guidePrivacyDesc}
            </p>
          </div>
        </div>

      </div>

      <div className="text-center text-xs text-gray-300 pt-8 pb-4">
        SmartPrice Tracker © 2024
      </div>
    </div>
  );
};

// --- Main App Component ---
function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('smartprice_lang') as Language) || 'en');
  
  // Category State (Persisted in LocalStorage)
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('smartprice_categories');
    return saved ? JSON.parse(saved) : ['Groceries', 'Household', 'Snacks', 'Beverages', 'Produce', 'Meat', 'Dairy'];
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('smartprice_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('smartprice_categories', JSON.stringify(categories));
  }, [categories]);

  const loadData = async () => {
    const data = await getAllReceipts();
    setReceipts(data);
  };

  const handleSaveReceipt = async (receipt: Receipt) => {
    await saveReceipt(receipt);
    await loadData();
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleDeleteReceipt = async (id: string) => {
    await deleteReceipt(id);
    await loadData();
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard receipts={receipts} lang={lang} />;
      case ViewState.SCANNER:
        return <Scanner onSave={handleSaveReceipt} onCancel={() => setCurrentView(ViewState.DASHBOARD)} lang={lang} categories={categories} />;
      case ViewState.PRICE_CHECK:
        return <PriceCheck lang={lang} />;
      case ViewState.HISTORY:
        return <History receipts={receipts} onDelete={handleDeleteReceipt} lang={lang} />;
      case ViewState.SETTINGS:
        return <SettingsView lang={lang} setLang={setLang} categories={categories} setCategories={setCategories} />;
      default:
        return <Dashboard receipts={receipts} lang={lang} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <main className="pb-20 md:pb-0 md:pt-20">
        {renderView()}
      </main>
      <NavBar currentView={currentView} onChangeView={setCurrentView} lang={lang} />
    </div>
  );
}

export default App;
