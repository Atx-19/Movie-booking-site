# 🎓 Movie Ticket Booking System — Viva & Demonstration Master Cheat Sheet

---

## 1. 📁 Complete File Directory & Locations

All your files are located at:
`C:\Users\Atx\OneDrive\Documents\RDBMS Project\movie-ticket-booking\`

### Detailed Path Reference:

| Component | File Path | Purpose |
|---|---|---|
| **Root Guide** | `README.md` | Complete project setup and architecture guide |
| **Schema SQL** | `db/schema.sql` | 14 tables in 3NF, PK/FK/CHECK constraints, 4 triggers |
| **Seed Data** | `db/seed.sql` | 12 movies, 3 theatres, 7 screens, 130 seats, 16 shows, 22 bookings |
| **Advanced SQL** | `db/queries.sql` | `sp_book_tickets` procedure, `v_show_availability`, `v_movie_revenue`, EXPLAIN |
| **Backend Entry** | `server/index.js` | Express server, mounts routes, serves static frontend |
| **DB Pool** | `server/config/db.js` | `mysql2/promise` connection pool, zero ORM |
| **Booking Route**| `server/routes/bookings.js`| ⭐ **Showpiece:** calls `sp_book_tickets`, handles `409 Conflict`, cancellation |
| **Shows Route**  | `server/routes/shows.js`   | Live seat availability map (`GET /api/shows/:id/seats`) |
| **Reports Route**| `server/routes/reports.js` | Serves analytical views and GROUP BY / HAVING queries |
| **Seat Map UI**  | `client/seats.html` & `client/js/seats.js` | Interactive curved cinema seat selection matrix |
| **Reports UI**   | `client/reports.html` & `client/js/reports.js` | Visual dashboard for views, revenue, audit trail |
| **Admin UI**     | `client/admin.html` & `client/js/admin.js` | Tests show scheduling & overlap trigger |
| **Concurrency Test** | `tests/test-concurrency.js` | ⭐ Automated script testing double-booking race condition |
| **Viva Question Bank** | `docs/viva.md` | 26 comprehensive viva questions & answers |

---

## 2. 🎯 The "Top 5 Files" to Open in VS Code During Evaluation

When your professor asks to see the code, **do NOT browse through 40+ files**. Keep these 5 tabs open:

1. **`db/schema.sql` (Line 150–170)**: 
   - Point directly to `booking_seats` table and highlight:
     `UNIQUE(show_id, seat_id);`
   - Point to `CHECK(rating BETWEEN 1 AND 5)` on `reviews`.
   - Point to the trigger `trg_shows_before_insert` (overlap prevention).
2. **`db/queries.sql` (Line 160–250)**:
   - Point to `sp_book_tickets`: show `START TRANSACTION`, `SELECT ... FOR UPDATE`, and `ROLLBACK`.
3. **`server/routes/bookings.js` (Line 10–55)**:
   - Show how Node.js executes `CALL sp_book_tickets` with parameterized `?` placeholders (no ORM).
   - Show how status `'ERROR'` translates into `HTTP 409 Conflict`.
4. **`client/seats.html` (Preview in browser)**:
   - Show the interactive seat matrix.
5. **`tests/test-concurrency.js`**:
   - The runnable proof that concurrency is safely managed.

---

## 3. 🎬 Step-by-Step Demonstration Walkthrough (What to Click & What to Say)

Follow this exact 4-minute script:

### Step 1: Show the Movie Catalog (30 seconds)
- **Action:** Open `http://localhost:5000` in the browser.
- **Say:** *"Professor, this is our Movie Ticket Booking System built with MySQL, Express, and vanilla JS with zero ORM. Here is our movie catalog. Every movie displays language, duration, genres from the `movie_genres` M:N junction table, and an average rating derived dynamically from the `reviews` table."*
- **Action:** Type `"Dune"` in the search bar or filter by `"Sci-Fi"`.

### Step 2: Show the Interactive Seat Map (45 seconds)
- **Action:** Click **"Book Tickets"** on *Dune: Part Three* $\rightarrow$ Click **"Select Seats"** for *Screen 1*.
- **Say:** *"Here is our live seat grid loaded from `GET /api/shows/1/seats`. You can see three seat tiers: Regular at ₹200, Premium at ₹350, and VIP at ₹500, loaded from the `show_pricing` table. The dark gray seats (A1 to A5) are already booked and disabled. The blue seats are available."*
- **Action:** Click seats **D4 and D5** (VIP). Watch the bottom floating bar update in real time (`Selected: D4, D5 • Total: ₹1000.00`).

