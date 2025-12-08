import { OnlinePrice, WeeklyDeal } from "../types";

// NOTE: This file previously contained Gemini AI logic. 
// It has been repurposed to use Open Data (OpenFoodFacts) and Static Search Links
// to avoid using any AI APIs.

/**
 * Identify a product from a barcode using OpenFoodFacts (Free, Open Source).
 */
export const identifyProductFromBarcode = async (barcode: string): Promise<string> => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product && data.product.product_name) {
      return data.product.product_name;
    }
  } catch (error) {
    console.warn("OpenFoodFacts lookup failed:", error);
  }
  
  return `Product ${barcode}`;
};

/**
 * Generate search links for online prices.
 * Without a backend scraper or AI, we cannot reliably fetch exact real-time prices 
 * due to CORS and anti-scraping measures. 
 * Instead, we provide direct links to search results.
 */
export const findOnlinePrices = async (productName: string): Promise<OnlinePrice[]> => {
  const encodedName = encodeURIComponent(productName);
  
  // Return a list of search URLs pretending to be price objects for the UI
  return [
    { 
      store: "Google Shopping", 
      price: "Check Price", 
      productName: productName, 
      url: `https://www.google.com/search?tbm=shop&q=${encodedName}` 
    },
    { 
      store: "Walmart Canada", 
      price: "Search Store", 
      productName: productName, 
      url: `https://www.walmart.ca/search?q=${encodedName}` 
    },
    { 
      store: "Amazon.ca", 
      price: "Search Store", 
      productName: productName, 
      url: `https://www.amazon.ca/s?k=${encodedName}` 
    },
    { 
      store: "Flipp (Flyers)", 
      price: "View Flyers", 
      productName: productName, 
      url: `https://flipp.com/search/${encodedName}` 
    }
  ];
};

/**
 * Deprecated: Weekly deals are now handled by static links in Dashboard.tsx
 * Keeping empty function to satisfy any lingering imports if necessary.
 */
export const getWeeklyDeals = async (province: string): Promise<WeeklyDeal[]> => {
  return [];
};
