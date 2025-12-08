# SmartPrice Tracker (Self-Hosted)

**SmartPrice** is a privacy-first, self-hosted web application designed to help you track grocery prices, scan receipts, and compare product costs. It is optimized for the **Canadian** market (with province-specific flyer links) and runs entirely on your own hardware using Docker.

> **Note:** This project does **not** require any paid API keys (like OpenAI or Gemini). It uses Open Source tools (Tesseract.js, OpenFoodFacts) and standard web technologies.

---

## 🌟 Key Features

### 1. 🧾 Receipt Scanning (Offline OCR)
*   **How it works:** Uses your device's camera to take a photo of a receipt.
*   **Technology:** Uses `Tesseract.js` to read text directly in your browser.
*   **Privacy:** The image never leaves your device during processing.
*   **Fallback:** If the scan is messy, you can switch to "Manual Entry" to type in items yourself.

### 2. 🔍 Price Check & Barcode Scanner
*   **Barcode Lookup:** Scan a product barcode (EAN/UPC) using your camera. The app queries the open-source **OpenFoodFacts** database to identify the product name.
*   **Price Comparison:** Once a product is identified, it generates direct search links to:
    *   **Local History:** Shows the last price you paid for this item based on your saved receipts.
    *   **Online Stores:** Quick links to Google Shopping, Walmart Canada, Amazon.ca, and Flipp.

### 3. 📊 Dashboard & Analytics
*   **Spending Trends:** A 7-day bar chart showing your spending habits.
*   **Province Selector:** Select your Canadian province (ON, BC, AB, QC, etc.).
*   **Flyer Shortcuts:** Based on your selected province, provides direct links to flyer aggregators (SmartCanucks, Flipp) to check weekly deals without AI hallucinations.

### 4. 🌍 Multi-Language Support
*   **Languages:** Full support for **English** and **Traditional Chinese (繁體中文)**.
*   **Toggle:** Switch languages instantly from the Settings menu.

### 5. 🏠 Self-Hosted Architecture
*   **Database:** Uses **PostgreSQL** to store your data permanently on your NAS.
*   **Offline Capable:** If the server is unreachable, the app falls back to **IndexedDB** (browser storage) so you can still view data.

---

## 🛠️ Deployment Guide (NAS / Docker)

This guide is written for beginners ("小白") who want to run this on a Synology NAS, QNAP, or any Linux server with Docker.

### Prerequisites
1.  **Docker & Docker Compose**: Installed on your NAS.
    *   *Synology:* Install "Container Manager" (formerly Docker) from the Package Center.
2.  **Git (Optional but recommended)**: To download the code easily.

---

### Method A: The "GitHub" Method (Recommended)

This is the easiest way to get the code onto your NAS.

#### Step 1: Put the code on GitHub
1.  Go to [GitHub.com](https://github.com) and create a free account.
2.  Create a **New Repository** named `smartprice`.
3.  Upload all the project files (the ones provided in this chat) to that repository.
    *   *Files needed:* `Dockerfile`, `docker-compose.yml`, `package.json`, `vite.config.ts`, `index.html`, `server.js`, `tsconfig.json`, and the `src` folder (renamed structure as per the code provided).

#### Step 2: Connect to your NAS via SSH
You need to use a terminal to send commands to your NAS.
*   **Windows:** Open "Command Prompt" or "PowerShell".
*   **Mac:** Open "Terminal".

Run this command (replace with your NAS IP and Username):
```bash
ssh your_username@192.168.1.xxx
# Enter your NAS password when prompted
```

#### Step 3: Download and Run
Copy and paste these commands one by one:

1.  **Create a folder:**
    ```bash
    mkdir -p ~/docker/smartprice
    cd ~/docker/smartprice
    ```

2.  **Download your code:**
    (Replace `<YOUR_GITHUB_USERNAME>` with your actual username)
    ```bash
    git clone https://github.com/<YOUR_GITHUB_USERNAME>/smartprice.git .
    ```

3.  **Start the Server:**
    ```bash
    sudo docker-compose up -d --build
    ```
    *   `up`: Starts the containers.
    *   `-d`: Runs in background (Detached).
    *   `--build`: Forces Docker to compile the code.

---

### Method B: The "Manual File" Method (No GitHub)

If you don't use GitHub, you can manually upload files.

1.  **File Station:** Open your NAS File Manager.
2.  **Create Folder:** Create a folder named `docker`, and inside it, `smartprice`.
3.  **Upload:** Upload all the project files (`Dockerfile`, `docker-compose.yml`, etc.) into this folder.
4.  **SSH & Run:**
    *   SSH into your NAS (see Step 2 above).
    *   Navigate to the folder: `cd /volume1/docker/smartprice` (Note: Synology paths usually start with `/volume1`).
    *   Run: `sudo docker-compose up -d --build`

---

## 📱 How to Use the App

Once Docker finishes building (this may take 2-5 minutes the first time):

1.  **Open Browser:** On your phone or computer, type: `http://<YOUR_NAS_IP>:8080` (e.g., `http://192.168.1.50:8080`).
2.  **Add to Home Screen (Mobile):**
    *   *iPhone (Safari):* Tap Share -> "Add to Home Screen".
    *   *Android (Chrome):* Tap Menu -> "Install App" or "Add to Home Screen".
    *   *Why?* This gives the app full screen mode and better camera access.

---

## ❓ Troubleshooting

**Q: The camera isn't working / Screen is black.**
*   **A:** Browsers often block camera access on "http" (insecure) connections unless it is `localhost`.
*   **Fix 1:** Check if your browser permissions allowed the camera.
*   **Fix 2:** In Chrome flags (`chrome://flags`), search for "Insecure origins treated as secure" and add `http://<YOUR_NAS_IP>:8080`. Enable and restart Chrome.
*   **Fix 3:** Setup a Reverse Proxy (like Nginx Proxy Manager) on your NAS to get an HTTPS certificate (Advanced).

**Q: "Backend unavailable" message?**
*   **A:** The frontend React app can't talk to the Node server.
*   Ensure the `docker-compose` container named `app` is running.
*   Check logs: `sudo docker-compose logs -f app`.

**Q: OCR is reading wrong numbers.**
*   **A:** Tesseract (Offline OCR) is not as smart as Cloud AI.
*   Ensure the receipt is flat and well-lit.
*   Use the "Manual Entry" button to correct mistakes.

---

## 📂 Project Structure

*   `Dockerfile`: Instructions to build the app.
*   `docker-compose.yml`: Configures the App and Database to talk to each other.
*   `server.js`: The backend API that talks to the database.
*   `services/db.ts`: Handles data saving (tries Server first, falls back to Phone storage).
*   `services/ocr.ts`: The logic for reading receipts.
