
import Tesseract from 'tesseract.js';
import { ProductItem } from '../types';
import { generateId } from './utils';

interface ParsedReceipt {
  storeName: string;
  date: string;
  total: number;
  items: ProductItem[];
  rawText: string;
}

// Known Canadian Stores for Dictionary Lookup
const KNOWN_STORES = [
    'WALMART', 'NO FRILLS', 'NOFRILLS', 'COSTCO', 'METRO', 'SOBEYS', 'LOBLAWS', 
    'FRESHCO', 'FOOD BASICS', 'LONGO', 'SAFEWAY', 'SAVE-ON-FOODS', 'SHOPPERS', 
    'REXALL', 'DOLLARAMA', 'GIANT TIGER', 'T&T', 'REAL CANADIAN SUPERSTORE', 'RCS', 
    'YOUR INDEPENDENT GROCER', 'FARM BOY', 'WHOLE FOODS', 'CANADIAN TIRE', 'LCBO'
];

// --- Image Preprocessing ---

const preprocessImage = (imageBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(url); 
        return;
      }

      // 1. Scale image up to help with small receipt fonts
      const scaleFactor = Math.min(2.5, 2500 / Math.max(img.width, img.height)); 
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 2. High-Contrast Binarization
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const val = gray > 140 ? 255 : 0; 

        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = reject;
    img.src = url;
  });
};

// --- Parsing Helpers ---

const cleanText = (text: string): string[] => {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 2); // Ignore very short lines
};

const extractDate = (lines: string[]): string => {
  const datePatterns = [
    /\d{4}[-./]\d{2}[-./]\d{2}/,       
    /\d{1,2}[-./]\d{1,2}[-./]\d{2,4}/,  
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}/i
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
          try {
              const d = new Date(match[0]);
              if (!isNaN(d.getTime())) {
                  return d.toISOString().split('T')[0];
              }
          } catch(e) {}
          return match[0];
      }
    }
  }
  return new Date().toISOString().split('T')[0];
};

const extractTotal = (lines: string[]): number => {
  const totalKeywords = ['total', 'balance', 'amount due', 'final', 'grand total', 'subtotal'];
  const priceRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/;
  
  let maxVal = 0;
  let foundTotalKeyword = false;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].toLowerCase();
    const match = lines[i].match(priceRegex);

    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (totalKeywords.some(k => line.includes(k))) {
        if (val > maxVal) maxVal = val;
        foundTotalKeyword = true;
      } else if (!foundTotalKeyword) {
          if (val > maxVal) maxVal = val;
      }
    }
  }
  return maxVal;
};

const isLineNoisy = (line: string): boolean => {
    const nonAlpha = line.replace(/[a-zA-Z0-9\s]/g, '').length;
    const len = line.length;
    return (nonAlpha / len) > 0.3;
};

const extractStore = (lines: string[]): string => {
  const upperLines = lines.slice(0, 15);
  for (const line of upperLines) {
      const normalized = line.toUpperCase().replace(/[^A-Z]/g, ''); 
      for (const store of KNOWN_STORES) {
          const cleanStore = store.toUpperCase().replace(/[^A-Z]/g, '');
          if (normalized.includes(cleanStore)) {
              return store.charAt(0).toUpperCase() + store.slice(1).toLowerCase().replace(/nofrills/i, "No Frills");
          }
      }
  }

  const skipPatterns = [
      /^\d+/, /phone|tel|fax/i, /www\.|http|\.com/i, /welcome/i, 
      /receipt/i, /gst|hst/i, /term|auth|card/i, /street|road|ave|blvd/i
  ];
  
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = lines[i];
    if (line.length > 3 && !isLineNoisy(line) && !skipPatterns.some(p => p.test(line.toLowerCase()))) {
        return line.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
  }
  return "Unknown Store";
};

