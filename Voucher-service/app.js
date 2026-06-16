const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3002; // Using 3002 to differentiate from Laundry-service

app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laundry_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// GET all vouchers
app.get('/vouchers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vouchers');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single voucher
app.get('/vouchers/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Voucher not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE voucher
app.post('/vouchers', async (req, res) => {
    const { code, discount, valid_until } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO vouchers (code, discount, valid_until) VALUES (?, ?, ?)',
            [code, discount, valid_until]
        );
        res.status(201).json({ id: result.insertId, code, discount, valid_until });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE voucher
app.put('/vouchers/:id', async (req, res) => {
    const { code, discount, valid_until } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE vouchers SET code = ?, discount = ?, valid_until = ? WHERE id = ?',
            [code, discount, valid_until, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Voucher not found' });
        }
        res.json({ id: req.params.id, code, discount, valid_until });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE voucher
app.delete('/vouchers/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM vouchers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Voucher not found' });
        }
        res.json({ message: 'Voucher deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- VOUCHER USAGES CRUD ---

app.get('/voucher-usages', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM voucher_usages ORDER BY used_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/voucher-usages/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM voucher_usages WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Voucher usage not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/voucher-usages', async (req, res) => {
    const { voucher_id, order_id } = req.body;
    if (!voucher_id || !order_id) return res.status(400).json({ message: 'voucher_id and order_id are required' });
    try {
        const [result] = await pool.query(
            'INSERT INTO voucher_usages (voucher_id, order_id) VALUES (?, ?)',
            [voucher_id, order_id]
        );
        res.status(201).json({ id: result.insertId, voucher_id, order_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/voucher-usages/:id', async (req, res) => {
    const { voucher_id, order_id } = req.body;
    if (!voucher_id || !order_id) return res.status(400).json({ message: 'voucher_id and order_id are required' });
    try {
        const [result] = await pool.query(
            'UPDATE voucher_usages SET voucher_id = ?, order_id = ? WHERE id = ?',
            [voucher_id, order_id, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Voucher usage not found' });
        res.json({ id: parseInt(req.params.id), voucher_id, order_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/voucher-usages/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM voucher_usages WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Voucher usage not found' });
        res.json({ message: 'Voucher usage deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'voucher-service' }));

app.listen(port, () => {
    console.log(`VoucherService listening on port ${port}`);
});
