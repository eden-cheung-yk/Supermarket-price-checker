# SmartPrice Tracker (Docker/NAS Edition)

**SmartPrice** is a self-hosted grocery price tracker tailored for Canada.
- **Privacy First:** All data is stored locally in an SQLite database (`smartprice.db`) on your NAS.
- **Offline OCR:** Uses Tesseract.js to scan receipts without external AI APIs.
- **Features:** Expense tracking, price comparison, historical trends, and flyer shortcuts.

## 🐳 Docker Deployment (Recommended)

This is the easiest way to run SmartPrice on Synology, QNAP, or any Linux server.

### 1. Installation
1.  **Create a folder** on your NAS (e.g., `smartprice`).
2.  **Upload** all the project files into this folder.
3.  **SSH** into your NAS and navigate to the folder.
4.  Run the following command to build and start the container:
    ```bash
    docker-compose up -d --build
    ```

### 2. Access the App
Open your browser and go to:
`http://<YOUR-NAS-IP>:3000`

### 3. Data Persistence
*   A folder named `data` will be created automatically in your project directory.
*   Your database file (`smartprice.db`) is stored inside this `data` folder.
*   **Backup:** Simply copy the `data` folder to backup your receipts.

---

## 🛠 Manual Node.js Installation (No Docker)

If you cannot use Docker, you can run it directly with Node.js.

1.  **Install Node.js** (v18+).
2.  Run `npm install` to install dependencies.
3.  Run `npm run build` to compile the frontend.
4.  Run `npm start` to start the server.
    *   (Optional) Use `pm2 start server.js` to keep it running in the background.

## 🚀 Features Checklist
*   ✅ **Receipt Scanning**: Snap a photo, Tesseract extracts text.
*   ✅ **Manual Entry**: Edit parsed items, add quantities, fix prices.
*   ✅ **Price Check**: Scan barcodes to search history or online links.
*   ✅ **Dashboard**: View monthly spending and Canadian flyer deals.
*   ✅ **Multi-language**: English & Traditional Chinese (繁體中文).
