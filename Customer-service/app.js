const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'customer_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/customers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/customers/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/customers', async (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    try {
        const [result] = await pool.query(
            'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
            [name, email, phone || null, address || null]
        );
        res.status(201).json({ id: result.insertId, name, email, phone, address });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already registered' });
        res.status(500).json({ error: err.message });
    }
});

app.put('/customers/:id', async (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    try {
        const [result] = await pool.query(
            'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name, email, phone || null, address || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json({ id: parseInt(req.params.id), name, email, phone, address });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already used' });
        res.status(500).json({ error: err.message });
    }
});

app.delete('/customers/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/customer-reviews', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customer_reviews ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/customer-reviews/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customer_reviews WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Review not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/customer-reviews', async (req, res) => {
    const { customer_id, rating, review_text } = req.body;
    if (!customer_id || !rating) return res.status(400).json({ message: 'customer_id and rating are required' });
    try {
        const [result] = await pool.query(
            'INSERT INTO customer_reviews (customer_id, rating, review_text) VALUES (?, ?, ?)',
            [customer_id, rating, review_text || null]
        );
        res.status(201).json({ id: result.insertId, customer_id, rating, review_text });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/customer-reviews/:id', async (req, res) => {
    const { rating, review_text } = req.body;
    if (!rating) return res.status(400).json({ message: 'rating is required' });
    try {
        const [result] = await pool.query(
            'UPDATE customer_reviews SET rating = ?, review_text = ? WHERE id = ?',
            [rating, review_text || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Review not found' });
        res.json({ id: parseInt(req.params.id), rating, review_text });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/customer-reviews/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM customer_reviews WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Review not found' });
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'customer-service' }));

app.listen(3002, () => console.log('Customer service running on port 3002'));
