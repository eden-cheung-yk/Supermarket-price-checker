import { GoogleGenAI, Type } from "@google/genai";
import { ProductItem, OnlinePrice, WeeklyDeal } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper: Convert Blob to Base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Helper: Clean and parse JSON from AI response
 * Handles cases where AI wraps JSON in markdown blocks
 */
const cleanAndParseJSON = (text: string | undefined): any[] => {
  if (!text) return [];
  let clean = text.trim();
  // Remove markdown code blocks if present
  clean = clean.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  try {
    const result = JSON.parse(clean);
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.error("Failed to parse JSON from AI:", text);
    return [];
  }
}

/**
 * High Accuracy Receipt Parsing using Gemini Vision
 * We send the image directly to the model.
 */
export const parseReceiptImage = async (imageBlob: Blob): Promise<{ storeName: string; date: string; items: ProductItem[]; total: number }> => {
  
  const base64Data = await blobToBase64(imageBlob);

  const prompt = `
    Analyze this receipt image from a Canadian store.
    Extract the following structured data:
    1. Store Name (e.g. Walmart, Loblaws, No Frills).
    2. Date (YYYY-MM-DD).
    3. Items: Name, Price, Quantity. Clean up item names (remove codes like 00342).
    4. Total Amount.
    
    If the image is blurry, do your best to infer based on context.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // 2.5 Flash is multimodal and fast
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          storeName: { type: Type.STRING },
          date: { type: Type.STRING },
          total: { type: Type.NUMBER },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                quantity: { type: Type.NUMBER },
                category: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to parse receipt with AI");
  
  const result = JSON.parse(text);
  
  // Post-process to ensure IDs exist
  const items: ProductItem[] = (result.items || []).map((item: any) => ({
    ...item,
    id: crypto.randomUUID(),
    quantity: item.quantity || 1
  }));

  return {
    storeName: result.storeName || "Unknown Store",
    date: result.date || new Date().toISOString().split('T')[0],
    total: result.total || 0,
    items
  };
};

/**
 * Identify a product from a barcode using Google Search Grounding.
 */
export const identifyProductFromBarcode = async (barcode: string): Promise<string> => {
  const prompt = `What product has the barcode ${barcode}? Give me just the common product name.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  return response.text?.trim() || "Unknown Product";
};

/**
 * Find online prices for a product in Canada.
 */
export const findOnlinePrices = async (productName: string): Promise<OnlinePrice[]> => {
  const prompt = `
    Find the current price of "${productName}" in major Canadian supermarkets like Walmart Canada, Real Canadian Superstore, Metro, Loblaws, and T&T.
    List 3-5 distinct store prices if available.
    RETURN ONLY RAW JSON. NO MARKDOWN.
    Format: [{"store": "Store Name", "price": "$10.99", "productName": "Exact Item Name"}]
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }] 
      // NOTE: responseMimeType: "application/json" is NOT supported with tools
    }
  });

  return cleanAndParseJSON(response.text);
};

/**
 * Get Weekly Flyer Deals for a specific Province
 */
export const getWeeklyDeals = async (province: string): Promise<WeeklyDeal[]> => {
  const prompt = `
    Find the best grocery flyer deals for this week in ${province}, Canada.
    Look for major supermarkets like No Frills, FreshCo, Food Basics, Superstore, Walmart.
    Focus on high-value items like Meat, Produce, and Pantry staples.
    RETURN ONLY RAW JSON. NO MARKDOWN.
    Format: [{"store": "Store Name", "item": "Product", "price": "$2.99", "description": "Limit 2"}]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
      // NOTE: responseMimeType: "application/json" is NOT supported with tools
    }
  });

  return cleanAndParseJSON(response.text);
};