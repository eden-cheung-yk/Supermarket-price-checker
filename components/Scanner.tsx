
import React, { useState, useRef } from 'react';
import { Camera, X, Check, Plus, Trash2, Keyboard, Sparkles, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { processReceiptWithOCR } from '../services/ocr';
import { Receipt, ProductItem } from '../types';
import { translations, Language } from '../translations';
import { generateId } from '../services/utils';

interface ScannerProps {
  onSave: (receipt: Receipt) => Promise<void>;
  onCancel: () => void;
  lang: Language;
  categories: string[];
}

export const Scanner: React.FC<ScannerProps> = ({ onSave, onCancel, lang, categories }) => {
  const t = translations[lang].scanner;
  const [step, setStep] = useState<'capture' | 'processing' | 'review'>('capture');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Partial<Receipt> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (blob: Blob) => {
    setStep('processing');
    setPreviewUrl(URL.createObjectURL(blob));
    setStatusMessage(t.processingDesc);
    setErrorMsg(null);

    try {
      const data = await processReceiptWithOCR(blob);

      setParsedData({
        id: generateId(),
        createdAt: Date.now(),
        items: data.items,
        storeName: data.storeName,
        date: data.date,
        totalAmount: data.total,
        rawText: data.rawText
      });
      setStep('review');
    } catch (error) {
      console.error(error);
      setStatusMessage('Error processing image.');
      setErrorMsg('Could not read image. Please try manually.');
      setTimeout(() => setStep('capture'), 2000);
    }
  };

  const handleManualEntry = () => {
    setParsedData({
      id: generateId(),
      createdAt: Date.now(),
      storeName: 'Unknown Store',
      date: new Date().toISOString().split('T')[0],
      totalAmount: 0,
      items: [{ id: generateId(), name: 'Item 1', price: 0, quantity: 1 }]
    });
    setStep('review');
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const calculateTotal = (items: ProductItem[] | undefined): number => {
    if (!items) return 0;
    return items.reduce((sum, item) => {
      const price = parseFloat(String(item.price)) || 0;
      const qty = parseInt(String(item.quantity)) || 1;
      return sum + (price * qty);
    }, 0);
  };

  const updateItem = (index: number, field: keyof ProductItem, value: any) => {
    if (!parsedData || !parsedData.items) return;
    const newItems = [...parsedData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setParsedData({ ...parsedData, items: newItems });
  };

  const addItem = () => {
    if (!parsedData) return;
    const newItem: ProductItem = {
      id: generateId(),
      name: '',
      price: 0,
      quantity: 1
    };
    setParsedData({ ...parsedData, items: [...(parsedData.items || []), newItem] });
  };

  const removeItem = (index: number) => {
    if (!parsedData || !parsedData.items) return;
    const newItems = parsedData.items.filter((_, i) => i !== index);
    setParsedData({ ...parsedData, items: newItems });
  };

  const handleSave = async () => {
    // 1. Prevent Double Clicks
    if (isSaving) {
        console.warn("Save already in progress...");
        return;
    }

    console.log("handleSave triggered");
    setErrorMsg(null);
    setIsSaving(true);

    try {
      if (!parsedData) throw new Error("No data to save");

      // 2. Data Sanitization
      const safeItems = (parsedData.items || []).map(item => ({
        ...item,
        name: item.name || 'Unknown Item',
        price: parseFloat(String(item.price)) || 0,
        quantity: parseInt(String(item.quantity)) || 1
      }));

      const calculatedTotal = calculateTotal(safeItems);

      const finalReceipt: Receipt = {
        id: parsedData.id || generateId(),
        createdAt: parsedData.createdAt || Date.now(),
        storeName: parsedData.storeName || 'Unnamed Store',
        date: parsedData.date || new Date().toISOString().split('T')[0],
        totalAmount: calculatedTotal,
        items: safeItems,
        rawText: parsedData.rawText
      };

      console.log("Sending receipt to App...", finalReceipt);
      
      // 3. Call Parent Handler (which calls DB)
      await onSave(finalReceipt);
      
      alert("✅ Receipt Saved Successfully!");

    } catch (err: any) {
      console.error("Scanner Save Error:", err);
      // 4. User Feedback
      alert(`⚠️ ${err.message}`);
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTotal = calculateTotal(parsedData?.items);

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 min-h-[50vh]">
        <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary opacity-50"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{t.processing}</h3>
        <p className="text-gray-500 mt-2">{statusMessage}</p>
        {previewUrl && (
          <img src={previewUrl} alt="Processing" className="mt-8 max-h-64 rounded-xl shadow-lg opacity-80" />
        )}
      </div>
    );
  }

  if (step === 'review' && parsedData) {
    return (
      <div className="p-4 pb-32 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t.review}</h2>
          <button onClick={onCancel} className="bg-gray-200 text-gray-600 p-2 rounded-full hover:bg-gray-300 transition-colors"><X size={20} /></button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 flex items-center gap-3 animate-pulse">
            <AlertCircle size={24} />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 focus-within:ring-2 ring-primary/20 transition-all">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t.store}</label>
              <input 
                type="text" 
                value={parsedData.storeName} 
                onChange={(e) => setParsedData({...parsedData, storeName: e.target.value})}
                className="w-full text-lg font-bold bg-transparent outline-none text-gray-800 placeholder-gray-300"
                placeholder="Store Name"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 focus-within:ring-2 ring-primary/20 transition-all">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t.date}</label>
              <input 
                type="date" 
                value={parsedData.date} 
                onChange={(e) => setParsedData({...parsedData, date: e.target.value})}
                className="w-full text-lg font-bold bg-transparent outline-none text-gray-800"
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-3 px-1">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t.items}</label>
                <span className="text-xs text-gray-400 font-mono">QTY | PRICE</span>
            </div>
            
            <div className="space-y-3">
              {parsedData.items?.map((item, idx) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-all">
                   <div className="flex justify-between items-start gap-2 mb-2">
                      <input 
                        placeholder="Item name"
                        className="flex-1 bg-transparent border-b border-transparent focus:border-primary outline-none text-sm font-medium text-gray-800"
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      />
                      <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-2">
                       <select 
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 outline-none focus:border-primary"
                          value={item.category || ''}
                          onChange={(e) => updateItem(idx, 'category', e.target.value)}
                       >
                          <option value="">{t.selectCategory}</option>
                          {categories.map((cat) => (
                             <option key={cat} value={cat}>{cat}</option>
                          ))}
                       </select>

                      <input 
                          type="number"
                          min="1"
                          className="w-14 bg-white border border-gray-200 rounded-lg py-1.5 text-center text-sm font-bold outline-none focus:border-primary"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />

                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input 
                          type="number"
                          step="0.01"
                          className="w-full bg-white border border-gray-200 rounded-lg pl-5 pr-2 py-1.5 text-right text-sm font-bold outline-none focus:border-primary"
                          value={item.price}
                          onChange={(e) => updateItem(idx, 'price', e.target.value)}
                        />
                      </div>
                   </div>
                </div>
              ))}
            </div>

            <button 
                onClick={addItem}
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary hover:text-primary hover:bg-green-50 transition-all flex items-center justify-center gap-2 font-bold text-sm"
            >
                <Plus size={18} /> {t.addItem}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-500 font-medium text-sm">Estimated Total</span>
            <div className="text-3xl font-black text-primary">${currentTotal.toFixed(2)}</div>
          </div>
        </div>

        <div className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto flex gap-3 z-50">
          <button 
            onClick={() => setStep('capture')} 
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold shadow-lg hover:bg-gray-50 active:scale-95 transition-all"
            disabled={isSaving}
          >
            {t.back}
          </button>
          
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-all ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-green-600'}`}
          >
            {isSaving ? (
              <><Loader2 className="animate-spin" size={24} /> Saving...</>
            ) : (
              <><Check size={24} /> {t.save}</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 max-w-md mx-auto animate-fadeIn">
      <div className="text-center space-y-3">
        <div className="bg-green-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto text-primary mb-2 shadow-sm">
          <Camera size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t.title}</h2>
        <p className="text-gray-500 leading-relaxed">
          {t.desc}
        </p>
      </div>

      <div className="w-full space-y-4">
        <button 
          onClick={() => cameraInputRef.current?.click()}
          className="w-full bg-primary hover:bg-green-600 text-white py-4 rounded-xl font-bold shadow-xl shadow-green-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Camera size={24} />
          {t.takePhoto}
        </button>
        <input 
          ref={cameraInputRef}
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <button 
          onClick={() => uploadInputRef.current?.click()}
          className="w-full bg-white border-2 border-primary/20 text-primary hover:bg-green-50 py-4 rounded-xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Upload size={24} />
          {t.upload}
        </button>
        <input 
          ref={uploadInputRef}
          type="file" 
          accept="image/*" 
          className="hidden"
          onChange={handleFileChange}
        />
        
        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <button 
          onClick={handleManualEntry}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Keyboard size={24} />
          {t.manual}
        </button>
      </div>
    </div>
  );
};
