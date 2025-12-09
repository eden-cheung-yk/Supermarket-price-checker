import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Plus, Trash2, Keyboard, Sparkles } from 'lucide-react';
import { processReceiptWithOCR } from '../services/ocr';
import { Receipt, ProductItem } from '../types';
import { translations, Language } from '../translations';
import { generateId } from '../services/utils';

interface ScannerProps {
  onSave: (receipt: Receipt) => void;
  onCancel: () => void;
  lang: Language;
}

export const Scanner: React.FC<ScannerProps> = ({ onSave, onCancel, lang }) => {
  const t = translations[lang].scanner;
  const [step, setStep] = useState<'capture' | 'processing' | 'review'>('capture');
  const [statusMessage, setStatusMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Partial<Receipt> | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (blob: Blob) => {
    setStep('processing');
    setPreviewUrl(URL.createObjectURL(blob));
    setStatusMessage(t.processingDesc);

    try {
      // Use Tesseract OCR (Local)
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
      setStatusMessage('Error processing image. Please try again.');
      setTimeout(() => setStep('capture'), 2000);
    }
  };

  const handleManualEntry = () => {
    setParsedData({
      id: generateId(),
      createdAt: Date.now(),
      storeName: '',
      date: new Date().toISOString().split('T')[0],
      totalAmount: 0,
      items: [{ id: generateId(), name: '', price: 0, quantity: 1 }]
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
      const price = item.price || 0;
      const qty = item.quantity || 1;
      return sum + (price * qty);
    }, 0);
  };

  const handleSave = () => {
    if (parsedData) {
      const currentItems = parsedData.items || [];
      const calculatedTotal = calculateTotal(currentItems);
      
      const finalReceipt: Receipt = {
        ...parsedData,
        // Ensure totalAmount is a valid number, priority to calculated total
        totalAmount: calculatedTotal,
        items: currentItems
      } as Receipt;
      
      onSave(finalReceipt);
    }
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

  // Live total for the UI
  const currentTotal = calculateTotal(parsedData?.items);

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary mb-4 opacity-25"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{t.processing}</h3>
        <p className="text-gray-500 mt-2 text-sm">{statusMessage}</p>
        {previewUrl && (
          <img src={previewUrl} alt="Processing" className="mt-6 max-h-64 rounded-lg shadow-md opacity-50" />
        )}
      </div>
    );
  }

  if (step === 'review' && parsedData) {
    return (
      <div className="p-4 pb-24 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {t.review}
          </h2>
          <button onClick={onCancel} className="text-gray-500 p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t.store}</label>
              <input 
                type="text" 
                placeholder="e.g. No Frills"
                value={parsedData.storeName} 
                onChange={(e) => setParsedData({...parsedData, storeName: e.target.value})}
                className="w-full text-lg font-semibold border-b border-gray-200 focus:border-primary outline-none py-1 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t.date}</label>
              <input 
                type="text" 
                placeholder="YYYY-MM-DD"
                value={parsedData.date} 
                onChange={(e) => setParsedData({...parsedData, date: e.target.value})}
                className="w-full text-lg font-medium border-b border-gray-200 focus:border-primary outline-none py-1 bg-transparent"
              />
            </div>
          </div>
          
          {/* Items List */}
          <div>
            <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-gray-500">{t.items}</label>
                <span className="text-xs text-gray-400">Name | Qty | Price</span>
            </div>
            
            <div className="space-y-3">
              {parsedData.items?.map((item, idx) => (
                <div key={item.id} className="flex gap-2 items-center animate-fadeIn group">
                   <input 
                    placeholder="Item name"
                    className="flex-1 bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded px-3 py-2 outline-none transition-all text-sm"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  />
                  
                  {/* Quantity Input */}
                  <div className="relative w-16 flex-shrink-0">
                     <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">x</span>
                     <input 
                      type="number"
                      min="1"
                      placeholder="1"
                      className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded pl-5 pr-1 py-2 text-center outline-none transition-all text-sm"
                      value={item.quantity || 1}
                      onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateItem(idx, 'quantity', isNaN(val) ? 1 : val);
                      }}
                    />
                  </div>

                  {/* Price Input */}
                  <div className="relative w-24 flex-shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded pl-5 pr-2 py-2 font-bold text-right outline-none transition-all text-sm"
                      value={item.price || ''}
                      onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value))}
                    />
                  </div>

                  <button 
                    onClick={() => removeItem(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-50 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button 
                onClick={addItem}
                className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary hover:bg-green-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
                <Plus size={18} /> {t.addItem}
            </button>
          </div>

          {/* Total */}
          <div className="pt-4 border-t mt-4 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-600 text-sm">
                Total calculated from items
            </div>
            <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-700">{t.total}:</span>
                <span className="font-bold text-3xl text-primary">${currentTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-20 left-0 right-0 px-4 flex gap-3 max-w-2xl mx-auto z-10">
          <button onClick={() => setStep('capture')} className="flex-1 py-3 rounded-xl bg-white border border-gray-300 font-bold text-gray-700 shadow-sm">{t.back}</button>
          <button onClick={handleSave} className="flex-[2] py-3 rounded-xl bg-primary text-white font-bold shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform">
            <Check size={20} /> {t.save}
          </button>
        </div>
      </div>
    );
  }

  // Capture State
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
          <Camera size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
        <p className="text-gray-500">
          {t.desc}
        </p>
      </div>

      <div className="w-full space-y-4">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-primary hover:bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200 flex items-center justify-center gap-3 transition-transform active:scale-95"
        >
          <Camera size={24} />
          {t.takePhoto}
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        
        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <button 
          onClick={handleManualEntry}
          className="w-full bg-white border-2 border-gray-200 hover:border-primary hover:text-primary text-gray-700 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors active:scale-95"
        >
          <Keyboard size={24} />
          {t.manual}
        </button>
      </div>
    </div>
  );
};