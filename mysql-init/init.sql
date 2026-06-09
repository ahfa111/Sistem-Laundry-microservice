-- 1. Laundry DB
CREATE DATABASE IF NOT EXISTS laundry_db;
USE laundry_db;

CREATE TABLE IF NOT EXISTS laundry_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO laundry_packages (name, description, price) VALUES
('Cuci Komplit', 'Cuci kering dan setrika, pakaian siap pakai', 15000),
('Cuci Kering', 'Hanya cuci dan keringkan, tanpa setrika', 10000),
('Setrika Saja', 'Hanya setrika pakaian', 8000),
('Cuci Karpet', 'Cuci karpet per meter persegi', 25000);

-- 2. Customer DB
CREATE DATABASE IF NOT EXISTS customer_db;
USE customer_db;

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO customers (name, email, phone, address) VALUES
('Budi Santoso', 'budi@example.com', '081234567890', 'Jl. Merdeka No. 1, Jakarta'),
('Siti Rahayu', 'siti@example.com', '082345678901', 'Jl. Sudirman No. 5, Bandung'),
('Ahmad Fauzi', 'ahmad@example.com', '083456789012', 'Jl. Gatot Subroto No. 10, Surabaya'),
('Dewi Lestari', 'dewi@example.com', '084567890123', 'Jl. Diponegoro No. 3, Yogyakarta');

-- 3. Order DB
CREATE DATABASE IF NOT EXISTS order_db;
USE order_db;

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    service_id INT NOT NULL,
    voucher_id INT,
    order_date DATE NOT NULL,
    weight DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Menunggu'
);

INSERT INTO orders (customer_id, service_id, voucher_id, order_date, weight, total_price, status) VALUES
(1, 1, 1, '2026-06-09', 5.00, 35000.00, 'Menunggu'),
(2, 2, NULL, '2026-06-10', 7.50, 52500.00, 'Diproses');


-- 4. Payment DB
CREATE DATABASE IF NOT EXISTS payment_db;
USE payment_db;

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50)
);

INSERT INTO payments (order_id, amount, status, payment_method) VALUES
(101, 50000.00, 'completed', 'transfer'),
(102, 25000.00, 'pending', 'cash');


-- 5. Voucher DB
CREATE DATABASE IF NOT EXISTS voucher_db;
USE voucher_db;

CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount DECIMAL(10, 2) NOT NULL,
    valid_until DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO vouchers (code, discount, valid_until) VALUES
('DISKON10', 10000, '2026-12-31'),
('CUCIMURAH', 5000, '2026-07-31'),
('GRATISSETRIKA', 8000, '2026-08-15'),
('MERDEKA45', 45000, '2026-08-31');
