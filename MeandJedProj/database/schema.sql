
-- Create database
CREATE DATABASE IF NOT EXISTS Smarthome
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Select database
USE Smarthome;


-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    mobile_number VARCHAR(30),

    password_hash VARCHAR(255) NOT NULL,

    role ENUM(
        'homeowner',
        'provider',
        'admin'
    ) NOT NULL DEFAULT 'homeowner',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================
-- PROVIDER PROFILES TABLE
-- ============================================

CREATE TABLE provider_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT NOT NULL UNIQUE,

    business_name VARCHAR(150),

    bio TEXT,

    location VARCHAR(255),

    hourly_rate DECIMAL(10, 2),

    experience_years INT DEFAULT 0,

    is_verified BOOLEAN DEFAULT FALSE,

    availability_status VARCHAR(50)
        DEFAULT 'Available',

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================
-- SERVICE CATEGORIES TABLE
-- ============================================

CREATE TABLE service_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT
);


-- ============================================
-- DEFAULT SERVICE CATEGORIES
-- ============================================

INSERT IGNORE INTO service_categories (name)
VALUES
    ('Electrical'),
    ('Plumbing'),
    ('Carpentry'),
    ('Cleaning'),
    ('Painting'),
    ('Appliance Repair'),
    ('Gardening');


-- ============================================
-- PROVIDER SERVICES TABLE
-- ============================================

CREATE TABLE provider_services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    provider_id BIGINT NOT NULL,

    category_id BIGINT NOT NULL,

    title VARCHAR(150),

    rate DECIMAL(10, 2),

    FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE,

    FOREIGN KEY (category_id)
        REFERENCES service_categories(id),

    UNIQUE (provider_id, category_id)
);


-- ============================================
-- BOOKINGS TABLE
-- ============================================

CREATE TABLE bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    booking_code VARCHAR(30)
        NOT NULL UNIQUE,

    homeowner_id BIGINT NOT NULL,

    provider_id BIGINT NULL,

    category_id BIGINT NULL,

    preferred_date DATE NOT NULL,

    preferred_time TIME NOT NULL,

    address TEXT NOT NULL,

    description TEXT NOT NULL,

    status ENUM(
        'Pending',
        'Matched',
        'Accepted',
        'On the Way',
        'In Progress',
        'Completed',
        'Cancelled',
        'Rejected'
    ) NOT NULL DEFAULT 'Pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (homeowner_id)
        REFERENCES users(id),

    FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id),

    FOREIGN KEY (category_id)
        REFERENCES service_categories(id)
);


-- ============================================
-- BOOKING STATUS HISTORY TABLE
-- ============================================

CREATE TABLE booking_status_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    booking_id BIGINT NOT NULL,

    status VARCHAR(50) NOT NULL,

    note TEXT,

    changed_by BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    sender_id BIGINT NOT NULL,

    recipient_id BIGINT NOT NULL,

    booking_id BIGINT NULL,

    body TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sender_id)
        REFERENCES users(id),

    FOREIGN KEY (recipient_id)
        REFERENCES users(id),

    FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE SET NULL
);


-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT NOT NULL,

    title VARCHAR(150) NOT NULL,

    body TEXT NOT NULL,

    type VARCHAR(50),

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================
-- REVIEWS TABLE
-- ============================================

CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    booking_id BIGINT NOT NULL UNIQUE,

    reviewer_id BIGINT NOT NULL,

    provider_id BIGINT NOT NULL,

    rating TINYINT NOT NULL,

    comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
        REFERENCES bookings(id),

    FOREIGN KEY (reviewer_id)
        REFERENCES users(id),

    FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
);