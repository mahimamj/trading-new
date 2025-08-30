-- SQL Schema for Share Money Dashboard

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_balance DECIMAL(15,2) DEFAULT 0.00,
    total_earning DECIMAL(15,2) DEFAULT 0.00,
    rewards DECIMAL(15,2) DEFAULT 0.00,
    referral_code VARCHAR(20) UNIQUE,
    referred_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (referred_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Network Table
CREATE TABLE IF NOT EXISTS network (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    level1_income DECIMAL(15,2) DEFAULT 0.00,
    level2_income DECIMAL(15,2) DEFAULT 0.00,
    level1_business DECIMAL(15,2) DEFAULT 0.00,
    level2_business DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdraw', 'referral_bonus', 'reward') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS referral_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Sample User Data (Updated)
INSERT INTO users (name, email, phone, password_hash, account_balance, total_earning, rewards, referral_code) VALUES
('John Doe', 'john.doe@example.com', '1234567890', 'hashed_password_1', 1500.00, 500.00, 50.00, 'JOHN123'),
('Jane Smith', 'jane.smith@example.com', '0987654321', 'hashed_password_2', 2500.00, 1200.00, 150.00, 'JANE456');

-- Update referred_by after both users are inserted
UPDATE users SET referred_by = (SELECT user_id FROM (SELECT user_id FROM users WHERE email = 'john.doe@example.com') AS temp) WHERE email = 'jane.smith@example.com';

INSERT INTO network (user_id, level1_income, level2_income, level1_business, level2_business) VALUES
((SELECT user_id FROM users WHERE email = 'john.doe@example.com'), 300.00, 200.00, 3000.00, 2000.00),
((SELECT user_id FROM users WHERE email = 'jane.smith@example.com'), 800.00, 400.00, 8000.00, 4000.00);

INSERT INTO transactions (user_id, type, amount, status, description) VALUES
((SELECT user_id FROM users WHERE email = 'john.doe@example.com'), 'deposit', 1000.00, 'completed', 'Initial deposit'),
((SELECT user_id FROM users WHERE email = 'john.doe@example.com'), 'withdraw', 200.00, 'completed', 'ATM withdrawal'),
((SELECT user_id FROM users WHERE email = 'jane.smith@example.com'), 'deposit', 2000.00, 'completed', 'Salary deposit'),
((SELECT user_id FROM users WHERE email = 'john.doe@example.com'), 'referral_bonus', 50.00, 'completed', 'Referral bonus from Jane Smith');

INSERT INTO referral_codes (user_id, code) VALUES
((SELECT user_id FROM users WHERE email = 'john.doe@example.com'), 'JOHN123'),
((SELECT user_id FROM users WHERE email = 'jane.smith@example.com'), 'JANE456');
