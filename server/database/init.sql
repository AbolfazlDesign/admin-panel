

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- ENUM TYPES
-- =====================
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE sub_status AS ENUM ('active', 'inactive', 'expired', 'cancelled');
CREATE TYPE plan_type AS ENUM ('free', 'basic', 'premium', 'enterprise');

-- =====================
-- USERS TABLE
-- =====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- PLANS TABLE
-- =====================
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name plan_type UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features JSONB DEFAULT '[]',
    max_users INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- SUBSCRIPTIONS TABLE
-- =====================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    status sub_status DEFAULT 'active',
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- ACTIVITY LOG
-- =====================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- REFRESH TOKENS
-- =====================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

-- =====================
-- UPDATE TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- SEED DATA
-- =====================
INSERT INTO plans (name, display_name, price, duration_days, features, max_users) VALUES
('free', 'رایگان', 0, 30, '["دسترسی پایه", "۱ کاربر"]', 1),
('basic', 'پایه', 99000, 30, '["دسترسی پایه", "۵ کاربر", "پشتیبانی ایمیل"]', 5),
('premium', 'حرفه‌ای', 249000, 30, '["دسترسی کامل", "۲۰ کاربر", "پشتیبانی ۲۴/۷", "API"]', 20),
('enterprise', 'سازمانی', 599000, 30, '["دسترسی نامحدود", "کاربر نامحدود", "پشتیبانی اختصاصی", "API", "SLA"]', -1);

-- Admin user (password: Admin@123)
INSERT INTO users (name, email, password, role) VALUES
('ادمین سیستم', 'admin@panel.com', '$2b$12$LJ3m4ys3LzgJqyXHPq5YXOzKSYnRLHYMOziFvjzjGEOJy4nLqF6Oi', 'admin');