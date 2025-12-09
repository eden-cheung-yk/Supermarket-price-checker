import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Setup for ES Modules path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
// Default to a 'data' folder for Docker volume compatibility
const DB_FILE = process.env.DB_FILE || 'data/smartprice.db';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Database Interface
let db;

const initDB = async () => {
  try {
    const dbPath = path.resolve(__dirname, DB_FILE);
    const dbDir = path.dirname(dbPath);

    // Ensure the data directory exists (crucial for Docker volumes)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`📂 Created data directory: ${dbDir}`);
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Create Table for Receipts
    await db.exec(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        store_name TEXT,
        date TEXT,
        total_amount REAL,
        content TEXT, 
        created_at INTEGER
      )
    `);

    console.log(`✅ Connected to SQLite database: ${dbPath}`);
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
  }
};

initDB();

// --- API Routes ---

// GET: Fetch all receipts
app.get('/api/receipts', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });
    
    const rows = await db.all('SELECT content FROM receipts ORDER BY created_at DESC');
    const receipts = rows.map(row => JSON.parse(row.content));
    res.json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST: Save a new receipt
app.post('/api/receipts', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });

    const receipt = req.body;
    if (!receipt.id || !receipt.createdAt) {
      return res.status(400).json({ error: 'Invalid receipt data' });
    }

    // Upsert logic (Insert or Replace)
    await db.run(
      `INSERT OR REPLACE INTO receipts (id, store_name, date, total_amount, content, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        receipt.id,
        receipt.storeName || 'Unknown',
        receipt.date,
        receipt.totalAmount,
        JSON.stringify(receipt),
        receipt.createdAt
      ]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save receipt' });
  }
});

// DELETE: Remove a receipt
app.delete('/api/receipts/:id', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });

    const { id } = req.params;
    await db.run('DELETE FROM receipts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

// --- Serve React Frontend ---
// Requests not matching API routes are sent to index.html (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  🚀 SmartPrice Server running!
  ---------------------------
  Local:   http://localhost:${PORT}
  Database: ${DB_FILE}
  ---------------------------
  `);
});