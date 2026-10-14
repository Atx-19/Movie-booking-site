-- ================================================================
-- Movie Ticket Booking System — Advanced SQL Queries
-- File: /db/queries.sql
-- ================================================================

USE movie_booking;

-- ================================================================
-- SECTION 1: COMPLEX JOINS
-- ================================================================

-- Query 1.1: Comprehensive Show Catalog
-- Shows every upcoming show with Movie title, Language, Theatre,
-- Screen, Start/End times, and all available Price tiers.
-- Concept: Multi-table INNER JOIN + GROUP_CONCAT aggregation.
SELECT 
    s.show_id,
    m.title AS movie_title,
    m.language,
    m.duration_min,
    t.name AS theatre_name,
    t.city,
    sc.screen_name,
    s.show_time,
    s.end_time,
    GROUP_CONCAT(CONCAT(sp.category, ': ₹', sp.price) ORDER BY sp.price SEPARATOR ' | ') AS pricing_tiers
FROM shows s
JOIN movies m        ON s.movie_id = m.movie_id
JOIN screens sc      ON s.screen_id = sc.screen_id
JOIN theatres t      ON sc.theatre_id = t.theatre_id
JOIN show_pricing sp ON s.show_id = sp.show_id
GROUP BY 
    s.show_id, m.title, m.language, m.duration_min, 
    t.name, t.city, sc.screen_name, s.show_time, s.end_time
ORDER BY s.show_time ASC;


-- Query 1.2: User Booking History with Seat Breakdown
-- Retrieves complete booking ledger for a user including individual seats,
-- payment method, and transaction status.
-- Concept: 8-table JOIN linking transactions to venue layout.
SELECT 
    u.name AS customer_name,
    b.booking_id,
    b.status AS booking_status,
    m.title AS movie_title,
    t.name AS theatre_name,
    sc.screen_name,
    s.show_time,
    GROUP_CONCAT(CONCAT(st.row_label, st.seat_number, ' (', st.category, ')') ORDER BY st.row_label, st.seat_number SEPARATOR ', ') AS seats_booked,
    b.total_amount,
    p.payment_method,
    p.status AS payment_status,
    b.booking_time
FROM bookings b
JOIN users u          ON b.user_id = u.user_id
JOIN shows s          ON b.show_id = s.show_id
JOIN movies m         ON s.movie_id = m.movie_id
JOIN screens sc       ON s.screen_id = sc.screen_id
JOIN theatres t       ON sc.theatre_id = t.theatre_id
LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
LEFT JOIN seats st         ON bs.seat_id = st.seat_id
LEFT JOIN payments p       ON b.booking_id = p.booking_id
WHERE u.user_id = 3
GROUP BY 
    u.name, b.booking_id, b.status, m.title, t.name, 
    sc.screen_name, s.show_time, b.total_amount, p.payment_method, p.status, b.booking_time
ORDER BY b.booking_time DESC;


-- ================================================================
-- SECTION 2: GROUP BY + HAVING
-- ================================================================

-- Query 2.1: Revenue and Attendance per Movie
-- Computes total tickets sold, gross revenue, and confirmed bookings.
-- Concept: GROUP BY with aggregate functions and HAVING filter.
SELECT 
    m.movie_id,
    m.title,
    m.language,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    COUNT(bs.seat_id) AS total_tickets_sold,
    COALESCE(SUM(bs.price), 0.00) AS gross_revenue
FROM movies m
LEFT JOIN shows s         ON m.movie_id = s.movie_id
LEFT JOIN bookings b      ON s.show_id = b.show_id AND b.status = 'confirmed'
LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
GROUP BY m.movie_id, m.title, m.language
HAVING gross_revenue > 0
ORDER BY gross_revenue DESC;


-- Query 2.2: High-Volume Theatres (> 2 Bookings)
-- Identifies top-performing venues having more than a threshold of bookings.
-- Concept: HAVING clause filtering groups after aggregation.
SELECT 
    t.theatre_id,
    t.name AS theatre_name,
    t.city,
    COUNT(DISTINCT b.booking_id) AS confirmed_bookings_count,
    COALESCE(SUM(bs.price), 0.00) AS total_theatre_revenue
