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

/**
 * Preprocesses the image to improve OCR accuracy.
 * Converts to Grayscale -> Increases Contrast -> Binarizes.
 */
const preprocessImage = (imageBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(url); // Fallback to original if context fails
        return;
      }

      // 1. Scale image (2x up to a limit) to help with small receipt fonts
      const scaleFactor = Math.min(2, 3000 / Math.max(img.width, img.height)); 
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 2. Grayscale & Binarization (Thresholding)
      // This turns the image into high-contrast Black & White
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Luminosity formula
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        // Threshold (128 is mid-point, slightly higher helps remove faint shadows)
        const val = gray > 140 ? 255 : 0;

        data[i] = val;     // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = reject;
    img.src = url;
  });
};

// --- Regex Helpers ---

/**
 * Clean up OCR text: remove empty lines, very short lines, and common noise characters
 */
const cleanText = (text: string): string[] => {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 2); // Ignore lines with 1-2 chars
};

/**
 * Enhanced Date Extraction
 * Supports: YYYY-MM-DD, DD/MM/YYYY, Jan 01 2024, etc.
 */
const extractDate = (lines: string[]): string => {
  const datePatterns = [
    /\d{4}[-./]\d{2}[-./]\d{2}/,       // 2024-01-01
    /\d{1,2}[-./]\d{1,2}[-./]\d{2,4}/,  // 01/01/2024
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}/i // Jan 1, 2024
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        // Simple normalization attempt (can be improved with date-fns if needed)
        return match[0];
      }
    }
  }
  return new Date().toISOString().split('T')[0];
};

/**
 * Enhanced Total Extraction
 * Looks for specific keywords and finds the largest number associated with them.
 */
const extractTotal = (lines: string[]): number => {
  // Keywords that strongly indicate the final price
  const totalKeywords = ['total', 'balance due', 'amount due', 'final', 'grand total'];
  // Keywords to avoid (subtotal usually comes before total)
  const avoidKeywords = ['subtotal', 'tax', 'hst', 'gst', 'pst', 'change', 'cash', 'visa', 'debit'];

  let possibleTotals: number[] = [];

  const priceRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/;

  // Reverse iterate (Total is usually at the bottom)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].toLowerCase();
    const match = lines[i].match(priceRegex);

    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      
      // If line contains a "Total" keyword, it's a strong candidate
      if (totalKeywords.some(k => line.includes(k)) && !avoidKeywords.some(k => line.includes(k))) {
        return val; // High confidence
      }
      possibleTotals.push(val);
    }
  }

  // Fallback: If no "Total" keyword found, take the largest number found in the bottom 1/3rd of the receipt
  // assuming the total is usually the highest value.
  if (possibleTotals.length > 0) {
    return Math.max(...possibleTotals); 
  }
  
  return 0;
};

/**
 * Attempt to extract store name.
 * Skips lines that look like addresses, phone numbers, or dates.
 */
const extractStore = (lines: string[]): string => {
  const skipPatterns = [
    /^\d+/,             // Starts with number (Address)
    /phone|tel|fax/i,   // Phone number
    /www\.|http|\.com/i,// Website
    /welcome/i,         // "Welcome to..."
    /receipt/i          // "Sales Receipt"
  ];

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.length > 3 && !skipPatterns.some(p => p.test(line))) {
        // Convert all caps to Title Case for better readability
        return line.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
  }
  return "Unknown Store";
};

/**
 * Main OCR Function
 */
export const processReceiptWithOCR = async (imageBlob: Blob): Promise<ParsedReceipt> => {
  // 1. Preprocess Image
  const preprocessedImage = await preprocessImage(imageBlob);

  // 2. Run Tesseract
  const worker = await Tesseract.createWorker('eng'); 
  const result = await worker.recognize(preprocessedImage);
  await worker.terminate();

  const rawText = result.data.text;
  const lines = cleanText(rawText);

  // 3. Extract Meta Data
  const storeName = extractStore(lines);
  const date = extractDate(lines);
  const total = extractTotal(lines);

  // 4. Extract Items
  const items: ProductItem[] = [];
  
  // Stop words that indicate the end of the item list
  const LIST_END_MARKERS = ['total', 'subtotal', 'tax', 'hst', 'gst', 'pst', 'items sold', 'balance', 'visa', 'debit', 'auth'];
  
  // Regex to find price at the end of a line (e.g., "Milk 2.99" or "Milk 2.99 H")
  // Captures: Group 1 (Name), Group 2 (Price)
  const itemLineRegex = /^(.+?)\s+(\d+\.\d{2})\s*[A-Z]*$/;

  // Regex to detect quantity lines (e.g., "2 @ 1.99")
  const quantityRegex = /^(\d+)\s*[@x]\s*(\d+\.\d{2})/;

  let isBelowListEnd = false;

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    // Check if we hit the footer section
    if (LIST_END_MARKERS.some(marker => lowerLine.includes(marker))) {
      isBelowListEnd = true;
      return;
    }

    if (isBelowListEnd) return;

    // A. Check for Item line
    const itemMatch = line.match(itemLineRegex);
    if (itemMatch) {
      let name = itemMatch[1].trim();
      const price = parseFloat(itemMatch[2]);
      let quantity = 1;

      // Filter out garbage lines (e.g. pure numbers, dates)
      if (name.length < 3 || /^\d+$/.test(name) || name.includes('...')) return;

      // B. Check if name contains quantity info (e.g. "2 @ 1.99 ItemName" or "ItemName 2 @ 1.99")
      // Currently simplest to just assume 1 unless we parsed a quantity line immediately before (advanced logic omitted for simplicity)
      
      // Basic quantity heuristic: if the line looks like "2 @ 1.99", this line might be a modifier for the *next* item
      // But commonly on receipts:
      // Line 1:  Item Name   5.00
      // OR
      // Line 1:  Item Name
      // Line 2:    2 @ 2.50  5.00
      
      items.push({
        id: generateId(),
        name: name,
        price: price,
        quantity: quantity
      });
    }
  });

  return {
    storeName,
    date,
    total,
    items: items.length > 0 ? items : [{ id: generateId(), name: "Parsed Item 1", price: 0, quantity: 1 }],
    rawText
  };
};