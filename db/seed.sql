-- ================================================================
-- Movie Ticket Booking System — Seed Data
-- Run: mysql -u root -p movie_booking < seed.sql
-- ================================================================

USE movie_booking;

-- ================================================================
-- USERS (12 users)
-- ================================================================
INSERT INTO users (name, email, password_hash, phone, role) VALUES
('Admin Atishay',       'admin@moviebook.com',      '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9000000001', 'admin'),
('Admin Neeti',     'priya.admin@moviebook.com','$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9000000002', 'admin'),
('Aarav Sharma',    'aarav@gmail.com',          '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543210', 'customer'),
('Sneha Patel',     'sneha@gmail.com',          '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543211', 'customer'),
('Vikram Reddy',    'vikram@gmail.com',         '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543212', 'customer'),
('Ananya Iyer',     'ananya@gmail.com',         '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543213', 'customer'),
('Rohan Gupta',     'rohan@gmail.com',          '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543214', 'customer'),
('Meera Joshi',     'meera@gmail.com',          '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543215', 'customer'),
('Karthik Nair',    'karthik@gmail.com',        '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543216', 'customer'),
('Divya Menon',     'divya@gmail.com',          '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543217', 'customer'),
('Arjun Das',       'arjun@gmail.com',          '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543218', 'customer'),
('Pooja Kulkarni',  'pooja@gmail.com',          '$2b$10$xJHPqz0WbQ0k5k5k5k5kuOj5k5k5k5k5k5k5k5k5k5k5k5k5k5', '9876543219', 'customer');

-- ================================================================
-- THEATRES (3 theatres)
-- ================================================================
INSERT INTO theatres (name, city, address) VALUES
('PVR Phoenix',       'Mumbai',    'Lower Parel, Phoenix Mills, Mumbai 400013'),
('INOX GVK One',      'Hyderabad', 'Banjara Hills, Road No. 1, Hyderabad 500034'),
('Cinepolis Nexus',   'Bangalore', 'Koramangala, Hosur Road, Bangalore 560095');

-- ================================================================
-- SCREENS (7 screens)
-- ================================================================
INSERT INTO screens (theatre_id, screen_name, total_seats) VALUES
(1, 'Screen 1', 20),
(1, 'Screen 2', 15),
(1, 'IMAX',     25),
(2, 'Screen 1', 20),
(2, 'Screen 2', 15),
(3, 'Screen 1', 20),
(3, 'Gold',     15);

-- ================================================================
-- SEATS (130 seats across screens)
-- ================================================================
-- Screen 1 (20 seats)
INSERT INTO seats (screen_id, row_label, seat_number, category) VALUES
(1,'A',1,'regular'),(1,'A',2,'regular'),(1,'A',3,'regular'),(1,'A',4,'regular'),(1,'A',5,'regular'),
(1,'B',1,'regular'),(1,'B',2,'regular'),(1,'B',3,'regular'),(1,'B',4,'regular'),(1,'B',5,'regular'),
(1,'C',1,'premium'),(1,'C',2,'premium'),(1,'C',3,'premium'),(1,'C',4,'premium'),(1,'C',5,'premium'),
(1,'D',1,'vip'),    (1,'D',2,'vip'),    (1,'D',3,'vip'),    (1,'D',4,'vip'),    (1,'D',5,'vip');

-- Screen 2 (15 seats)
INSERT INTO seats (screen_id, row_label, seat_number, category) VALUES
(2,'A',1,'regular'),(2,'A',2,'regular'),(2,'A',3,'regular'),(2,'A',4,'regular'),(2,'A',5,'regular'),
(2,'B',1,'premium'),(2,'B',2,'premium'),(2,'B',3,'premium'),(2,'B',4,'premium'),(2,'B',5,'premium'),
(2,'C',1,'vip'),    (2,'C',2,'vip'),    (2,'C',3,'vip'),    (2,'C',4,'vip'),    (2,'C',5,'vip');

