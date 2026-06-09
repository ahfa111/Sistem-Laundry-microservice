-- Database: customer_db

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
