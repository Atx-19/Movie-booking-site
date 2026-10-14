-- ================================================================
-- Movie Ticket Booking System — Database Schema
-- Run: mysql -u root -p < schema.sql
-- ================================================================

CREATE DATABASE IF NOT EXISTS movie_booking;
USE movie_booking;

-- Drop tables in reverse dependency order (clean slate)
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS booking_seats;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS show_pricing;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS movie_genres;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS screens;
DROP TABLE IF EXISTS theatres;
DROP TABLE IF EXISTS users;

-- ================================================================
-- 1. USERS
-- ================================================================
CREATE TABLE users (
    user_id       INT           AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    phone         VARCHAR(15),
    role          ENUM('customer', 'admin') DEFAULT 'customer',
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (email)
);

-- ================================================================
-- 2. THEATRES
-- ================================================================
CREATE TABLE theatres (
    theatre_id INT           AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150)  NOT NULL,
    city       VARCHAR(100)  NOT NULL,
    address    TEXT,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 3. SCREENS
-- ================================================================
CREATE TABLE screens (
    screen_id   INT          AUTO_INCREMENT PRIMARY KEY,
    theatre_id  INT          NOT NULL,
    screen_name VARCHAR(50)  NOT NULL,
    total_seats INT          NOT NULL,

    FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id) ON DELETE CASCADE,
    UNIQUE (theatre_id, screen_name)
);

-- ================================================================
-- 4. SEATS
-- ================================================================
CREATE TABLE seats (
    seat_id     INT      AUTO_INCREMENT PRIMARY KEY,
    screen_id   INT      NOT NULL,
    row_label   CHAR(2)  NOT NULL,
    seat_number INT      NOT NULL,
    category    ENUM('regular', 'premium', 'vip') DEFAULT 'regular',

    FOREIGN KEY (screen_id) REFERENCES screens(screen_id) ON DELETE CASCADE,
    UNIQUE (screen_id, row_label, seat_number)
);

-- ================================================================
-- 5. MOVIES
-- ================================================================
CREATE TABLE movies (
    movie_id     INT           AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200)  NOT NULL,
    duration_min INT           NOT NULL,
    language     VARCHAR(30)   DEFAULT 'English',
    release_date DATE,
    description  TEXT,
    poster_url   VARCHAR(500),
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CHECK (duration_min > 0)
);

-- ================================================================
-- 6. GENRES
-- ================================================================
CREATE TABLE genres (
    genre_id   INT          AUTO_INCREMENT PRIMARY KEY,
    genre_name VARCHAR(50)  NOT NULL,

    UNIQUE (genre_name)
);

-- ================================================================
-- 7. MOVIE_GENRES (M:N)
-- ================================================================
CREATE TABLE movie_genres (
    movie_id INT NOT NULL,
    genre_id INT NOT NULL,

    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE CASCADE
);

-- ================================================================
-- 8. SHOWS
-- ================================================================
CREATE TABLE shows (
    show_id    INT      AUTO_INCREMENT PRIMARY KEY,
    movie_id   INT      NOT NULL,
    screen_id  INT      NOT NULL,
    show_time  DATETIME NOT NULL,
    end_time   DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)  REFERENCES movies(movie_id)   ON DELETE CASCADE,
    FOREIGN KEY (screen_id) REFERENCES screens(screen_id) ON DELETE CASCADE
);

-- ================================================================
-- 9. SHOW_PRICING
-- ================================================================
CREATE TABLE show_pricing (
    show_pricing_id INT          AUTO_INCREMENT PRIMARY KEY,
    show_id         INT          NOT NULL,
    category        ENUM('regular', 'premium', 'vip') NOT NULL,
    price           DECIMAL(8,2) NOT NULL,

    FOREIGN KEY (show_id) REFERENCES shows(show_id) ON DELETE CASCADE,
    UNIQUE (show_id, category),
    CHECK (price >= 0)
);

-- ================================================================
-- 10. BOOKINGS
-- ================================================================
CREATE TABLE bookings (
    booking_id   INT            AUTO_INCREMENT PRIMARY KEY,
    user_id      INT            NOT NULL,
    show_id      INT            NOT NULL,
    total_amount DECIMAL(10,2)  NOT NULL,
    status       ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    booking_time TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (show_id) REFERENCES shows(show_id) ON DELETE CASCADE
);

