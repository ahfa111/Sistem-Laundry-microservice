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

app.listen(port, () => {
    console.log(`VoucherService listening on port ${port}`);
});
