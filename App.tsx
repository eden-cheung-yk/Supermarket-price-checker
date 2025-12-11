
import React, { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { History } from './components/History';
import { PriceCheck } from './components/PriceCheck';
import { ShoppingList } from './components/ShoppingList';
import { ViewState, Receipt } from './types';
import { getAllReceipts, saveReceipt, deleteReceipt, clearAllData, getServerStats } from './services/db';
import { BookOpen, Camera, Search, Server, Tag, Plus, Trash2, Edit2, ShieldCheck, Globe, Download, PieChart, AlertTriangle, RefreshCcw } from 'lucide-react';
import { translations, Language } from './translations';

// --- Sub-component: Settings & Guide View ---
interface SettingsProps {
  lang: Language;
  setLang: (l: Language) => void;
  categories: string[];
  setCategories: (cats: string[]) => void;
  budget: number;
  setBudget: (b: number) => void;
  onExport: () => void;
  onClearData: (onlyInvalid: boolean) => void;
  serverStats: { receiptCount: number, listCount: number } | null;
  refreshStats: () => void;
}

const SettingsView: React.FC<SettingsProps> = ({ lang, setLang, categories, setCategories, budget, setBudget, onExport, onClearData, serverStats, refreshStats }) => {
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

      {/* Budget Setting */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
            <PieChart className="text-purple-500" size={24} />
            <span className="font-bold text-gray-800">{t.budget}</span>
        </div>
        <div className="relative w-24">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input 
                type="number"
                value={budget || ''} 
                placeholder="0"
                onChange={(e) => setBudget(parseFloat(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-2 py-2 text-sm font-bold outline-none focus:border-primary text-right"
            />
        </div>
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

       {/* Data Management */}
       <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <Server className="text-indigo-500" size={24} />
            <span className="font-bold text-gray-800">{t.dataManagement}</span>
        </div>
        <button 
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <Download size={20} /> {t.exportCSV}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl p-5 border border-red-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-red-500" size={24} />
            <span className="font-bold text-red-700">{t.clearData}</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
             <button 
              onClick={() => {
                  if(confirm(t.confirmClear)) onClearData(true);
              }}
              className="w-full bg-white border border-red-200 text-red-600 font-medium py-2 rounded-lg hover:bg-red-100 transition-colors"
            >
              {t.clearGhost}
            </button>
            <button 
              onClick={() => {
                  if(confirm(t.confirmClear)) onClearData(false);
              }}
              className="w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              {t.clearAll}
            </button>
        </div>
      </div>

      {/* System Status Card */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-5 text-white shadow-md">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <Server className="text-blue-400" size={24} />
            <h2 className="font-bold text-lg">{t.status}</h2>
          </div>
          <button onClick={refreshStats} className="text-gray-400 hover:text-white transition-colors">
            <RefreshCcw size={18} />
          </button>
        </div>
        
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex justify-between border-b border-slate-600 pb-2">
            <span>Server Connection</span>
            <span className={`font-mono font-bold ${serverStats ? 'text-green-400' : 'text-red-400'}`}>
               {serverStats ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-600 pb-2">
            <span>Server Receipts</span>
            <span className="font-mono text-white">{serverStats?.receiptCount ?? '-'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-600 pb-2">
            <span>Storage Type</span>
            <span className="font-mono text-yellow-300">JSON File (Server)</span>
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
  const [serverStats, setServerStats] = useState<{receiptCount: number, listCount: number} | null>(null);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('smartprice_lang') as Language) || 'en');
  
  // Category State
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartprice_categories');
      const defaults = ['Groceries', 'Household', 'Snacks', 'Beverages', 'Produce', 'Meat', 'Dairy'];
      if (!saved) return defaults;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaults;
    } catch(e) {
      return ['Groceries', 'Household'];
    }
  });

  // Budget State
  const [budget, setBudget] = useState<number>(() => {
    return Number(localStorage.getItem('smartprice_budget')) || 0;
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

  useEffect(() => {
    localStorage.setItem('smartprice_budget', budget.toString());
  }, [budget]);

  const loadData = async () => {
    const data = await getAllReceipts();
    setReceipts(data);
    refreshServerStats();
  };

  const refreshServerStats = async () => {
    const stats = await getServerStats();
    setServerStats(stats);
  };

  const handleSaveReceipt = async (receipt: Receipt) => {
    try {
      await saveReceipt(receipt);
      await loadData();
      setCurrentView(ViewState.DASHBOARD);
    } catch (e: any) {
      // Propagate error to scanner component
      throw e;
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    await deleteReceipt(id);
    await loadData();
  };
  
  const handleClearData = async (onlyInvalid: boolean) => {
      await clearAllData(onlyInvalid);
      await loadData();
      alert(onlyInvalid ? "Cleaned up invalid receipts." : "All receipts deleted.");
  };

  const exportToCSV = () => {
    if (receipts.length === 0) {
      alert("No data to export");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Store,Item,Category,Price,Quantity,Total\n";

    receipts.forEach(r => {
      r.items.forEach(item => {
        const row = [
          r.date,
          `"${r.storeName.replace(/"/g, '""')}"`,
          `"${item.name.replace(/"/g, '""')}"`,
          item.category || "",
          item.price,
          item.quantity,
          (item.price * item.quantity).toFixed(2)
        ].join(",");
        csvContent += row + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartprice_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      case ViewState.SHOPPING_LIST:
        return <ShoppingList lang={lang} />;
      case ViewState.SETTINGS:
        return (
          <SettingsView 
            lang={lang} setLang={setLang} 
            categories={categories} setCategories={setCategories}
            budget={budget} setBudget={setBudget}
            onExport={exportToCSV}
            onClearData={handleClearData}
            serverStats={serverStats}
            refreshStats={refreshServerStats}
          />
        );
      default:
        return <Dashboard receipts={receipts} lang={lang} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans selection:bg-emerald-100">
      <main className="pb-20 md:pb-0 md:pt-20">
        {renderView()}
      </main>
      <NavBar currentView={currentView} onChangeView={setCurrentView} lang={lang} />
    </div>
  );
}

export default App;
