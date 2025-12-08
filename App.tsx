
import React, { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { History } from './components/History';
import { PriceCheck } from './components/PriceCheck';
import { ViewState, Receipt } from './types';
import { getAllReceipts, saveReceipt, deleteReceipt } from './services/db';
import { BookOpen, Camera, Search, Server, Lightbulb, Barcode, ShieldCheck, Globe } from 'lucide-react';
import { translations, Language } from './translations';

// --- Sub-component: Settings & Guide View ---
interface SettingsProps {
  lang: Language;
  setLang: (l: Language) => void;
}

const SettingsView: React.FC<SettingsProps> = ({ lang, setLang }) => {
  const t = translations[lang].settings;

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

      {/* System Status Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <Server className="text-green-400" size={24} />
          <h2 className="font-bold text-lg">{t.status}</h2>
        </div>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span>Storage</span>
            <span className="font-mono text-white">NAS (PostgreSQL)</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span>Region Context</span>
            <span className="font-mono text-white">Canada (CAD)</span>
          </div>
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono text-white">v1.3.0 (Tesseract)</span>
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('smartprice_lang', lang);
  }, [lang]);

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
        return <Scanner onSave={handleSaveReceipt} onCancel={() => setCurrentView(ViewState.DASHBOARD)} lang={lang} />;
      case ViewState.PRICE_CHECK:
        return <PriceCheck lang={lang} />;
      case ViewState.HISTORY:
        return <History receipts={receipts} onDelete={handleDeleteReceipt} lang={lang} />;
      case ViewState.SETTINGS:
        return <SettingsView lang={lang} setLang={setLang} />;
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