-- Screen 3 (IMAX - 25 seats)
INSERT INTO seats (screen_id, row_label, seat_number, category) VALUES
(3,'A',1,'regular'),(3,'A',2,'regular'),(3,'A',3,'regular'),(3,'A',4,'regular'),(3,'A',5,'regular'),
(3,'B',1,'regular'),(3,'B',2,'regular'),(3,'B',3,'regular'),(3,'B',4,'regular'),(3,'B',5,'regular'),
(3,'C',1,'premium'),(3,'C',2,'premium'),(3,'C',3,'premium'),(3,'C',4,'premium'),(3,'C',5,'premium'),
(3,'D',1,'premium'),(3,'D',2,'premium'),(3,'D',3,'premium'),(3,'D',4,'premium'),(3,'D',5,'premium'),
(3,'E',1,'vip'),    (3,'E',2,'vip'),    (3,'E',3,'vip'),    (3,'E',4,'vip'),    (3,'E',5,'vip');

-- Screen 4 (20 seats)
INSERT INTO seats (screen_id, row_label, seat_number, category) VALUES
(4,'A',1,'regular'),(4,'A',2,'regular'),(4,'A',3,'regular'),(4,'A',4,'regular'),(4,'A',5,'regular'),
(4,'B',1,'regular'),(4,'B',2,'regular'),(4,'B',3,'regular'),(4,'B',4,'regular'),(4,'B',5,'regular'),
(4,'C',1,'premium'),(4,'C',2,'premium'),(4,'C',3,'premium'),(4,'C',4,'premium'),(4,'C',5,'premium'),
(4,'D',1,'vip'),    (4,'D',2,'vip'),    (4,'D',3,'vip'),    (4,'D',4,'vip'),    (4,'D',5,'vip');

-- Screen 5 (15 seats)
INSERT INTO seats (screen_id, row_label, seat_number, category) VALUES
(5,'A',1,'regular'),(5,'A',2,'regular'),(5,'A',3,'regular'),(5,'A',4,'regular'),(5,'A',5,'regular'),
(5,'B',1,'premium'),(5,'B',2,'premium'),(5,'B',3,'premium'),(5,'B',4,'premium'),(5,'B',5,'premium'),
(5,'C',1,'vip'),    (5,'C',2,'vip'),    (5,'C',3,'vip'),    (5,'C',4,'vip'),    (5,'C',5,'vip');

-- Screen 6 (20 seats)
INSERT INTO seats (screen_id, row_label, seat_number, category) VALUES
(6,'A',1,'regular'),(6,'A',2,'regular'),(6,'A',3,'regular'),(6,'A',4,'regular'),(6,'A',5,'regular'),
(6,'B',1,'regular'),(6,'B',2,'regular'),(6,'B',3,'regular'),(6,'B',4,'regular'),(6,'B',5,'regular'),
(6,'C',1,'premium'),(6,'C',2,'premium'),(6,'C',3,'premium'),(6,'C',4,'premium'),(6,'C',5,'premium'),
(6,'D',1,'vip'),    (6,'D',2,'vip'),    (6,'D',3,'vip'),    (6,'D',4,'vip'),    (6,'D',5,'vip');

-- Screen 7 (15 seats)
INSERT INTO seats (screen_id, row_label, seat_number, category) VALUES
(7,'A',1,'regular'),(7,'A',2,'regular'),(7,'A',3,'regular'),(7,'A',4,'regular'),(7,'A',5,'regular'),
(7,'B',1,'premium'),(7,'B',2,'premium'),(7,'B',3,'premium'),(7,'B',4,'premium'),(7,'B',5,'premium'),
(7,'C',1,'vip'),    (7,'C',2,'vip'),    (7,'C',3,'vip'),    (7,'C',4,'vip'),    (7,'C',5,'vip');