const extractItems = (lines: string[]): ProductItem[] => {
  const items: ProductItem[] = [];
  
  const FOOTER_KEYWORDS = [
      'TOTAL', 'SUBTOTAL', 'TAX', 'HST', 'GST', 'PST', 'BALANCE', 
      'VISA', 'DEBIT', 'MASTERCARD', 'AUTH', 'CHANGE', 'DUE', 'CASH', 
      'SAVINGS', 'DISCOUNT', 'ITEMS SOLD', 'ACCOUNT'
  ];
  
  // Regex: Name ... Price
  const lineItemRegex = /^(.*?)\s+(\d{1,4}[.,]\d{2})\s*([A-Z]{1,2})?$/i;
  
  // Standard Quantity: "2 @ 1.99" or "2 x 1.99"
  const quantityRegex = /^(\d+)\s*[@x]\s*(\d+[.,]\d{2})/i;

  // Split Pricing / Deals: "2/5.00", "2 / 5.00", "2 FOR 5.00"
  const multiBuyRegex = /^(\d+)\s*(?:\/|for|FOR)\s*\$?(\d+[.,]\d{2})/i;
  
  let buffer: string[] = []; 

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const lowerLine = line.toLowerCase();
    const upperLine = line.toUpperCase();

    // 1. Footer Check
    if (FOOTER_KEYWORDS.some(k => upperLine.includes(k))) continue;
    if (line.match(/welcome|receipt|store|phone|cashier|transaction|customer/i)) continue;
    if (/\d{4}[-./]\d{2}[-./]\d{2}/.test(line)) continue; 

    // --- CHECK FOR DEAL MODIFIER FIRST (Modifies previous item) ---
    // Example: Previous line "Cookies", This line "2/5.00"
    const dealMatch = line.match(multiBuyRegex);
    if (dealMatch && items.length > 0) {
        const qty = parseInt(dealMatch[1], 10);
        const dealTotal = parseFloat(dealMatch[2].replace(',', '.'));
        
        if (qty > 0 && dealTotal > 0) {
            // Update the LAST item added
            const lastItem = items[items.length - 1];
            
            // Calculate true unit price
            const unitPrice = dealTotal / qty;
            
            lastItem.quantity = qty;
            lastItem.price = parseFloat(unitPrice.toFixed(2));
            
            // If the last item was just a name without a price (from buffer), this confirms it
            continue; 
        }
    }

    // --- Try to match Standard Item Line ---
    const match = line.match(lineItemRegex);
    
    if (match) {
      let name = match[1].trim();
      let priceStr = match[2].replace(',', '.'); 
      let price = parseFloat(priceStr);
      let quantity = 1;

      if (price > 900 || price === 0) continue; 
      
      name = name.replace(/^[\d\s-]{3,}/, '');
      name = name.replace(/^[^a-zA-Z0-9]+/, '');

      if (name.length < 2 || /^\d+$/.test(name)) continue;

      // Check buffer for Quantity context (Standard 2 @ 1.99)
      if (buffer.length > 0) {
        const lastLine = buffer[buffer.length - 1];
        const qtyMatch = lastLine.match(quantityRegex);
        
        if (qtyMatch) {
            quantity = parseInt(qtyMatch[1], 10);
            // In "2 @ 1.99", the 1.99 is usually the UNIT price, so we leave price as is (if match found line price)
            // But usually the line price (match[2]) is the TOTAL (3.98).
            // Let's ensure consistency. 
            // If line says 3.98, and buffer says 2 @ 1.99.
            // We trust the buffer's unit price usually, OR we verify math. 
            // Simplified: Trust the unit price from the buffer if distinct.
            const unitPriceFromBuffer = parseFloat(qtyMatch[2].replace(',', '.'));
            if (unitPriceFromBuffer > 0) price = unitPriceFromBuffer;
        } else if (lastLine.length > 3 && !/^\d+$/.test(lastLine) && !isLineNoisy(lastLine)) {
            name = `${lastLine} ${name}`;
        }
      }

      items.push({ id: generateId(), name, price, quantity });
      buffer = []; 
    } else {
        if (!isLineNoisy(line)) {
            buffer.push(line);
        }
        if (buffer.length > 2) buffer.shift();
    }
  }

  return items;
};

export const processReceiptWithOCR = async (imageBlob: Blob): Promise<ParsedReceipt> => {
  const preprocessedImage = await preprocessImage(imageBlob);
  
  const worker = await Tesseract.createWorker('eng'); 
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.AUTO, 
  });

  const result = await worker.recognize(preprocessedImage);
  await worker.terminate();

  const rawText = result.data.text;
  const lines = cleanText(rawText);

  const storeName = extractStore(lines);
  const date = extractDate(lines);
  const total = extractTotal(lines);
  const items = extractItems(lines);

  if (items.length === 0) {
      items.push({ id: generateId(), name: "", price: 0, quantity: 1 });
  }

  return {
    storeName,
    date,
    total,
    items,
    rawText
  };
};
