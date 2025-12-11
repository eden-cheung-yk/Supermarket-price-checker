
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ScanBarcode, Search, ShoppingCart, ExternalLink, Loader2, X, ScanLine, Clock, Trash2, TrendingDown, TrendingUp, Minus, Award, Calendar } from 'lucide-react';
import { identifyProductFromBarcode, findOnlinePrices } from '../services/gemini';
import { getItemHistory } from '../services/db';
import { PriceHistoryPoint, OnlinePrice } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { translations, Language } from '../translations';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface PriceCheckProps {
  lang: Language;
}

export const PriceCheck: React.FC<PriceCheckProps> = ({ lang }) => {
  const t = translations[lang].priceCheck;
  const [mode, setMode] = useState<'search' | 'scan'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [localHistory, setLocalHistory] = useState<PriceHistoryPoint[]>([]);
  const [onlinePrices, setOnlinePrices] = useState<OnlinePrice[]>([]);
  const [status, setStatus] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem('smartprice_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load search history");
      }
    }
  }, []);

  // Handle Barcode Scanning
  useEffect(() => {
    if (mode === 'scan') {
      const timer = setTimeout(() => {
        if (scannerRef.current) return;

        const onScanSuccess = async (decodedText: string) => {
          if (scannerRef.current) {
              try {
                  await scannerRef.current.clear();
                  scannerRef.current = null;
              } catch (e) { console.warn("Failed to clear scanner", e); }
          }
          
          setStatus(`${t.scanning} ${decodedText}...`);
          setLoading(true);
          setMode('search');

          try {
             // 1. Try Local History First (Exact Match on Barcode)
             const history = await getItemHistory(decodedText);
             
             let productName = decodedText;
             
             // 2. Identify product using OpenFoodFacts
             productName = await identifyProductFromBarcode(decodedText);
             setSearchTerm(productName);
             
             // 3. Trigger full search (Local + Online)
             handleSearch(productName, decodedText);

          } catch (error) {
            setStatus('Error identifying product.');
            setLoading(false);
          }
        };

        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
        };

        const scanner = new Html5QrcodeScanner("reader", config, false);
        scannerRef.current = scanner;

        scanner.render(onScanSuccess, (errorMessage: any) => {
            // ignore scan errors
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
            try { 
              scannerRef.current.clear().catch(err => console.warn("Scanner cleanup error", err)); 
              scannerRef.current = null;
            } catch(e) {}
        }
      };
    }
  }, [mode]);

  const updateSearchHistory = (term: string) => {
    if (!term) return;
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 8);
    setSearchHistory(newHistory);
    localStorage.setItem('smartprice_search_history', JSON.stringify(newHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('smartprice_search_history');
  };

  const handleSearch = async (term: string, barcodeContext?: string) => {
    if (!term) return;
    setLoading(true);
    setStatus(t.scanning);
    setOnlinePrices([]);
    setLocalHistory([]);
    setSearchTerm(term);
    
    updateSearchHistory(term);
    
    try {
        let history = [];
        // Prioritize barcode search
        if (barcodeContext) {
            history = await getItemHistory(barcodeContext);
        }
        
        // If no barcode or no results, search text
        if (history.length === 0) {
            history = await getItemHistory(term);
        }
        
        setLocalHistory(history);

        const online = await findOnlinePrices(term);
        setOnlinePrices(online);
    } catch (e) {
        console.error(e);
        setStatus('Error fetching data.');
    } finally {
        setLoading(false);
        setStatus('');
    }
  };

  // --- ANALYTICS CALCULATIONS ---
  const stats = useMemo(() => {
    if (localHistory.length === 0) return null;
    const prices = localHistory.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;
    return { min, max, avg };
  }, [localHistory]);

  const getPriceBadge = (price: number) => {
      if (!stats) return null;
      if (price === stats.min) return { label: 'Best Price', color: 'bg-green-100 text-green-700', icon: <Award size={12}/> };
      if (price < stats.avg) return { label: 'Low', color: 'bg-green-50 text-green-600', icon: <TrendingDown size={12}/> };
      if (price > stats.avg) return { label: 'High', color: 'bg-red-50 text-red-600', icon: <TrendingUp size={12}/> };
      return { label: 'Average', color: 'bg-gray-100 text-gray-600', icon: <Minus size={12}/> };
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-500">{t.desc}</p>
      </header>

      {/* Search Input Bar */}
      <div className="flex gap-2 sticky top-2 z-30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={t.placeholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-green-100 outline-none transition-all shadow-lg shadow-gray-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
          />
        </div>
        <button 
            onClick={() => setMode(mode === 'scan' ? 'search' : 'scan')}
            className={`p-3 rounded-xl border transition-all shadow-lg shadow-gray-100 flex-shrink-0 ${mode === 'scan' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
            title={mode === 'scan' ? "Close Scanner" : "Scan Barcode"}
        >
            {mode === 'scan' ? <X size={24} /> : <ScanBarcode size={24} />}
        </button>
      </div>

      {/* Manual Search Button */}
      {mode === 'search' && (
          <button 
            onClick={() => handleSearch(searchTerm)}
            disabled={!searchTerm || loading}
            className="w-full bg-primary hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            {loading ? t.scanning : t.checkBtn}
          </button>
      )}

      {/* Recent Searches */}
      {mode === 'search' && !loading && !localHistory.length && searchHistory.length > 0 && (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Clock size={14} /> {t.recentSearches}
                </h3>
                <button onClick={clearSearchHistory} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                    <Trash2 size={12} /> {t.clearHistory}
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {searchHistory.map((term, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSearch(term)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-green-50 hover:text-primary hover:border-green-200 transition-colors shadow-sm"
                    >
                        {term}
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* Scanner View UI */}
      {mode === 'scan' && (
          <div className="relative animate-fadeIn">
              <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800">
                  <div id="reader" className="w-full min-h-[350px] bg-black"></div>
                  <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent text-white z-10">
                      <div className="flex items-center gap-2 justify-center">
                          <ScanLine className="animate-pulse text-green-400" />
                          <span className="font-bold tracking-wide">SCANNER ACTIVE</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Status Message */}
      {status && !mode.includes('scan') && (
        <div className="text-sm text-center text-gray-500 animate-pulse font-medium bg-gray-50 py-2 rounded-lg">
            {status}
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {!loading && mode === 'search' && (localHistory.length > 0 || onlinePrices.length > 0) && (
        <div className="space-y-6 animate-fadeIn">
            
            {/* 1. Price Analytics Summary */}
            {stats && (
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                        <div className="text-xs text-green-600 font-bold uppercase">Lowest</div>
                        <div className="text-xl font-black text-green-700">${stats.min.toFixed(2)}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                        <div className="text-xs text-blue-600 font-bold uppercase">Average</div>
                        <div className="text-xl font-black text-blue-700">${stats.avg.toFixed(2)}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                        <div className="text-xs text-red-600 font-bold uppercase">Highest</div>
                        <div className="text-xl font-black text-red-700">${stats.max.toFixed(2)}</div>
                    </div>
                </div>
            )}

            {/* 2. Detailed History List */}
            {localHistory.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                         <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <ShoppingCart size={20} className="text-blue-500" /> {t.history}
                        </h3>
                        <span className="text-xs font-bold bg-white border px-2 py-1 rounded text-gray-500">
                            {localHistory.length} records
                        </span>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                        {localHistory.map((item, idx) => {
                            const badge = getPriceBadge(item.price);
                            return (
                                <div key={`${item.id}-${idx}`} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-800">{item.store}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <Calendar size={12} /> {item.date}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 italic max-w-[200px] truncate">
                                                {item.itemName}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-gray-900">
                                                ${item.price.toFixed(2)}
                                            </div>
                                            {badge && (
                                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 mt-1 ${badge.color}`}>
                                                    {badge.icon} {badge.label}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* 3. Trend Chart (Collapsible or Secondary) */}
            {localHistory.length > 1 && (
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 mb-4">Price Trend</h3>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={localHistory.slice(0, 10).reverse()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" fontSize={10} tickMargin={5} stroke="#9ca3af" />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#f3f4f6' }}
                                />
                                <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 4. Online Comparison Links */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ExternalLink size={20} className="text-green-500" /> {t.online}
                </h3>
                {onlinePrices.length > 0 ? (
                    <div className="space-y-3">
                        {onlinePrices.map((item, idx) => (
                            <a 
                                key={idx} 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md hover:border-green-100 border border-transparent transition-all"
                            >
                                <div>
                                    <div className="font-bold text-gray-800 group-hover:text-primary transition-colors">{item.store}</div>
                                    <div className="text-xs text-gray-500">{item.productName}</div>
                                </div>
                                <div className="text-right flex items-center gap-2 text-primary font-medium bg-white px-3 py-1 rounded-lg border border-gray-100 group-hover:border-green-200">
                                    <span className="text-sm">{item.price}</span>
                                    <ExternalLink size={14} />
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        {t.noResults}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