-- ================================================================
-- MOVIES (12 movies)
-- ================================================================
INSERT INTO movies (title, duration_min, language, release_date, description) VALUES
('Dune: Part Three',           165, 'English', '2026-10-10', 'Paul Atreides faces the final war for Arrakis.'),
('Pushpa 3: The Rampage',      170, 'Telugu',  '2026-09-15', 'Pushpa Raj returns for one last smuggling showdown.'),
('Inception Reloaded',         148, 'English', '2026-08-20', 'Dom Cobb dives deeper into dream layers than ever before.'),
('Stree 3',                    135, 'Hindi',   '2026-10-05', 'The ghost of Chanderi is back with a new mystery.'),
('The Dark Knight Returns',    155, 'English', '2026-07-18', 'Batman comes out of retirement in a gritty Gotham.'),
('Pathaan 2',                  150, 'Hindi',   '2026-11-01', 'Indias top spy takes on a global terror network.'),
('Interstellar 2',             175, 'English', '2026-06-25', 'A new crew ventures beyond the wormhole.'),
('RRR 2',                      185, 'Telugu',  '2026-12-20', 'Bheem and Raju reunite for another revolution.'),
('The Hangover Part IV',       110, 'English', '2026-05-10', 'The wolfpack wakes up in Mumbai with no memory.'),
('Animal 2',                   160, 'Hindi',   '2026-10-25', 'Ranvijay returns darker and more dangerous.'),
('Avengers: Secret Wars',      170, 'English', '2026-11-15', 'The multiverse collides in Marvels biggest crossover.'),
('Laapataa Gentlemen',         125, 'Hindi',   '2026-04-01', 'Two mismatched brides swap lives on a train journey.');

-- ================================================================
-- GENRES (8 genres)
-- ================================================================
INSERT INTO genres (genre_name) VALUES
('Action'), ('Comedy'), ('Drama'), ('Sci-Fi'),
('Thriller'), ('Horror'), ('Romance'), ('Adventure');

-- ================================================================
-- MOVIE_GENRES (M:N)
-- ================================================================
INSERT INTO movie_genres (movie_id, genre_id) VALUES
(1, 4), (1, 1), (1, 8),
(2, 1), (2, 5),
(3, 4), (3, 5),
(4, 6), (4, 2),
(5, 1), (5, 3),
(6, 1), (6, 5),
(7, 4), (7, 3),
(8, 1), (8, 3),
(9, 2),
(10, 3), (10, 5),
(11, 1), (11, 4), (11, 8),
(12, 2), (12, 3);

-- ================================================================
-- SHOWS (16 shows)
-- Trigger trg_shows_before_insert will automatically compute end_time.
-- ================================================================
INSERT INTO shows (movie_id, screen_id, show_time, end_time) VALUES
(1,  1, '2026-10-15 10:00:00', '2026-10-15 12:45:00'),
(5,  1, '2026-10-15 14:00:00', '2026-10-15 16:35:00'),
(1,  1, '2026-10-16 11:00:00', '2026-10-16 13:45:00'),
(4,  2, '2026-10-15 12:00:00', '2026-10-15 14:15:00'),
(9,  2, '2026-10-15 15:00:00', '2026-10-15 16:50:00'),
(7,  3, '2026-10-15 10:00:00', '2026-10-15 12:55:00'),
(11, 3, '2026-10-15 14:00:00', '2026-10-15 16:50:00'),
(2,  4, '2026-10-15 11:00:00', '2026-10-15 13:50:00'),
(6,  4, '2026-10-15 15:00:00', '2026-10-15 17:30:00'),
(8,  4, '2026-10-16 10:00:00', '2026-10-16 13:05:00'),
(10, 5, '2026-10-15 13:00:00', '2026-10-15 15:40:00'),
(12, 5, '2026-10-15 16:30:00', '2026-10-15 18:35:00'),
(3,  6, '2026-10-15 10:00:00', '2026-10-15 12:28:00'),
(5,  6, '2026-10-15 13:00:00', '2026-10-15 15:35:00'),
(7,  7, '2026-10-15 11:00:00', '2026-10-15 13:55:00'),
(4,  7, '2026-10-16 14:00:00', '2026-10-16 16:15:00');

