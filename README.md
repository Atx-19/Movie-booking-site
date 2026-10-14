# 🎬 Movie Ticket Booking System (DBMS Project)

A complete, full-stack relational database management system (RDBMS) project built for a 2nd-year Computer Science practical examination and viva voce.

---

## 🌟 Project Highlights

- **The Database is the Star:** Fully normalized schema in **3NF / BCNF** with 14 tables, complete referential integrity (`ON DELETE CASCADE`), `CHECK` constraints, composite keys, and triggers.
- **⭐ Safe Seat Booking (Showpiece):** Guarantees two users can **never** book the same seat.
  - **Constraint Level:** `UNIQUE(show_id, seat_id)` in `booking_seats`.
  - **Transaction Level:** `sp_book_tickets` stored procedure with explicit ACID transaction boundaries and pessimistic row locking (`SELECT ... FOR UPDATE`).
  - **Application Level:** Graceful `409 Conflict` error mapping and UI rollback notifications.
- **Zero ORM (Raw Parameterized SQL):** Every query is written by hand using `mysql2/promise` with parameter bindings (`?`) to prevent SQL injection.
- **Comprehensive Analytics:** Relational division, scalar subqueries, `GROUP BY + HAVING`, and views (`v_show_availability`, `v_movie_revenue`).

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Database** | MySQL 8.x (InnoDB Engine) | Raw SQL, Views, Triggers, Stored Procedures, Indexes |
| **Backend** | Node.js + Express | RESTful API, `mysql2/promise` connection pool, zero ORM |
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript | Fetch API, interactive seat-selection grid, dark cinema theme |

---

## 📁 Project Architecture

```
movie-ticket-booking/
├── db/
│   ├── schema.sql         # 14 tables, constraints, triggers
│   ├── seed.sql           # Realistic Indian & Hollywood seed data
│   └── queries.sql        # Advanced JOINs, views, procedure, explain
├── server/
│   ├── index.js           # Express app entry point
│   ├── .env               # Database connection configuration
│   ├── config/
│   │   └── db.js          # mysql2 connection pool
│   ├── middleware/
│   │   └── errorHandler.js# Semantic MySQL error mapping
│   ├── routes/
│   │   ├── movies.js      # Movie search, genres, review aggregation
│   │   ├── theatres.js    # Theatres and screen capacities
│   │   ├── shows.js       # Show scheduling (overlap trigger check) & seat maps
│   │   ├── bookings.js    # Calls sp_book_tickets, handles 409, cancellations
│   │   ├── reports.js     # Serves database views and analytical queries
│   │   ├── reviews.js     # User ratings and reviews
│   │   └── users.js       # Customer and admin demo profiles
│   └── package.json
├── client/
│   ├── index.html         # Movie catalog with search & genre filter
│   ├── shows.html         # Show schedules by cinema venue & pricing
│   ├── seats.html         # Interactive color-coded seat selection grid
│   ├── confirm.html       # Checkout summary, payment, 409 conflict alert
│   ├── my-bookings.html   # Reservation history and ticket cancellation
│   ├── reports.html       # Live database reports & view inspection
│   ├── admin.html         # Admin dashboard for movies & show scheduling
│   ├── css/
│   │   └── style.css      # Responsive cinema dark theme
│   └── js/
│       ├── api.js         # Fetch client wrapper
│       ├── navbar.js      # Global navigation and profile switcher
│       └── *.js           # Page-specific frontend controllers
├── tests/
│   ├── test-concurrency.js# Automated double-booking race condition script
│   └── api-tests.http     # REST Client test collection
├── docs/
│   ├── viva.md            # 26 exhaustive viva voce Q&As
│   └── demo-and-viva-cheatsheet.md # Step-by-step presentation script
└── README.md
```

---

## 🚀 Setup & Execution Guide (PowerShell / Windows)

### Prerequisites
- [MySQL Server](https://dev.mysql.com/downloads/installer/) installed and running (MySQL 5.5+ works fine).
- [Node.js 18+](https://nodejs.org/) installed.

> **Important:** On this machine, `mysql.exe` is NOT in the system PATH.
> The full path is: `C:\Program Files\MySQL\MySQL Server 5.5\bin\mysql.exe`
> All commands below use this full path so they work directly in PowerShell.

---

### Step 1: Initialize the MySQL Database

Open **PowerShell** and run these 3 commands one by one:

```powershell
# 1. Create database, 14 tables & 4 triggers
Get-Content "C:\Users\Atx\OneDrive\Documents\RDBMS Project\movie-ticket-booking\db\schema.sql" | & "C:\Program Files\MySQL\MySQL Server 5.5\bin\mysql.exe" -u root -proot
```

```powershell
# 2. Insert seed data (12 movies, 3 theatres, 7 screens, 130 seats, 16 shows, 22 bookings)
Get-Content "C:\Users\Atx\OneDrive\Documents\RDBMS Project\movie-ticket-booking\db\seed.sql" | & "C:\Program Files\MySQL\MySQL Server 5.5\bin\mysql.exe" -u root -proot movie_booking
```

```powershell
# 3. Create stored procedure sp_book_tickets, views & composite index
Get-Content "C:\Users\Atx\OneDrive\Documents\RDBMS Project\movie-ticket-booking\db\queries.sql" | & "C:\Program Files\MySQL\MySQL Server 5.5\bin\mysql.exe" -u root -proot movie_booking
```

> **Alternate Method:** Run `.\init-db.ps1` from the project root folder — it does all 3 steps in one click.

To verify everything worked:
```powershell
& "C:\Program Files\MySQL\MySQL Server 5.5\bin\mysql.exe" -u root -proot -e "USE movie_booking; SHOW TABLES;"
```

---

### Step 2: Install Dependencies & Start the Backend Server

```powershell
cd "C:\Users\Atx\OneDrive\Documents\RDBMS Project\movie-ticket-booking\server"
```

```powershell
npm install
```

Start the server:
```powershell
npm start
```

You should see:
```text
====================================================
🚀 Server running on: http://localhost:5000
📡 API Health Check: http://localhost:5000/api/health
====================================================
✅ Connected to MySQL database: movie_booking
```

---

### Step 3: Open the Application in Your Browser

```
http://localhost:5000
```

---

## 🧪 Double-Booking Concurrency Test

1. Keep the Express backend running on port 5000.
2. Open a **second PowerShell window** and run:
   ```powershell
   node "C:\Users\Atx\OneDrive\Documents\RDBMS Project\movie-ticket-booking\tests\test-concurrency.js"
   ```
3. **Result:**
   - **User A (Aarav):** `HTTP 201 Created` (Booking successful).
   - **User B (Sneha):** `HTTP 409 Conflict` (Seat already booked).
   - Zero data corruption — the database transaction rolled back cleanly.


---