-- ================================================================
-- 11. BOOKING_SEATS (M:N Junction — ⭐ THE SHOWPIECE)
-- ================================================================
CREATE TABLE booking_seats (
    booking_id INT          NOT NULL,
    seat_id    INT          NOT NULL,
    show_id    INT          NOT NULL,
    price      DECIMAL(8,2) NOT NULL,

    PRIMARY KEY (booking_id, seat_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id)    REFERENCES seats(seat_id),
    FOREIGN KEY (show_id)    REFERENCES shows(show_id),

    -- ⭐ Database-level guarantee against double-booking
    UNIQUE (show_id, seat_id)
);

-- ================================================================
-- 12. PAYMENTS (1:1 with bookings)
-- ================================================================
CREATE TABLE payments (
    payment_id     INT            AUTO_INCREMENT PRIMARY KEY,
    booking_id     INT            NOT NULL,
    amount         DECIMAL(10,2)  NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'upi', 'net_banking') NOT NULL,
    status         ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_time   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    UNIQUE (booking_id)
);

-- ================================================================
-- 13. REVIEWS
-- ================================================================
CREATE TABLE reviews (
    review_id   INT     AUTO_INCREMENT PRIMARY KEY,
    user_id     INT     NOT NULL,
    movie_id    INT     NOT NULL,
    rating      TINYINT NOT NULL,
    review_text TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    UNIQUE (user_id, movie_id),
    CHECK (rating BETWEEN 1 AND 5)
);

-- ================================================================
-- 14. AUDIT_LOG
-- ================================================================
CREATE TABLE audit_log (
    log_id       INT          AUTO_INCREMENT PRIMARY KEY,
    action       VARCHAR(100) NOT NULL,
    table_name   VARCHAR(100) NOT NULL,
    record_id    INT          NOT NULL,
    old_values   TEXT,
    new_values   TEXT,
    performed_by INT,
    action_time  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Trigger 1: Auto-calc end_time and prevent overlapping shows
DELIMITER //
CREATE TRIGGER trg_shows_before_insert
BEFORE INSERT ON shows
FOR EACH ROW
BEGIN
    DECLARE v_duration INT;
    DECLARE v_overlap_count INT;

    SELECT duration_min INTO v_duration
    FROM movies
    WHERE movie_id = NEW.movie_id;

    SET NEW.end_time = DATE_ADD(NEW.show_time, INTERVAL v_duration MINUTE);

    SELECT COUNT(*) INTO v_overlap_count
    FROM shows
    WHERE screen_id = NEW.screen_id
      AND show_time < NEW.end_time
      AND end_time   > NEW.show_time;

    IF v_overlap_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Show overlaps with an existing show on this screen';
    END IF;
END //
DELIMITER ;

-- Trigger 2: Block booking seats for a past show
DELIMITER //
CREATE TRIGGER trg_booking_seats_before_insert
BEFORE INSERT ON booking_seats
FOR EACH ROW
BEGIN
    DECLARE v_show_time DATETIME;

    SELECT show_time INTO v_show_time
    FROM shows
    WHERE show_id = NEW.show_id;

    IF v_show_time <= NOW() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot book seats for a show that has already started';
    END IF;
END //
DELIMITER ;

-- Trigger 3: Auto-confirm booking upon payment success
DELIMITER //
CREATE TRIGGER trg_payments_after_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE bookings
        SET status = 'confirmed'
        WHERE booking_id = NEW.booking_id;
    END IF;
END //
DELIMITER ;

-- Trigger 4: Audit log for cancelled bookings
DELIMITER //
CREATE TRIGGER trg_bookings_after_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        INSERT INTO audit_log (action, table_name, record_id, old_values, new_values, performed_by)
        VALUES (
            'BOOKING_CANCELLED',
            'bookings',
            NEW.booking_id,
            CONCAT('{"status":"', OLD.status, '","total_amount":', OLD.total_amount, '}'),
            '{"status":"cancelled"}',
            NEW.user_id
        );
    END IF;
END //
DELIMITER ;
