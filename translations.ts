
export type Language = 'en' | 'zh';

export const translations = {
  en: {
    appTitle: "SmartPrice Canada",
    nav: {
      home: "Home",
      scan: "Scan",
      price: "Price",
      history: "History",
      settings: "Set"
    },
    dashboard: {
      overview: "Overview",
      welcome: "Welcome back!",
      province: "Province",
      totalSpent: "Total Spent",
      receipts: "Receipts",
      spendingTrend: "Spending Trend",
      weeklyDeals: "Weekly Flyer Shortcuts",
      viewFlyers: "View Flyers",
      dealsDesc: "Quick links to flyer aggregators for"
    },
    scanner: {
      title: "Scan Receipt",
      desc: "Use your camera to scan receipts. Processing is done locally using Tesseract OCR.",
      takePhoto: "Take Photo",
      manual: "Enter Manually",
      processing: "Processing Image...",
      processingDesc: "Reading text locally...",
      review: "Review Scan",
      store: "Store",
      date: "Date",
      items: "Items Purchased",
      addItem: "Add Item",
      total: "Total Amount",
      save: "Save Receipt",
      back: "Back",
      category: "Category",
      selectCategory: "Select Category"
    },
    priceCheck: {
      title: "Price Check",
      desc: "Compare prices locally & across Canada.",
      placeholder: "Product name (e.g. Milk)",
      checkBtn: "Check Prices",
      scanning: "Scanning...",
      history: "Your Purchase History",
      online: "Online Prices (Canada)",
      noResults: "No results found.",
      barcodeInstruction: "Point camera at a barcode"
    },
    history: {
      title: "History",
      desc: "Your past shopping trips.",
      delete: "Delete",
      noReceipts: "No receipts scanned yet."
    },
    settings: {
      title: "Settings",
      desc: "App configuration and guide.",
      language: "Language / 語言",
      categories: "Manage Categories",
      addCategory: "Add Category",
      editCategory: "Edit",
      deleteCategory: "Delete",
      enterCategory: "Category name...",
      status: "System Status",
      guide: "User Guide",
      guideScan: "1. Scanning",
      guideScanDesc: "Uses Tesseract OCR to read text locally. Ensure good lighting.",
      guidePrice: "2. Price Check",
      guidePriceDesc: "Search your local history and online prices.",
      guidePrivacy: "3. Privacy",
      guidePrivacyDesc: "All data is stored on your NAS/Local device."
    }
  },
  zh: {
    appTitle: "SmartPrice 加拿大",
    nav: {
      home: "首頁",
      scan: "掃描",
      price: "格價",
      history: "記錄",
      settings: "設定"
    },
    dashboard: {
      overview: "總覽",
      welcome: "歡迎回來！",
      province: "省份",
      totalSpent: "總支出",
      receipts: "收據數量",
      spendingTrend: "支出趨勢",
      weeklyDeals: "本週特價傳單",
      viewFlyers: "查看傳單",
      dealsDesc: "快速查看各大超市傳單："
    },
    scanner: {
      title: "掃描收據",
      desc: "使用相機掃描。使用 Tesseract OCR 進行本地處理。",
      takePhoto: "影相 / 上傳",
      manual: "手動輸入",
      processing: "處理中...",
      processingDesc: "正在辨識文字...",
      review: "核對資料",
      store: "商店名稱",
      date: "日期",
      items: "購買項目",
      addItem: "新增項目",
      total: "總金額",
      save: "儲存收據",
      back: "返回",
      category: "分類",
      selectCategory: "選擇分類"
    },
    priceCheck: {
      title: "格價助手",
      desc: "比較本地歷史價格及網上價格。",
      placeholder: "產品名稱 (例如: 牛奶)",
      checkBtn: "查詢價格",
      scanning: "掃描中...",
      history: "你的購買記錄",
      online: "網上價格 (加拿大)",
      noResults: "找不到結果。",
      barcodeInstruction: "將鏡頭對準條碼"
    },
    history: {
      title: "購物記錄",
      desc: "你之前的購物單據。",
      delete: "刪除",
      noReceipts: "暫無收據。"
    },
    settings: {
      title: "設定",
      desc: "系統設定及教學。",
      language: "語言 / Language",
      categories: "管理分類",
      addCategory: "新增分類",
      editCategory: "編輯",
      deleteCategory: "刪除",
      enterCategory: "分類名稱...",
      status: "系統狀態",
      guide: "使用教學",
      guideScan: "1. 掃描單據",
      guideScanDesc: "使用 Tesseract OCR 本地辨識。請確保光線充足。",
      guidePrice: "2. 格價功能",
      guidePriceDesc: "同時搜尋你的歷史記錄及網上價格。",
      guidePrivacy: "3. 私隱",
      guidePrivacyDesc: "所有資料儲存於你的 NAS 或本地裝置。"
    }
  }
};