-- ================================================================
-- SHOW_PRICING (3 tiers per show)
-- ================================================================
INSERT INTO show_pricing (show_id, category, price) VALUES
(1, 'regular', 200.00), (1, 'premium', 350.00), (1, 'vip', 500.00),
(2, 'regular', 200.00), (2, 'premium', 350.00), (2, 'vip', 500.00),
(3, 'regular', 200.00), (3, 'premium', 350.00), (3, 'vip', 500.00),
(4, 'regular', 180.00), (4, 'premium', 300.00), (4, 'vip', 450.00),
(5, 'regular', 180.00), (5, 'premium', 300.00), (5, 'vip', 450.00),
(6, 'regular', 300.00), (6, 'premium', 500.00), (6, 'vip', 800.00),
(7, 'regular', 300.00), (7, 'premium', 500.00), (7, 'vip', 800.00),
(8, 'regular', 250.00), (8, 'premium', 400.00), (8, 'vip', 550.00),
(9, 'regular', 250.00), (9, 'premium', 400.00), (9, 'vip', 550.00),
(10, 'regular', 250.00), (10, 'premium', 400.00), (10, 'vip', 550.00),
(11, 'regular', 220.00), (11, 'premium', 350.00), (11, 'vip', 500.00),
(12, 'regular', 200.00), (12, 'premium', 320.00), (12, 'vip', 480.00),
(13, 'regular', 200.00), (13, 'premium', 320.00), (13, 'vip', 480.00),
(14, 'regular', 200.00), (14, 'premium', 320.00), (14, 'vip', 480.00),
(15, 'regular', 350.00), (15, 'premium', 500.00), (15, 'vip', 700.00),
(16, 'regular', 250.00), (16, 'premium', 400.00), (16, 'vip', 550.00);

-- ================================================================
-- BOOKINGS (22 bookings)
-- ================================================================
INSERT INTO bookings (user_id, show_id, total_amount, status) VALUES
(3,  1,   400.00, 'confirmed'),
(4,  1,   600.00, 'confirmed'),
(5,  2,   700.00, 'confirmed'),
(3,  3,   500.00, 'pending'),
(6,  4,   540.00, 'confirmed'),
(7,  5,   600.00, 'confirmed'),
(8,  6,  1600.00, 'confirmed'),
(4,  7,   600.00, 'confirmed'),
(9,  8,  1200.00, 'confirmed'),
(10, 9,  1100.00, 'confirmed'),
(3, 10,  1000.00, 'confirmed'),
(5, 11,   220.00, 'cancelled'),
(6, 12,   960.00, 'confirmed'),
(11,13,   640.00, 'confirmed'),
(7, 14,  1440.00, 'confirmed'),
(12,15,   350.00, 'pending'),
(8,  1,   400.00, 'confirmed'),
(9,  2,  1500.00, 'confirmed'),
(10, 6,  1500.00, 'confirmed'),
(11, 8,   500.00, 'confirmed'),
(4, 16,   800.00, 'confirmed'),
(3,  7,   400.00, 'cancelled');

