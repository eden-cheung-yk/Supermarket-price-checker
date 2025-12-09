# SmartPrice Tracker (Self-Hosted)

**SmartPrice** is a privacy-first, self-hosted grocery price tracker for Canada. It runs entirely on your own hardware (NAS/Server) using Docker.

> **Note:** No API keys required. Uses Tesseract OCR (Offline) and OpenFoodFacts.

---

## 🚀 Quick Start (NAS / Docker)

### 1. File Setup
Ensure you have the following files in a single folder on your computer:
*   `Dockerfile`
*   `docker-compose.yml`
*   `package.json`
*   `vite.config.ts`
*   `tsconfig.json`
*   `server.js`
*   `index.html`
*   `index.tsx`, `App.tsx`, `types.ts`, `translations.ts`
*   Folders: `components/`, `services/`

### 2. Upload to NAS
1.  Open your NAS File Manager.
2.  Create a folder `docker/smartprice`.
3.  Upload **ALL** the files into this folder.

### 3. Run Command
1.  SSH into your NAS.
2.  Navigate to the folder:
    ```bash
    cd /volume1/docker/smartprice
    ```
3.  Build and Run:
    ```bash
    sudo docker-compose up -d --build
    ```

### 4. Open App
Open your browser and go to:
`http://<YOUR_NAS_IP>:8088`

---

## 🌟 Features

1.  **Offline Receipt Scanning**: Uses Tesseract.js to read receipts locally.
2.  **Price Check**: Scan barcodes to find previous prices or check Canadian online stores (Amazon.ca, Walmart, etc.).
3.  **Dashboard**: Track spending and view weekly flyer links for your province.
4.  **Database**: Uses PostgreSQL to save data permanently.

---

## ❓ Troubleshooting

**Build Fails?**
*   Ensure `tsconfig.json` exists in the folder.
*   Ensure `Dockerfile` is present.

**Camera not working?**
*   Browsers block cameras on insecure HTTP.
*   **Fix:** In Chrome, go to `chrome://flags`, search for "Insecure origins treated as secure", and add `http://<YOUR_NAS_IP>:8088`.

**Database Error?**
*   Check logs: `sudo docker-compose logs -f app`
*   Ensure the `db` container is healthy.