FROM theatres t
JOIN screens sc       ON t.theatre_id = sc.theatre_id
JOIN shows s          ON sc.screen_id = s.screen_id
JOIN bookings b       ON s.show_id = b.show_id AND b.status = 'confirmed'
JOIN booking_seats bs ON b.booking_id = bs.booking_id
GROUP BY t.theatre_id, t.name, t.city
HAVING confirmed_bookings_count >= 2
ORDER BY confirmed_bookings_count DESC;


-- ================================================================
-- SECTION 3: ADVANCED SUBQUERIES
-- ================================================================

-- Query 3.1: Movies with Rating Above System Average
-- Concept: Scalar Subquery inside WHERE / HAVING clause.
SELECT 
    m.movie_id,
    m.title,
    ROUND(AVG(r.rating), 2) AS movie_avg_rating
FROM movies m
JOIN reviews r ON m.movie_id = r.movie_id
GROUP BY m.movie_id, m.title
HAVING AVG(r.rating) > (
    SELECT AVG(rating) FROM reviews
)
ORDER BY movie_avg_rating DESC;


-- Query 3.2: Relational Division — Users Who Booked Tickets for Every Genre
-- Finds users who have watched at least one movie from every registered genre.
-- Concept: Correlated Subquery with Double NOT EXISTS.
SELECT 
    u.user_id,
    u.name,
    u.email
FROM users u
WHERE u.role = 'customer'
  AND NOT EXISTS (
      SELECT g.genre_id 
      FROM genres g
      WHERE NOT EXISTS (
          SELECT 1
          FROM bookings b
          JOIN shows s          ON b.show_id = s.show_id
          JOIN movie_genres mg  ON s.movie_id = mg.movie_id
          WHERE b.user_id = u.user_id
            AND mg.genre_id = g.genre_id
            AND b.status = 'confirmed'
      )
  );

-- Alternative formulation using GROUP BY & COUNT for the same question:
SELECT 
    u.user_id,
    u.name,
    COUNT(DISTINCT mg.genre_id) AS distinct_genres_watched
FROM users u
JOIN bookings b       ON u.user_id = b.user_id AND b.status = 'confirmed'
JOIN shows s          ON b.show_id = s.show_id
JOIN movie_genres mg  ON s.movie_id = mg.movie_id
GROUP BY u.user_id, u.name
HAVING distinct_genres_watched = (SELECT COUNT(*) FROM genres);


-- ================================================================
-- SECTION 4: DATABASE VIEWS
-- ================================================================

-- View 4.1: Live Seat Availability per Show
CREATE OR REPLACE VIEW v_show_availability AS
SELECT 
    s.show_id,
    m.title AS movie_title,
    t.name AS theatre_name,
    sc.screen_name,
    s.show_time,
    s.end_time,
    sc.total_seats,
    COUNT(bs.seat_id) AS booked_seats,
    (sc.total_seats - COUNT(bs.seat_id)) AS available_seats
FROM shows s
JOIN movies m         ON s.movie_id = m.movie_id
JOIN screens sc       ON s.screen_id = sc.screen_id
JOIN theatres t       ON sc.theatre_id = t.theatre_id
LEFT JOIN booking_seats bs ON s.show_id = bs.show_id
GROUP BY 
    s.show_id, m.title, t.name, sc.screen_name, 
    s.show_time, s.end_time, sc.total_seats;


-- View 4.2: Movie Revenue Leaderboard
CREATE OR REPLACE VIEW v_movie_revenue AS
SELECT 
    m.movie_id,
    m.title AS movie_title,
    m.language,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    COUNT(bs.seat_id) AS total_tickets_sold,
    COALESCE(SUM(bs.price), 0.00) AS total_revenue
FROM movies m
LEFT JOIN shows s          ON m.movie_id = s.movie_id
LEFT JOIN bookings b       ON s.show_id = b.show_id AND b.status = 'confirmed'
LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
GROUP BY m.movie_id, m.title, m.language;


-- ================================================================
-- SECTION 5: STORED PROCEDURE — sp_book_tickets (⭐ SHOWPIECE)
-- ================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_book_tickets //

