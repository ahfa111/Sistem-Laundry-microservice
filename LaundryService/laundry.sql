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
