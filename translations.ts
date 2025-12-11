
export type Language = 'en' | 'zh';

export const translations = {
  en: {
    appTitle: "SmartPrice Canada",
    nav: {
      home: "Home",
      scan: "Scan",
      list: "List",
      price: "Price",
      history: "History",
      settings: "Set"
    },
    dashboard: {
      overview: "Dashboard",
      welcome: "Financial Overview",
      ranges: {
        all: "All Time",
        month: "This Month",
        lastMonth: "Last Month",
        year: "This Year"
      },
      cards: {
        total: "Total Spent",
        receipts: "Receipts Scanned",
        dailyAvg: "Daily Average",
        topStore: "Top Store"
      },
      charts: {
        spending: "Spending Trend",
        categories: "Category Allocation",
        stores: "Store Spending Leaderboard"
      },
      restock: {
        title: "Smart Restock",
        desc: "Recommended items based on habit.",
        add: "Add",
        added: "Added",
        empty: "No suggestions right now."
      }
    },
    scanner: {
      title: "New Scan",
      desc: "Capture receipt to analyze.",
      takePhoto: "Take Photo",
      upload: "Upload Image",
      manual: "Manual Input",
      processing: "Analyzing...",
      processingDesc: "Extracting data via OCR...",
      review: "Review Data",
      store: "Merchant",
      date: "Date",
      items: "Line Items",
      addItem: "Add Line",
      total: "Total",
      save: "Save Record",
      back: "Cancel",
      category: "Category",
      selectCategory: "Select..."
    },
    shoppingList: {
      title: "Shopping List",
      placeholder: "Add item...",
      add: "Add",
      empty: "List is empty",
      clearCompleted: "Clean Up"
    },
    priceCheck: {
      title: "Price Finder",
      desc: "Compare local vs online.",
      placeholder: "Search product...",
      checkBtn: "Search",
      scanning: "Scanning...",
      history: "Local History",
      online: "Online Matches",
      noResults: "No matches found.",
      barcodeInstruction: "Align Barcode",
      recentSearches: "Recent",
      clearHistory: "Clear"
    },
    history: {
      title: "Archives",
      desc: "Manage past records.",
      searchPlaceholder: "Search store, date, or price...",
      delete: "Delete",
      noReceipts: "No records found.",
      filters: {
        all: "All Stores",
        sortNew: "Newest First",
        sortOld: "Oldest First",
        sortHigh: "Highest Price",
        sortLow: "Lowest Price"
      }
    },
    settings: {
      title: "Preferences",
      desc: "System configuration.",
      language: "Language",
      budget: "Monthly Target",
      dataManagement: "Data",
      exportCSV: "Export CSV",
      clearData: "Reset Data",
      clearAll: "Delete Everything",
      clearGhost: "Cleanup Invalid",
      confirmClear: "Are you sure? Irreversible.",
      categories: "Categories",
      addCategory: "New Category",
      editCategory: "Edit",
      deleteCategory: "Delete",
      enterCategory: "Name...",
      status: "System Health",
      guide: "Guide",
      guideScan: "1. Scanning",
      guideScanDesc: "Ensure good lighting for OCR accuracy.",
      guidePrice: "2. Pricing",
      guidePriceDesc: "Compare history with web prices.",
      guidePrivacy: "3. Local Data",
      guidePrivacyDesc: "Data stays on your device/NAS."
    }
  },
  zh: {
    appTitle: "SmartPrice 加拿大",
    nav: {
      home: "首頁",
      scan: "掃描",
      list: "清單",
      price: "格價",
      history: "記錄",
      settings: "設定"
    },
    dashboard: {
      overview: "數據總覽",
      welcome: "財務分析",
      ranges: {
        all: "所有時間",
        month: "本月",
        lastMonth: "上月",
        year: "本年"
      },
      cards: {
        total: "總支出",
        receipts: "收據總數",
        dailyAvg: "日均消費",
        topStore: "最高消費商戶"
      },
      charts: {
        spending: "支出趨勢",
        categories: "分類佔比",
        stores: "商戶消費排行榜"
      },
      restock: {
        title: "智能補貨",
        desc: "根據習慣推薦。",
        add: "加入",
        added: "已加",
        empty: "暫無建議"
      }
    },
    scanner: {
      title: "掃描收據",
      desc: "拍攝收據以進行分析。",
      takePhoto: "拍照",
      upload: "上傳圖片",
      manual: "手動輸入",
      processing: "分析中...",
      processingDesc: "OCR 文字辨識進行中...",
      review: "核對資料",
      store: "商店",
      date: "日期",
      items: "項目",
      addItem: "新增項目",
      total: "總額",
      save: "儲存",
      back: "取消",
      category: "分類",
      selectCategory: "選擇..."
    },
    shoppingList: {
      title: "購物清單",
      placeholder: "輸入物品名稱...",
      add: "新增",
      empty: "清單是空的",
      clearCompleted: "清除已完成"
    },
    priceCheck: {
      title: "格價助手",
      desc: "比較本地與網上價格。",
      placeholder: "搜尋產品...",
      checkBtn: "搜尋",
      scanning: "掃描中...",
      history: "本地記錄",
      online: "網上價格",
      noResults: "沒有結果。",
      barcodeInstruction: "對準條碼",
      recentSearches: "最近",
      clearHistory: "清除"
    },
    history: {
      title: "歷史檔案",
      desc: "管理過往記錄。",
      searchPlaceholder: "搜尋商店、日期或金額...",
      delete: "刪除",
      noReceipts: "沒有記錄。",
      filters: {
        all: "所有商店",
        sortNew: "最新",
        sortOld: "最舊",
        sortHigh: "金額 (高至低)",
        sortLow: "金額 (低至高)"
      }
    },
    settings: {
      title: "設定",
      desc: "系統偏好設定。",
      language: "語言",
      budget: "每月預算目標",
      dataManagement: "數據管理",
      exportCSV: "匯出 CSV",
      clearData: "重置數據",
      clearAll: "刪除所有",
      clearGhost: "清理無效數據",
      confirmClear: "確定？此操作無法還原。",
      categories: "分類管理",
      addCategory: "新增分類",
      editCategory: "編輯",
      deleteCategory: "刪除",
      enterCategory: "名稱...",
      status: "系統狀態",
      guide: "使用指南",
      guideScan: "1. 掃描",
      guideScanDesc: "確保光線充足。",
      guidePrice: "2. 格價",
      guidePriceDesc: "比較歷史與網絡價格。",
      guidePrivacy: "3. 隱私",
      guidePrivacyDesc: "數據僅儲存於本地/NAS。"
    }
  }
};
