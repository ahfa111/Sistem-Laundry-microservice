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

CREATE TABLE IF NOT EXISTS customer_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

INSERT INTO customer_reviews (customer_id, rating, review_text) VALUES
(1, 5, 'Pelayanan sangat memuaskan!'),
(2, 4, 'Bagus, tapi bisa lebih cepat.');

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

CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO payment_methods (name, description, is_active) VALUES
('Cash', 'Pembayaran tunai di tempat', TRUE),
('Transfer Bank', 'Transfer bank BCA/Mandiri/BNI', TRUE),
('E-Wallet', 'Pembayaran via GoPay/OVO/Dana', TRUE);


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

CREATE TABLE IF NOT EXISTS voucher_usages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_id INT NOT NULL,
    order_id INT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
);

INSERT INTO voucher_usages (voucher_id, order_id) VALUES
(1, 101),
(2, 102);