-- ================================================================
-- BOOKING_SEATS
-- Note: Bookings 12 and 22 are cancelled, so their seats were freed
-- ================================================================
INSERT INTO booking_seats (booking_id, seat_id, show_id, price) VALUES
(1,  1,  1, 200.00), (1,  2,  1, 200.00),
(2,  3,  1, 200.00), (2,  4,  1, 200.00), (2,  5,  1, 200.00),
(3, 11,  2, 350.00), (3, 12,  2, 350.00),
(4, 16,  3, 500.00),
(5, 21,  4, 180.00), (5, 22,  4, 180.00), (5, 23,  4, 180.00),
(6, 26,  5, 300.00), (6, 27,  5, 300.00),
(7, 56,  6, 800.00), (7, 57,  6, 800.00),
(8, 36,  7, 300.00), (8, 37,  7, 300.00),
(9, 71,  8, 400.00), (9, 72,  8, 400.00), (9, 73,  8, 400.00),
(10, 76, 9, 550.00), (10, 77, 9, 550.00),
(11, 61, 10, 250.00), (11, 62, 10, 250.00), (11, 63, 10, 250.00), (11, 64, 10, 250.00),
(13, 86, 12, 320.00), (13, 87, 12, 320.00), (13, 88, 12, 320.00),
(14, 106, 13, 320.00), (14, 107, 13, 320.00),
(15, 111, 14, 480.00), (15, 112, 14, 480.00), (15, 113, 14, 480.00),
(16, 116, 15, 350.00),
(17,  6,  1, 200.00), (17,  7,  1, 200.00),
(18, 16,  2, 500.00), (18, 17,  2, 500.00), (18, 18,  2, 500.00),
(19, 46,  6, 500.00), (19, 47,  6, 500.00), (19, 48,  6, 500.00),
(20, 61,  8, 250.00), (20, 62,  8, 250.00),
(21, 121, 16, 400.00), (21, 122, 16, 400.00),
(8,  41,  7, 300.00);

-- ================================================================
-- PAYMENTS (22 payments)
-- ================================================================
INSERT INTO payments (booking_id, amount, payment_method, status) VALUES
(1,   400.00, 'upi',         'completed'),
(2,   600.00, 'credit_card', 'completed'),
(3,   700.00, 'debit_card',  'completed'),
(4,   500.00, 'upi',         'pending'),
(5,   540.00, 'upi',         'completed'),
(6,   600.00, 'net_banking', 'completed'),
(7,  1600.00, 'credit_card', 'completed'),
(8,   600.00, 'upi',         'completed'),
(9,  1200.00, 'debit_card',  'completed'),
(10, 1100.00, 'credit_card', 'completed'),
(11, 1000.00, 'upi',         'completed'),
(12,  220.00, 'upi',         'refunded'),
(13,  960.00, 'net_banking', 'completed'),
(14,  640.00, 'upi',         'completed'),
(15, 1440.00, 'credit_card', 'completed'),
(16,  350.00, 'debit_card',  'pending'),
(17,  400.00, 'upi',         'completed'),
(18, 1500.00, 'credit_card', 'completed'),
(19, 1500.00, 'net_banking', 'completed'),
(20,  500.00, 'upi',         'completed'),
(21,  800.00, 'debit_card',  'completed'),
(22,  400.00, 'upi',         'refunded');

-- ================================================================
-- REVIEWS (10 reviews)
-- ================================================================
INSERT INTO reviews (user_id, movie_id, rating, review_text) VALUES
(3,  1,  5, 'Absolutely stunning visuals. Best sci-fi this year!'),
(4,  1,  4, 'Great movie but a bit long. Loved the sandworm scenes.'),
(5,  5,  5, 'The Dark Knight is timeless. This sequel does it justice.'),
(6,  4,  3, 'Decent comedy-horror. Not as good as the original Stree.'),
(7,  9,  4, 'Hilarious! The Mumbai setting was a great twist.'),
(8,  7,  5, 'Mind-blowing. Even better than the first Interstellar.'),
(9,  2,  4, 'Pushpa delivers again. Allu Arjun is on fire!'),
(10, 6,  3, 'Good action but predictable plot.'),
(11, 3,  5, 'Nolan outdid himself. The dream sequences are insane.'),
(3, 11,  4, 'Solid MCU entry. The multiverse concept finally pays off.');

-- ================================================================
-- AUDIT_LOG (audit entries for cancelled bookings)
-- ================================================================
INSERT INTO audit_log (action, table_name, record_id, old_values, new_values, performed_by) VALUES
('BOOKING_CANCELLED', 'bookings', 12, '{"status":"confirmed","total_amount":220.00}', '{"status":"cancelled"}', 5),
('BOOKING_CANCELLED', 'bookings', 22, '{"status":"confirmed","total_amount":400.00}', '{"status":"cancelled"}', 3);
