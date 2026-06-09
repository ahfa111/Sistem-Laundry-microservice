const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3002;

app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'customer_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==================== CUSTOMER CRUD ====================

// GET all customers
app.get('/customers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single customer by ID
app.get('/customers/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE new customer
app.post('/customers', async (req, res) => {
    const { name, email, phone, address } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
            [name, email, phone || null, address || null]
        );
        res.status(201).json({
            id: result.insertId,
            name,
            email,
            phone: phone || null,
            address: address || null,
            message: 'Customer created successfully'
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already registered' });
        }
        res.status(500).json({ error: err.message });
    }
});

// UPDATE customer
app.put('/customers/:id', async (req, res) => {
    const { name, email, phone, address } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name, email, phone || null, address || null, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({
            id: parseInt(req.params.id),
            name,
            email,
            phone: phone || null,
            address: address || null,
            message: 'Customer updated successfully'
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already used by another customer' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE customer
app.delete('/customers/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'customer-service' });
});

app.listen(port, () => {
    console.log(`CustomerService listening on port ${port}`);
});
