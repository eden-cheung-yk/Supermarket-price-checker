
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
      // A width of ~2500px is usually a good balance for Tesseract performance/accuracy
      const scaleFactor = Math.min(2.5, 2500 / Math.max(img.width, img.height)); 
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 2. High-Contrast Binarization
      // We iterate through pixels and make them either white or black to remove background noise
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Luminance formula
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        // Dynamic thresholding could be better, but a fixed threshold of ~150 works for standard thermal paper
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
          // Attempt to standardize date
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
  // Regex to find price at end of line
  const priceRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/;
  
  let maxVal = 0;
  let foundTotalKeyword = false;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].toLowerCase();
    const match = lines[i].match(priceRegex);

    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      
      // If we see "Total" or "Balance", this is likely the one
      if (totalKeywords.some(k => line.includes(k))) {
        // If we previously found a 'subtotal' that was smaller, keep looking? 
        // Usually the biggest number near 'Total' is correct.
        if (val > maxVal) maxVal = val;
        foundTotalKeyword = true;
      } else if (!foundTotalKeyword) {
          // Keep track of largest number seen just in case we miss the keyword
          if (val > maxVal) maxVal = val;
      }
    }
  }
  return maxVal;
};

const isLineNoisy = (line: string): boolean => {
    // Count non-alphanumeric characters
    const nonAlpha = line.replace(/[a-zA-Z0-9\s]/g, '').length;
    const len = line.length;
    // If more than 30% symbols, it's noise (e.g. "§$%&/()")
    return (nonAlpha / len) > 0.3;
};

const extractStore = (lines: string[]): string => {
  const upperLines = lines.slice(0, 15); // Look at top 15 lines
  
  // 1. Check against dictionary
  for (const line of upperLines) {
      const normalized = line.toUpperCase().replace(/[^A-Z]/g, ''); 
      for (const store of KNOWN_STORES) {
          const cleanStore = store.toUpperCase().replace(/[^A-Z]/g, '');
          if (normalized.includes(cleanStore)) {
              return store.charAt(0).toUpperCase() + store.slice(1).toLowerCase().replace(/nofrills/i, "No Frills");
          }
      }
  }

  // 2. Fallback: Find a clean, prominent line
  const skipPatterns = [
      /^\d+/, /phone|tel|fax/i, /www\.|http|\.com/i, /welcome/i, 
      /receipt/i, /gst|hst/i, /term|auth|card/i, /street|road|ave|blvd/i
  ];
  
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = lines[i];
    // Skip short lines, noisy lines, or lines matching skip patterns
    if (line.length > 3 && !isLineNoisy(line) && !skipPatterns.some(p => p.test(line.toLowerCase()))) {
        // Return Title Case
        return line.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
  }
  return "Unknown Store"; // Better to default to Unknown than return garbage
};

const extractItems = (lines: string[]): ProductItem[] => {
  const items: ProductItem[] = [];
  
  // Keywords that definitely signal a footer line (not a product)
  const FOOTER_KEYWORDS = [
      'TOTAL', 'SUBTOTAL', 'TAX', 'HST', 'GST', 'PST', 'BALANCE', 
      'VISA', 'DEBIT', 'MASTERCARD', 'AUTH', 'CHANGE', 'DUE', 'CASH', 
      'SAVINGS', 'DISCOUNT', 'ITEMS SOLD', 'ACCOUNT'
  ];
  
  // Regex: Name ... Price
  // Groups: 1=Name, 2=Price
  const lineItemRegex = /^(.*?)\s+(\d{1,4}[.,]\d{2})\s*([A-Z]{1,2})?$/i;
  
  // Quantity check: "2 @ 1.99"
  const quantityRegex = /^(\d+)\s*[@x]\s*(\d+[.,]\d{2})/i;
  
  let buffer: string[] = []; 

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const lowerLine = line.toLowerCase();
    const upperLine = line.toUpperCase();

    // 1. Strict Footer Check
    // If line contains 'TOTAL' or 'SUBTOTAL', ignore it entirely
    if (FOOTER_KEYWORDS.some(k => upperLine.includes(k))) {
        continue;
    }
    
    // Skip obvious header/noise info
    if (line.match(/welcome|receipt|store|phone|cashier|transaction|customer/i)) continue;
    if (/\d{4}[-./]\d{2}[-./]\d{2}/.test(line)) continue; // Date line

    // --- Try to match Item Line ---
    const match = line.match(lineItemRegex);
    
    if (match) {
      let name = match[1].trim();
      let priceStr = match[2].replace(',', '.'); 
      let price = parseFloat(priceStr);
      let quantity = 1;

      // Filter out weird prices
      if (price > 900 || price === 0) continue; 
      
      // Filter out names that look like SKU codes or Garbage
      // Remove leading digits/SKUs: "4011 Bananas" -> "Bananas"
      name = name.replace(/^[\d\s-]{3,}/, '');
      // Remove noisy leading symbols: "\ MEAT" -> "MEAT"
      name = name.replace(/^[^a-zA-Z0-9]+/, '');

      // If name became empty or is just numbers, skip
      if (name.length < 2 || /^\d+$/.test(name)) continue;

      // Check buffer for Quantity context
      if (buffer.length > 0) {
        const lastLine = buffer[buffer.length - 1];
        const qtyMatch = lastLine.match(quantityRegex);
        
        if (qtyMatch) {
            quantity = parseInt(qtyMatch[1], 10);
        } else if (lastLine.length > 3 && !/^\d+$/.test(lastLine) && !isLineNoisy(lastLine)) {
            // Likely a multi-line name
            // "PRESIDENTS CHOICE"
            // "COOKIES 2.99"
            name = `${lastLine} ${name}`;
        }
      }

      items.push({ id: generateId(), name, price, quantity });
      buffer = []; // Clear buffer
    } else {
        // Line didn't match price pattern. Add to buffer for context.
        if (!isLineNoisy(line)) {
            buffer.push(line);
        }
        if (buffer.length > 2) buffer.shift(); // Keep buffer small
    }
  }

  return items;
};

export const processReceiptWithOCR = async (imageBlob: Blob): Promise<ParsedReceipt> => {
  // 1. Preprocess
  const preprocessedImage = await preprocessImage(imageBlob);
  
  // 2. Initialize Tesseract with AUTO page segmentation for better layout handling
  const worker = await Tesseract.createWorker('eng'); 
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.AUTO, 
  });

  const result = await worker.recognize(preprocessedImage);
  await worker.terminate();

  const rawText = result.data.text;
  const lines = cleanText(rawText);

  // 3. Extract Data
  const storeName = extractStore(lines);
  const date = extractDate(lines);
  const total = extractTotal(lines);
  const items = extractItems(lines);

  // Fallback: If no items found, provide an empty row
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
