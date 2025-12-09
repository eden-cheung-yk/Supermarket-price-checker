import React, { useState, useEffect, useRef } from 'react';
import { Barcode, Search, ShoppingCart, ExternalLink, Loader2, X } from 'lucide-react';
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
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Handle Barcode Scanning
  useEffect(() => {
    if (mode === 'scan') {
      // Small delay to ensure DOM element exists
      const timer = setTimeout(() => {
        const onScanSuccess = async (decodedText: string) => {
          // Stop scanning once found
          if (scannerRef.current) {
              try {
                  await scannerRef.current.clear();
              } catch (e) { console.error("Failed to clear scanner", e); }
          }
          
          setStatus(`${decodedText}...`);
          setLoading(true);
          
          try {
            const productName = await identifyProductFromBarcode(decodedText);
            setSearchTerm(productName);
            setMode('search'); // Switch back to search view to show results
            handleSearch(productName);
          } catch (error) {
            setStatus('Error identifying product.');
            setLoading(false);
          }
        };

        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );
        
        scannerRef.current = scanner;

        scanner.render(onScanSuccess, (err: any) => {
            // ignore errors during scanning as it polls continuously
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
            try { 
              scannerRef.current.clear().catch(err => console.warn("Scanner clear error", err)); 
            } catch(e) {}
        }
      };
    }
  }, [mode]);

  const handleSearch = async (term: string) => {
    if (!term) return;
    setLoading(true);
    setStatus(t.scanning);
    setOnlinePrices([]);
    setLocalHistory([]);
    
    try {
        // 1. Search Local DB
        const history = await getItemHistory(term);
        setLocalHistory(history);

        // 2. Get Online Search Links
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

      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={t.placeholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-green-100 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
          />
        </div>
        <button 
            onClick={() => setMode(mode === 'scan' ? 'search' : 'scan')}
            className={`p-3 rounded-xl border transition-colors ${mode === 'scan' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}
            title={mode === 'scan' ? "Close Scanner" : "Scan Barcode"}
        >
            <Barcode size={24} />
        </button>
      </div>

      {/* Button logic */}
      {mode === 'search' && (
          <button 
            onClick={() => handleSearch(searchTerm)}
            disabled={!searchTerm || loading}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> {t.scanning}</span> : t.checkBtn}
          </button>
      )}

      {/* Scanner View */}
      {mode === 'scan' && (
          <div className="bg-black rounded-xl overflow-hidden relative shadow-lg">
              <button 
                onClick={() => setMode('search')}
                className="absolute top-2 right-2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <X size={20} />
              </button>
              <div id="reader" className="w-full min-h-[300px] bg-black"></div>
              <div className="bg-gray-900 text-white p-4 text-center">
                <p className="font-medium mb-1">{t.barcodeInstruction}</p>
                <p className="text-xs text-gray-400">Ensure good lighting and hold steady.</p>
              </div>
          </div>
      )}

      {/* Status Message */}
      {status && <div className="text-sm text-center text-gray-500 animate-pulse font-medium">{status}</div>}

      {/* RESULTS */}
      {!loading && mode === 'search' && (localHistory.length > 0 || onlinePrices.length > 0) && (
        <div className="space-y-6 animate-fadeIn">
            
            {/* 1. Local History Chart */}
            {localHistory.length > 0 && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <ShoppingCart size={18} className="text-blue-500" /> {t.history}
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={localHistory.slice(0, 6).reverse()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" fontSize={10} />
                                <YAxis domain={['auto', 'auto']} fontSize={10} width={30} />
                                <Tooltip />
                                <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Price ($)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                        Last paid: <span className="font-bold text-gray-900">${localHistory[0].price}</span> at {localHistory[0].store}
                    </div>
                </div>
            )}

            {/* 2. Online Comparison Links */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ExternalLink size={18} className="text-green-500" /> {t.online}
                </h3>
                {onlinePrices.length > 0 ? (
                    <div className="space-y-3">
                        {onlinePrices.map((item, idx) => (
                            <a 
                                key={idx} 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                            >
                                <div>
                                    <div className="font-bold text-gray-800">{item.store}</div>
                                    <div className="text-xs text-gray-500">{item.productName}</div>
                                </div>
                                <div className="text-right flex items-center gap-1 text-primary">
                                    <span className="font-bold text-sm">{item.price}</span>
                                    <ExternalLink size={14} />
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-4">
                        {t.noResults}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
