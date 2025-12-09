# SmartPrice Tracker (NAS Edition)

**SmartPrice** is a self-hosted grocery price tracker.
- **Privacy:** Data stored in a local SQLite database file (`smartprice.db`) on your NAS.
- **Offline:** Uses Tesseract.js for scanning.
- **Technology:** React (Frontend) + Node.js (Backend) + SQLite (Database).

## 🛠️ Installation Guide for NAS (Synology/QNAP/Linux)

You do **not** need Docker for this version. It runs natively on Node.js.

### 1. Prerequisites
*   Install **Node.js** (Version 18 or higher) on your NAS.
*   Enable **SSH** access to your NAS.

### 2. Setup
1.  **Download Code**: Copy all project files to a folder on your NAS (e.g., `/volume1/web/smartprice`).
2.  **SSH into NAS**:
    ```bash
    ssh admin@your-nas-ip
    cd /volume1/web/smartprice
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    # This installs the server, database driver (sqlite3), and frontend tools.
    ```
4.  **Build Frontend**:
    ```bash
    npm run build
    # This creates the 'dist' folder with the website files.
    ```

### 3. Run the App
To start the server:
```bash
npm start
```
The app will be available at: `http://YOUR_NAS_IP:3000`

### 4. Keep it Running (Background Service)
If you close the SSH window, the app will stop. To keep it running:
1.  Install PM2 (Process Manager):
    ```bash
    npm install -g pm2
    ```
2.  Start the app with PM2:
    ```bash
    pm2 start server.js --name "smartprice"
    ```
3.  Save the list so it auto-starts on reboot:
    ```bash
    pm2 save
    ```

## 📂 Data Backup
*   All your data is stored in a single file: **`smartprice.db`**.
*   It is located in the root folder of the project.
*   To backup, simply copy this file to another location.

## 🚀 Features
*   **Scan**: Upload receipts, OCR reads text locally.
*   **Edit**: Modify item names, prices, and **quantities**.
*   **Track**: View spending charts and history.
*   **Price Check**: Search online flyers (links provided) or check local history.