### Step 3: Complete Booking & Show Instant Seat Locking (45 seconds)
- **Action:** Click **"Proceed to Payment"** $\rightarrow$ Select **UPI** $\rightarrow$ Click **"Pay & Confirm"**.
- **Say:** *"When I confirm, the Express backend calls our MySQL stored procedure `sp_book_tickets`. It starts an explicit ACID transaction, locks the candidate rows with `SELECT ... FOR UPDATE`, inserts the booking, generates the ticket snapshot in `booking_seats`, and creates the payment record atomically."*
- **Action:** Show the confirmation receipt (`Booking Confirmed!`).
- **Action:** Go back to the seat map — show that **D4 and D5 are now gray (booked)**!

### Step 4: Demonstrate Cancellation & Seat Release (30 seconds)
- **Action:** Click **"My Bookings"** in the navbar.
- **Say:** *"In My Bookings, the user can review their purchase. If they click 'Cancel Booking', the system deletes the rows from `booking_seats` — immediately freeing the seats for other customers — flips status to 'cancelled', and automatically triggers `trg_bookings_after_update`, logging the cancellation into our `audit_log`."*
- **Action:** Click **"Cancel Booking"**. Go to `reports.html` and show the new entry in the **Trigger Audit Trail** table!

### Step 5: ⭐ The Grand Finale — Double-Booking Demonstration (1 minute)
- **Say:** *"Now, I will demonstrate the most important requirement: Safe Concurrent Seat Booking. Two users must never be allowed to book the same seat."*
- **Action:** Open a terminal and run:
  ```bash
  node "C:\Users\Atx\OneDrive\Documents\RDBMS Project\movie-ticket-booking\tests\test-concurrency.js"
  ```
- **Say:** *"This script fires two asynchronous HTTP requests for the exact same seat at the exact same millisecond. As you can see on screen: User A gets `201 Created` and completes the booking, while User B gets `409 Conflict`. The database safely rolled back User B with zero data corruption!"*

---

## 4. 🧠 Quick-Memory Kit (What to Memorize for Viva)

### The Normalization Mantra:
> *"Every non-key attribute must depend on the key, the whole key, and nothing but the key, so help me Codd."*
- **1NF:** Atomic values only, no repeating groups (each seat has its own row).
- **2NF:** 1NF + no partial dependencies (every column depends on the full composite PK).
- **3NF:** 2NF + no transitive dependencies (no non-key attribute depends on another non-key attribute).
- **BCNF:** For every $X \rightarrow Y$, $X$ must be a superkey.

### ACID Properties in 10 Seconds:
- **A (Atomicity):** All or nothing. If seat reservation fails, payment is not recorded.
- **C (Consistency):** Database transitions between valid states respecting all constraints (`CHECK`, `UNIQUE`, `FK`).
- **I (Isolation):** Concurrent transactions do not see uncommitted intermediate states (`SELECT ... FOR UPDATE`).
- **D (Durability):** Once committed, written to InnoDB redo logs on disk; survives crashes.

### Why not just rely on `UNIQUE(show_id, seat_id)`? Why use `SELECT ... FOR UPDATE`?
> *"Defense in depth. The UNIQUE constraint is our hard physical guarantee against corruption. But `SELECT ... FOR UPDATE` provides proactive concurrency management: it detects collisions inside the transaction so we can execute a clean ROLLBACK and return a graceful `409 Conflict` to the user instead of letting the application crash."*

### Why Raw SQL instead of an ORM?
> *"ORMs hide database mechanics and frequently generate inefficient queries. Using raw SQL with `mysql2` ensures complete control over indexing, query execution plans (`EXPLAIN`), connection pooling, and multi-statement stored procedures."*

---

## 5. 🎨 Senior Mentor Advice: "Should I make it more aesthetic?"

**My honest advice: NO, keep the UI exactly as it is!** 

Here is why:
1. **Professor Psychology in DBMS Labs:** 
   Professors grading a Database course are often skeptical of students who bring overly flashy animations, 3D effects, or heavy frontend frameworks. Their first thought is: *"Did this student spend all their time on CSS or download a template instead of studying SQL?"*
2. **Current UI Hits the "Sweet Spot":**
   Your current frontend:
   - Has a clean, modern **Cinema Dark Theme** with gold/amber accents.
   - Has a curved screen graphic and responsive, color-coded seat tiles.
   - Shows live database views, aggregate tables, and status badges.
   - **Most importantly:** It is written in **clean, 100% vanilla HTML, CSS, and JS**. You can explain every single line of code in 5 seconds.
3. **Where to invest your final 30 minutes:**
   Instead of tweaking CSS borders, practice running the `tests/test-concurrency.js` script and reviewing the **Top 5 Viva Questions** in `docs/viva.md`. **A student who can fluently explain `EXPLAIN`, 3NF, and row locking will get full marks every time.**
