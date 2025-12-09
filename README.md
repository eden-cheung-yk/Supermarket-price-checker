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

## 📦 Method 1: Docker (Detailed Guide)

This guide assumes you are using a Synology NAS, but it applies to QNAP or any Linux server.

### Phase 1: Prepare Files on Your Computer
Before uploading to the NAS, organize the files on your desktop.

1.  Create a main folder named **`smartprice`**.
2.  Inside `smartprice`, create two sub-folders:
    *   `components`
    *   `services`
3.  Save the code files into the correct locations:

    **In the main `smartprice/` folder:**
    *   `Dockerfile`
    *   `docker-compose.yml`
    *   `package.json`
    *   `server.js`
    *   `index.html`
    *   `index.tsx`
    *   `App.tsx`
    *   `types.ts`
    *   `translations.ts`
    *   `vite.config.ts`
    *   `tsconfig.json`
    *   `tsconfig.node.json`
    *   `metadata.json`

    **In the `smartprice/components/` folder:**
    *   `NavBar.tsx`
    *   `Scanner.tsx`
    *   `Dashboard.tsx`
    *   `History.tsx`
    *   `PriceCheck.tsx`

    **In the `smartprice/services/` folder:**
    *   `db.ts`
    *   `gemini.ts`
    *   `ocr.ts`
    *   `utils.ts`

### Phase 2: Upload to NAS

#### Option A: Synology File Station (Easiest)
1.  Log in to your Synology DSM Web Interface.
2.  Open **File Station**.
3.  Navigate to your `docker` shared folder (create one if it doesn't exist).
4.  Drag and drop the entire **`smartprice`** folder from your computer into the File Station window.
5.  You should now have `/docker/smartprice` containing all your files.

#### Option B: Network Share (SMB)
1.  On Windows (`Win+R` -> `\\YOUR-NAS-IP`) or Mac (`Cmd+K` -> `smb://YOUR-NAS-IP`), connect to your NAS.
2.  Open the `docker` folder.
3.  Copy/Paste the `smartprice` folder from your desktop into the network drive.

### Phase 3: Run the Container

You need to run the `docker-compose` command. You can do this via SSH or Task Scheduler.

#### Option A: Via SSH (Terminal)
1.  Enable SSH on your Synology (Control Panel -> Terminal & SNMP -> Enable SSH service).
2.  Open Terminal (Mac) or PowerShell (Windows).
3.  Connect: `ssh your_username@YOUR-NAS-IP`
4.  Navigate to the folder:
    ```bash
    cd /volume1/docker/smartprice
    ```
5.  Start the app:
    ```bash
    sudo docker-compose up -d --build
    ```
    *(Enter your password if prompted. Note: The build process might take 2-5 minutes the first time).*

#### Option B: Via Synology Task Scheduler (No SSH required)
1.  Go to **Control Panel** -> **Task Scheduler**.
2.  Create -> **Scheduled Task** -> **User-defined script**.
3.  **General Tab:**
    *   Task: "Install SmartPrice"
    *   User: `root` (Important!)
    *   Uncheck "Enabled" (we only want to run it manually once).
4.  **Task Settings Tab:**
    *   User-defined script:
        ```bash
        cd /volume1/docker/smartprice
        docker-compose up -d --build
        ```
5.  Click OK.
6.  Select the task in the list and click **Run**.
7.  Wait 5 minutes, then check if the app is running.

---

### Phase 4: Access the App
Open your browser and go to:
`http://<YOUR-NAS-IP>:3000`

---

## 📂 Data Backup
Your data is stored safely on your NAS because of the volume mapping in `docker-compose.yml`.

*   **Location:** `/docker/smartprice/data/smartprice.db`
*   **To Backup:** Simply copy the `smartprice.db` file to another location.
*   **To Restore:** Stop the container (`docker-compose down`), replace the `.db` file, and start it again.

---

## ❓ Troubleshooting

**Q: The camera screen is black.**
A: See the "Important: Mobile Camera Access" section at the top. You need HTTPS or localhost.

**Q: "Build failed" or "npm error".**
A: Make sure you copied ALL the files listed in Phase 1. Missing `tsconfig.json` or `vite.config.ts` will cause the build to fail.

**Q: Permissions errors.**
A: Ensure the user running Docker has read/write access to the `smartprice` folder. Using `sudo` or the `root` user in Task Scheduler usually solves this.
