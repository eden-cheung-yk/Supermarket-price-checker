# SmartPrice Tracker 🛒

**SmartPrice** is a self-hosted grocery price tracker designed for privacy and offline capability. It allows you to scan receipts, track spending, and compare prices across Canadian retailers without relying on external cloud APIs.

## ✨ Features
*   **Privacy First:** Data lives on your NAS in a local SQLite database (`smartprice.db`).
*   **Offline OCR:** Uses Tesseract.js to read receipts locally in your browser.
*   **Smart Scanning:** Detects store names, dates, and parses items with quantity support.
*   **Category Management:** Organize items by custom categories (Produce, Dairy, Snacks, etc.).
*   **Price Check:** Scan barcodes to compare against your purchase history and online retailers.
*   **Dashboard:** Visual spending trends and shortcuts to provincial flyers.

---

## ⚠️ Important: Mobile Camera Access
**Please read this before installing!**
Browsers (Chrome, Safari, Firefox) **block camera access** on websites that do not use HTTPS, unless the website is `localhost`.
Since your NAS likely uses a local IP (e.g., `http://192.168.1.50:3000`), the scanner might not open on your phone.

**Solutions:**
1.  **Reverse Proxy (Recommended):** Set up a reverse proxy (like Nginx Proxy Manager or Synology's Built-in Reverse Proxy) to serve the app with an SSL certificate (HTTPS).
2.  **Chrome Flags (Quick Fix):** On your Android phone, go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, enter `http://YOUR-NAS-IP:3000`, enable it, and restart Chrome.
3.  **Firefox:** Firefox on Android sometimes allows camera on HTTP if you grant permission explicitly.

---

## 📦 Method 1: Docker (Recommended for NAS)
This method works on Synology, QNAP, or any Linux server with Docker installed.

### Prerequisites
*   Docker & Docker Compose installed on your NAS.
*   SSH access enabled (optional, but easier).

### Steps
1.  **Prepare the Folder:**
    Create a folder on your NAS (e.g., `/volume1/docker/smartprice`).
2.  **Upload Files:**
    Upload all the project files (including `Dockerfile`, `docker-compose.yml`, `package.json`, etc.) into this folder.
3.  **Deploy:**
    *   **Via SSH:**
        Navigate to the folder and run:
        ```bash
        sudo docker-compose up -d --build
        ```
    *   **Via Task Scheduler (Synology):**
        Create a user-defined script task:
        ```bash
        cd /volume1/docker/smartprice
        docker-compose up -d --build
        ```
        Run the task once, then delete it.

**Result:** The app will be available at `http://<YOUR-NAS-IP>:3000`.

---

## 🚢 Method 2: Portainer (GitHub Pull)
If you use Portainer on your NAS and want to pull the code directly from GitHub.

### Prerequisites
1.  Push this code to your own GitHub repository.
2.  Portainer installed on your NAS.

### Steps
1.  **Open Portainer** and go to **Stacks**.
2.  Click **Add stack**.
3.  Name it `smartprice`.
4.  Select **Repository**.
5.  **Repository URL:** Enter your GitHub repo URL (e.g., `https://github.com/yourusername/smartprice.git`).
6.  **Compose path:** `docker-compose.yml`
7.  **Automatic Updates (Optional):** Enable "Poll" to auto-update when you push code changes.
8.  Click **Deploy the stack**.

Portainer will clone your repo, build the image locally on your NAS, and start it.

---

## 🛠 Method 3: Manual Node.js (No Docker)
Use this if you don't want to use Docker containers.

### Prerequisites
*   Node.js (Version 18 or higher) installed on your system.

### Steps
1.  **Download Source:**
    Download the code to a folder on your machine.
2.  **Install Dependencies:**
    Open a terminal in that folder and run:
    ```bash
    npm install
    ```
3.  **Build the Frontend:**
    Compile the React application:
    ```bash
    npm run build
    ```
4.  **Start the Server:**
    ```bash
    npm start
    ```
    *   *Tip:* To keep it running in the background, install PM2: `npm install -g pm2` then `pm2 start server.js --name smartprice`.

**Result:** The app will be available at `http://localhost:3000`.

---

## 📂 Data Backup
Regardless of the installation method, your data is stored in the **`data/`** folder inside the project directory.
*   **File:** `data/smartprice.db` (SQLite Database)
*   **Backup:** Simply copy/paste this file to a safe location.
*   **Restore:** Overwrite the file with your backup and restart the application.

## ❓ Troubleshooting

**Q: The camera screen is black or says "Permission Denied".**
A: See the "Mobile Camera Access" section above. You are likely on HTTP.

**Q: "Database not initialized" error.**
A: Ensure the `data` folder exists and has write permissions. Docker usually handles this automatically via the volume mapping in `docker-compose.yml`.

**Q: OCR is inaccurate.**
A: Ensure good lighting. Flatten the receipt. Dark backgrounds contrast well with white receipts. Tesseract works best on high-contrast text.