CREATE PROCEDURE sp_book_tickets (
    IN  p_user_id        INT,
    IN  p_show_id        INT,
    IN  p_seat_ids       VARCHAR(255),    -- Comma-separated: e.g. '1,2,3'
    IN  p_payment_method VARCHAR(50),     -- 'upi', 'credit_card', etc.
    OUT p_booking_id     INT,
    OUT p_status         VARCHAR(50),     -- 'SUCCESS' or 'ERROR'
    OUT p_message        VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_show_time DATETIME;
    DECLARE v_screen_id INT;
    DECLARE v_total_amount DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_requested_count INT DEFAULT 0;
    DECLARE v_valid_screen_seats INT DEFAULT 0;
    
    -- Error Handler: Automatically rollback any failed transaction
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_booking_id = NULL;
        SET p_status = 'ERROR';
        SET p_message = 'Transaction aborted: SQL Exception occurred (possible seat conflict).';
    END;

    -- Step 1: Validate show existence and check if already started
    SELECT show_time, screen_id INTO v_show_time, v_screen_id
    FROM shows
    WHERE show_id = p_show_id;

    IF v_show_time IS NULL THEN
        SET p_status = 'ERROR';
        SET p_message = 'Invalid show_id: Show does not exist.';
        LEAVE proc_label;
    END IF;

    IF v_show_time <= NOW() THEN
        SET p_status = 'ERROR';
        SET p_message = 'Cannot book tickets: Show has already started.';
        LEAVE proc_label;
    END IF;

    -- Step 2: Begin ACID Transaction
    START TRANSACTION;

    -- Temporary table to hold individual seat IDs
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_requested_seats (seat_id INT PRIMARY KEY);
    DELETE FROM temp_requested_seats;

    -- Split comma-separated seat IDs into rows
    SET @sql = CONCAT('INSERT INTO temp_requested_seats (seat_id) VALUES (', 
                      REPLACE(p_seat_ids, ',', '),('), ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    SELECT COUNT(*) INTO v_requested_count FROM temp_requested_seats;

    -- Step 3: Validate that all requested seats belong to the correct screen
    SELECT COUNT(*) INTO v_valid_screen_seats
    FROM seats s
    JOIN temp_requested_seats t ON s.seat_id = t.seat_id
    WHERE s.screen_id = v_screen_id;

    IF v_valid_screen_seats <> v_requested_count THEN
        ROLLBACK;
        SET p_status = 'ERROR';
        SET p_message = 'One or more selected seats do not belong to this screen.';
        LEAVE proc_label;
    END IF;

    -- Step 4: PESSIMISTIC LOCKING & CONFLICT DETECTION
    SELECT COUNT(*) INTO v_conflict_count
    FROM booking_seats bs
    JOIN temp_requested_seats t ON bs.seat_id = t.seat_id
    WHERE bs.show_id = p_show_id
    FOR UPDATE;

    IF v_conflict_count > 0 THEN
        ROLLBACK;
        SET p_status = 'ERROR';
        SET p_message = 'Conflict: One or more selected seats are already booked.';
        LEAVE proc_label;
    END IF;

    -- Step 5: Compute Total Price based on category pricing
    SELECT SUM(sp.price) INTO v_total_amount
    FROM temp_requested_seats t
    JOIN seats s          ON t.seat_id = s.seat_id
    JOIN show_pricing sp  ON s.category = sp.category AND sp.show_id = p_show_id;

    -- Step 6: Create Booking record
    INSERT INTO bookings (user_id, show_id, total_amount, status)
    VALUES (p_user_id, p_show_id, v_total_amount, 'confirmed');
    
    SET p_booking_id = LAST_INSERT_ID();

    -- Step 7: Reserve each seat in booking_seats
    INSERT INTO booking_seats (booking_id, seat_id, show_id, price)
    SELECT 
        p_booking_id, 
        s.seat_id, 
        p_show_id, 
        sp.price
    FROM temp_requested_seats t
    JOIN seats s          ON t.seat_id = s.seat_id
    JOIN show_pricing sp  ON s.category = sp.category AND sp.show_id = p_show_id;

    -- Step 8: Create Payment record
    INSERT INTO payments (booking_id, amount, payment_method, status)
    VALUES (p_booking_id, v_total_amount, p_payment_method, 'completed');

    -- Step 9: Commit Transaction
    COMMIT;

    SET p_status = 'SUCCESS';
    SET p_message = CONCAT('Booking successful! Total amount: ₹', v_total_amount);
    
    DROP TEMPORARY TABLE IF EXISTS temp_requested_seats;

END //

DELIMITER ;


-- ================================================================
-- SECTION 6: INDEXING & EXPLAIN DEMO
-- ================================================================

CREATE INDEX idx_shows_movie_time ON shows (movie_id, show_time);

EXPLAIN SELECT * FROM shows 
WHERE movie_id = 1 AND show_time >= '2026-10-15 00:00:00';
