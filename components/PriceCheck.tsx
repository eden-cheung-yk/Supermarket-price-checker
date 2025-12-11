
import React, { useState, useEffect, useRef } from 'react';
import { Barcode, Search, ShoppingCart, ExternalLink, Loader2, X, ScanLine, Clock, Trash2 } from 'lucide-react';
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
      // Small delay to ensure DOM element exists before mounting scanner
      const timer = setTimeout(() => {
        // Prevent double mounting
        if (scannerRef.current) return;

        const onScanSuccess = async (decodedText: string) => {
          // Stop scanning immediately upon success
          if (scannerRef.current) {
              try {
                  await scannerRef.current.clear();
                  scannerRef.current = null;
              } catch (e) { console.warn("Failed to clear scanner", e); }
          }
          
          setStatus(`${t.scanning} ${decodedText}...`);
          setLoading(true);
          
          try {
            // Identify product using OpenFoodFacts
            const productName = await identifyProductFromBarcode(decodedText);
            setSearchTerm(productName);
            setMode('search'); // Switch UI back to results view
            
            // Automatically trigger price check
            handleSearch(productName);
          } catch (error) {
            setStatus('Error identifying product.');
            setLoading(false);
            setMode('search');
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
            // parse errors are common in video streams, ignore them to keep console clean
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

  const handleSearch = async (term: string) => {
    if (!term) return;
    setLoading(true);
    setStatus(t.scanning);
    setOnlinePrices([]);
    setLocalHistory([]);
    setSearchTerm(term);
    
    // Save to history
    updateSearchHistory(term);
    
    try {
        // 1. Search Local DB (Privacy first)
        const history = await getItemHistory(term);
        setLocalHistory(history);

        // 2. Get Online Search Links (Open Web)
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

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-500">{t.desc}</p>
      </header>

      {/* Search Input Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={t.placeholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-green-100 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
          />
        </div>
        <button 
            onClick={() => setMode(mode === 'scan' ? 'search' : 'scan')}
            className={`p-3 rounded-xl border transition-all shadow-sm flex-shrink-0 ${mode === 'scan' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
            title={mode === 'scan' ? "Close Scanner" : "Scan Barcode"}
        >
            {mode === 'scan' ? <X size={24} /> : <Barcode size={24} />}
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
      {mode === 'search' && !loading && searchHistory.length > 0 && (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Clock size={14} /> {t.recentSearches}
                </h3>
                <button 
                    onClick={clearSearchHistory}
                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                >
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
                  
                  {/* Scanner Overlay UI */}
                  <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent text-white z-10">
                      <div className="flex items-center gap-2 justify-center">
                          <ScanLine className="animate-pulse text-green-400" />
                          <span className="font-bold tracking-wide">SCANNER ACTIVE</span>
                      </div>
                  </div>

                  <div className="bg-gray-900 text-white p-6 text-center border-t border-gray-800">
                    <p className="font-bold text-lg mb-2 text-green-400">{t.barcodeInstruction}</p>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                        Align the barcode within the box. Ensure the room is well lit.
                    </p>
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
            
            {/* 1. Local History Chart */}
            {localHistory.length > 0 && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-blue-500" /> {t.history}
                    </h3>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={localHistory.slice(0, 6).reverse()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" fontSize={11} tickMargin={5} stroke="#9ca3af" />
                                <YAxis domain={['auto', 'auto']} fontSize={11} width={30} stroke="#9ca3af" />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#f3f4f6' }}
                                />
                                <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Price ($)" barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-50 text-sm text-gray-600 flex justify-between items-center">
                        <span>Last paid:</span>
                        <span className="font-bold text-gray-900 bg-blue-50 px-2 py-1 rounded text-base">
                            ${localHistory[0].price.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            {/* 2. Online Comparison Links */}
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
