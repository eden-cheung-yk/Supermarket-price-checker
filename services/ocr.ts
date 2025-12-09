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
      const scaleFactor = Math.min(2.5, 3000 / Math.max(img.width, img.height)); 
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 2. Grayscale & Binarization
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        // Threshold adjusted for typical receipt paper contrast
        const val = gray > 145 ? 255 : 0; 

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
    .filter(line => line.length > 0); 
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
      if (match) return match[0];
    }
  }
  return new Date().toISOString().split('T')[0];
};

const extractTotal = (lines: string[]): number => {
  const totalKeywords = ['total', 'balance due', 'amount due', 'final', 'grand total'];
  const avoidKeywords = ['subtotal', 'tax', 'hst', 'gst', 'pst', 'change', 'cash', 'visa', 'debit'];
  const priceRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/;
  
  let maxVal = 0;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].toLowerCase();
    const match = lines[i].match(priceRegex);

    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (totalKeywords.some(k => line.includes(k)) && !avoidKeywords.some(k => line.includes(k))) {
        return val; 
      }
      if (val > maxVal) maxVal = val;
    }
  }
  return maxVal;
};

const extractStore = (lines: string[]): string => {
  const skipPatterns = [/^\d+/, /phone|tel|fax/i, /www\.|http|\.com/i, /welcome/i, /receipt/i, /gst|hst/i];
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    if (line.length > 3 && !skipPatterns.some(p => p.test(line))) {
        return line.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
  }
  return "Unknown Store";
};

const extractItems = (lines: string[]): ProductItem[] => {
  const items: ProductItem[] = [];
  const LIST_END_MARKERS = ['total', 'subtotal', 'tax', 'hst', 'gst', 'pst', 'items sold', 'balance', 'visa', 'debit', 'auth', 'amount due', 'card'];
  
  // Regex 1: Standard Line "Milk 3.99"
  // Captures: 1=Name, 2=Price
  const lineWithPriceRegex = /^(.+?)\s+(-?\d+\.\d{2})\s*[A-Z]*$/;
  
  // Regex 2: Quantity Line "2 @ 1.99"
  // Captures: 1=Qty, 2=UnitPrice
  const quantityLineRegex = /^(\d+)\s*[@x]\s*(\d+\.\d{2})/i;
  
  // Regex 3: Standalone Price "3.99"
  const standalonePriceRegex = /^(-?\d+\.\d{2})\s*[A-Z]*$/;
  
  // Regex 4: SKU/Barcodes (5+ digits at start of line)
  const longNumberRegex = /^\d{5,}$/;

  let buffer: string[] = []; // Stores text lines that haven't been assigned to an item yet

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();

    // End condition: Stop processing if we hit footer markers
    if (LIST_END_MARKERS.some(marker => lowerLine.startsWith(marker))) {
        // Safety break to stop capturing taxes/totals as items
        break; 
    }
    
    // Skip specific headers or noise
    if (line.match(/welcome|receipt|store|phone|cashier/i)) continue;
    if (/\d{4}[-./]\d{2}[-./]\d{2}/.test(line)) continue; // Date line

    // --- Scenario A: Standard Line with Price ---
    const priceMatch = line.match(lineWithPriceRegex);
    if (priceMatch) {
      let name = priceMatch[1].trim();
      let price = parseFloat(priceMatch[2]);
      let quantity = 1;

      // Check buffer for quantity context or multi-line name
      if (buffer.length > 0) {
        const lastLine = buffer[buffer.length - 1];
        const qtyMatch = lastLine.match(quantityLineRegex);
        
        if (qtyMatch) {
            quantity = parseInt(qtyMatch[1], 10);
            // Note: price extracted from current line is usually the Total for that line item
        } else if (!longNumberRegex.test(lastLine) && lastLine.length > 2) {
            // Treat as Multi-line name: "Organic" \n "Bananas 2.00"
            name = `${lastLine} ${name}`;
        }
      }

      // Cleanup Name (remove leading SKU e.g., "4011 Bananas")
      name = name.replace(/^\d{4,}\s+/, '');

      if (name.length > 1 && !/^\d+$/.test(name)) {
        items.push({ id: generateId(), name, price, quantity });
      }
      buffer = []; 
      continue;
    }

    // --- Scenario B: Standalone Price Line ---
    // Sometimes receipts split name and price:
    // "Tomato Soup"
    // "2.99"
    const standaloneMatch = line.match(standalonePriceRegex);
    if (standaloneMatch) {
        let price = parseFloat(standaloneMatch[1]);
        let quantity = 1;
        let name = "";

        if (buffer.length > 0) {
            // Reconstruct name from buffer
            let nameParts: string[] = [];
            for (const bufLine of buffer) {
                const qtyMatch = bufLine.match(quantityLineRegex);
                if (qtyMatch) {
                    quantity = parseInt(qtyMatch[1], 10);
                } else if (!longNumberRegex.test(bufLine)) {
                    nameParts.push(bufLine);
                }
            }
            name = nameParts.join(' ');
        }
        
        name = name.replace(/^\d{4,}\s+/, '');
        
        if (name.length > 1) {
             items.push({ id: generateId(), name, price, quantity });
        }
        buffer = [];
        continue;
    }

    // --- Scenario C: Text Line ---
    // Add to buffer (might be name part or quantity line for next item)
    if (line.length > 0) {
        buffer.push(line);
        // Prevent buffer from growing infinitely if OCR returns garbage
        if (buffer.length > 4) buffer.shift();
    }
  }

  return items;
};

export const processReceiptWithOCR = async (imageBlob: Blob): Promise<ParsedReceipt> => {
  const preprocessedImage = await preprocessImage(imageBlob);
  const worker = await Tesseract.createWorker('eng'); 
  const result = await worker.recognize(preprocessedImage);
  await worker.terminate();

  const rawText = result.data.text;
  const lines = cleanText(rawText);

  const storeName = extractStore(lines);
  const date = extractDate(lines);
  const total = extractTotal(lines);
  const items = extractItems(lines);

  return {
    storeName,
    date,
    total,
    items: items.length > 0 ? items : [{ id: generateId(), name: "Parsed Item", price: 0, quantity: 1 }],
    rawText
  };
};