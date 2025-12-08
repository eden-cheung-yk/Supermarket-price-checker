
import Tesseract from 'tesseract.js';
import { ProductItem } from '../types';

interface ParsedReceipt {
  storeName: string;
  date: string;
  total: number;
  items: ProductItem[];
  rawText: string;
}

/**
 * Clean up OCR text
 */
const cleanText = (text: string) => {
  return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
};

/**
 * Extract Date using Regex
 * Looks for YYYY-MM-DD, MM/DD/YYYY, etc.
 */
const extractDate = (lines: string[]): string => {
  const dateRegex = /(\d{4}[-/]\d{2}[-/]\d{2})|(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match) {
      // Basic normalization could go here, but returning raw match for now
      // Ideally convert to YYYY-MM-DD
      return match[0]; 
    }
  }
  return new Date().toISOString().split('T')[0];
};

/**
 * Extract Total Amount
 * Looks for lines starting with "Total", "Balance", etc.
 */
const extractTotal = (lines: string[]): number => {
  const totalRegex = /(?:total|balance|amount|due|subtotal).{0,10}(\$?\s*\d+\.\d{2})/i;
  // Also look for isolated prices at the bottom
  const priceRegex = /\$?\s*(\d+\.\d{2})/;

  // Reverse search (totals are usually at bottom)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const match = line.match(totalRegex);
    if (match && match[1]) {
        return parseFloat(match[1].replace('$', '').trim());
    }
  }
  
  // Fallback: Find the largest number that looks like a price? 
  // Dangerous, might pick up card number. 
  // Let's just return 0 if explicit "Total" keyword not found to be safe.
  return 0;
};

/**
 * Attempt to extract store name (First non-empty line usually)
 */
const extractStore = (lines: string[]): string => {
  if (lines.length > 0) return lines[0];
  return "Unknown Store";
};

/**
 * Main OCR Function
 */
export const processReceiptWithOCR = async (imageBlob: Blob): Promise<ParsedReceipt> => {
  const worker = await Tesseract.createWorker('eng'); // English covers most text
  
  const result = await worker.recognize(imageBlob);
  await worker.terminate();

  const rawText = result.data.text;
  const lines = cleanText(rawText);

  // Parse fields
  const storeName = extractStore(lines);
  const date = extractDate(lines);
  const total = extractTotal(lines);

  // Parsing items from raw OCR text is extremely difficult without AI.
  // We will return an empty list and let the user add them, 
  // OR we can try to add all lines that look like "Text ... Price"
  const items: ProductItem[] = [];
  
  // Very basic item parser: Look for lines ending in a number
  const itemRegex = /(.+)\s+(\d+\.\d{2})[A-Za-z]*$/;
  
  lines.forEach(line => {
    // Skip lines that look like dates or totals
    if (line.match(/total|subtotal|balance|date|time/i)) return;
    
    const match = line.match(itemRegex);
    if (match) {
        items.push({
            id: crypto.randomUUID(),
            name: match[1].trim(),
            price: parseFloat(match[2]),
            quantity: 1
        });
    }
  });

  return {
    storeName,
    date,
    total,
    items: items.length > 0 ? items : [{ id: crypto.randomUUID(), name: "Parsed Item 1", price: 0, quantity: 1 }],
    rawText
  };
};
