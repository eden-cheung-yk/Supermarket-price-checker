import express from 'express';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Database Configuration (PostgreSQL)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/smartprice',
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize Database Table
const initDB = async () => {
  try {
    // We use a JSONB column 'content' to store the flexible receipt structure.
    // This is perfect for "document" style storage like receipts.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id VARCHAR(255) PRIMARY KEY,
        content JSONB NOT NULL,
        created_at BIGINT NOT NULL
      );
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDB();

// --- API Routes ---

// GET: Fetch all receipts
app.get('/api/receipts', async (req, res) => {
  try {
    const result = await pool.query('SELECT content FROM receipts ORDER BY created_at DESC');
    const receipts = result.rows.map(row => row.content);
    res.json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST: Save a new receipt
app.post('/api/receipts', async (req, res) => {
  try {
    const receipt = req.body;
    if (!receipt.id || !receipt.createdAt) {
      return res.status(400).json({ error: 'Invalid receipt data' });
    }
    
    await pool.query(
      'INSERT INTO receipts (id, content, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET content = $2',
      [receipt.id, receipt, receipt.createdAt]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE: Remove a receipt
app.delete('/api/receipts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM receipts WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Serve React Frontend ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
