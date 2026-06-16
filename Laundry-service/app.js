const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3001;

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

// GET all laundry packages
app.get('/laundry', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM laundry_packages');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single laundry package
app.get('/laundry/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM laundry_packages WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Laundry package not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE laundry package
app.post('/laundry', async (req, res) => {
    const { name, description, price } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO laundry_packages (name, description, price) VALUES (?, ?, ?)',
            [name, description, price]
        );
        res.status(201).json({ id: result.insertId, name, description, price });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE laundry package
app.put('/laundry/:id', async (req, res) => {
    const { name, description, price } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE laundry_packages SET name = ?, description = ?, price = ? WHERE id = ?',
            [name, description, price, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Laundry package not found' });
        }
        res.json({ id: req.params.id, name, description, price });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE laundry package
app.delete('/laundry/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM laundry_packages WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Laundry package not found' });
        }
        res.json({ message: 'Laundry package deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Laundry Categories CRUD ---

// GET all laundry categories
app.get('/laundry-categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM laundry_categories');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single laundry category
app.get('/laundry-categories/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM laundry_categories WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE laundry category
app.post('/laundry-categories', async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO laundry_categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({ id: result.insertId, name, description });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE laundry category
app.put('/laundry-categories/:id', async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE laundry_categories SET name = ?, description = ? WHERE id = ?',
            [name, description, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ id: req.params.id, name, description });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE laundry category
app.delete('/laundry-categories/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM laundry_categories WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`LaundryService listening on port ${port}`);
});
