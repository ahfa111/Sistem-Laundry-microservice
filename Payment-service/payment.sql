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

INSERT INTO payment_methods (name, description) VALUES
('Transfer Bank', 'Pembayaran via transfer antar bank'),
('Cash', 'Pembayaran tunai di tempat');
