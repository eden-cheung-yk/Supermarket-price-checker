
# SmartPrice Tracker - NAS Deployment Guide

This guide explains how to host this application on your own NAS using GitHub and Docker.

## Prerequisites
1.  **GitHub Account**: To store your code.
2.  **NAS / Server**: Must have **Docker** and **Git** installed.
    *   *Synology*: Install "Container Manager" (Docker) and "Git Server".
    *   *Linux Server*: Run `sudo apt install docker.io docker-compose git`.

---

## Step 1: Upload Code to GitHub

1.  **Create a Repository**: Go to GitHub.com, create a new repository named `smartprice`.
2.  **Prepare Local Folder**: Ensure all your files (`Dockerfile`, `docker-compose.yml`, `package.json`, `src` files, etc.) are in one folder.
3.  **Push Code**:
    Open your terminal in that folder and run:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/<YOUR_USERNAME>/smartprice.git
    git push -u origin main
    ```

---

## Step 2: Download & Run on NAS

1.  **SSH into your NAS**:
    *   Windows: `ssh your_username@192.168.1.xxx`
    *   Mac/Linux: Terminal -> `ssh ...`
2.  **Clone the Repository**:
    ```bash
    # Create a folder for your apps
    mkdir -p ~/docker/smartprice
    cd ~/docker/smartprice

    # Download your code
    git clone https://github.com/<YOUR_USERNAME>/smartprice.git .
    ```
3.  **Start the App**:
    ```bash
    # This builds the app from source and starts it
    sudo docker-compose up -d --build
    ```

---

## Step 3: Access the App

*   Open your browser and go to: `http://<YOUR_NAS_IP>:8080`
*   Example: `http://192.168.1.50:8080`

---

## How to Update

When you make changes to the code on your computer:
1.  Push changes to GitHub (`git push`).
2.  On your NAS, run:
    ```bash
    cd ~/docker/smartprice
    git pull
    sudo docker-compose up -d --build
    ```
