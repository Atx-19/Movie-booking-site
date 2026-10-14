# 🎤 Viva Questions & Answers — Movie Ticket Booking System

> Cumulative guide for RDBMS practical examination and viva voce (26 Questions & Answers).

---

## Phase 2 — Design & Normalization

### Q1. What is referential integrity, and how does your schema enforce it?
**Answer:** Referential integrity ensures that foreign key relationships between tables remain consistent — a foreign key value must always refer to an existing primary key in the referenced parent table. For example, `bookings.user_id` must match a valid `users.user_id`.
We enforce this with `FOREIGN KEY ... REFERENCES` constraints. We also configure `ON DELETE CASCADE` appropriately: deleting a theatre automatically cleans up its screens and seats, preventing orphan records.

---

### Q2. Why use a composite primary key in `movie_genres` instead of a surrogate `id`?
**Answer:** A composite key `(movie_id, genre_id)` is a natural identifier for a junction table representing an M:N relationship. Adding an artificial surrogate ID:
1. Wastes storage on an unnecessary auto-increment column.
2. Still requires an extra `UNIQUE(movie_id, genre_id)` constraint to stop duplicate associations.
3. Slows down joins slightly because MySQL must maintain an extra index.
Using the compound key enforces uniqueness and indexes the pair naturally.

---

### Q3. Walk through how you normalized the schema to 3NF.
**Answer:**
- **UNF → 1NF:** The flat dataset had comma-separated lists of seats and prices (repeating groups). We split each booked seat into its own atomic row and defined a composite PK `(booking_id, seat_id)`.
- **1NF → 2NF:** Non-key attributes like `movie_title` and `user_name` depended only on parts of the booking identifier (partial dependency). We decomposed them into independent `Bookings`, `Users`, and `Movies` tables.
- **2NF → 3NF:** Inside `Bookings`, theatre details depended on the screen/theatre, not directly on the booking (transitive dependency). We extracted `Theatres`, `Screens`, and `Seats` into separate entities linked by foreign keys.
- **Result:** Every non-key column depends strictly on the key, the whole key, and nothing but the key.

---

## Phase 3 — Database Schema & Constraints

### Q4. How does `UNIQUE(show_id, seat_id)` on `booking_seats` guarantee safe seat booking?
**Answer:** This constraint instructs MySQL to guarantee that any given seat can appear at most once for a particular show. If User A books seat A1 for Show 5, a row `(show_id=5, seat_id=1)` is inserted. If User B attempts to book that seat for the same show, MySQL instantly rejects the query with a duplicate key error (`ER_DUP_ENTRY`). When a booking is cancelled, its rows in `booking_seats` are deleted, releasing the seat.

---

### Q5. What is the difference between `ON DELETE CASCADE` and `ON DELETE RESTRICT`?
**Answer:**
- **CASCADE:** When a row in the parent table is deleted, MySQL automatically deletes matching rows in all child tables.
- **RESTRICT (default):** Prevents deletion of the parent row if any child rows reference it.
We use CASCADE for cascading hierarchies (e.g. `theatres` → `screens` → `seats`), but avoid it on sensitive transactional ledgers to prevent accidental loss of booking records.

---

### Q6. Why store `price` in `booking_seats` when `show_pricing` already has the category price?
**Answer:** This is a **price snapshot**. Ticket prices fluctuate over time (e.g., weekend surcharges, dynamic pricing). Storing the paid price at the exact moment of booking ensures that modifying ticket prices in `show_pricing` later does not alter the historical receipts and revenue totals of past bookings.

---

## Phase 4 — Advanced SQL, Transactions & Indexing

### Q7. Explain ACID properties in the context of your `sp_book_tickets` procedure.
**Answer:**
- **Atomicity:** All booking operations (inserting into `bookings`, reserving rows in `booking_seats`, and generating `payments`) occur as a single unit of work. If any step fails, the entire transaction is rolled back.
- **Consistency:** The database transitions from one valid state to another, satisfying all check constraints (e.g. positive amounts) and referential constraints without corrupting capacity counts.
- **Isolation:** Managed via InnoDB row-level locking (`SELECT ... FOR UPDATE`), ensuring simultaneous booking attempts for the same seats cannot cause dirty reads or lost updates.
- **Durability:** Once committed, the booking records are written to the transaction redo log and persist permanently on disk even during power failures.

---

### Q8. Why is `SELECT ... FOR UPDATE` row locking necessary if `UNIQUE(show_id, seat_id)` already exists?
**Answer:** This is **Defense in Depth**:
- `UNIQUE(show_id, seat_id)` is the hard database-level safety net preventing duplicate entries.
- `SELECT ... FOR UPDATE` provides proactive concurrency management. Rather than letting conflicting requests generate partial booking entries that crash on a database constraint error, the row lock allows the transaction to detect the conflict early and execute a clean `ROLLBACK` with a user-friendly error response (`409 Conflict`).

---

### Q9. What is a Composite Index, and how does `EXPLAIN` verify its effectiveness?
**Answer:** A composite index indexes multiple columns together in a specific hierarchy: `(movie_id, show_time)`. Since users commonly filter shows by a movie on or after a particular date, MySQL traverses the B+ tree index on `movie_id` and then executes a range scan on `show_time`.
Using `EXPLAIN`, we can confirm:
- `type` switches from `ALL` (full table scan) to `range` or `ref`.
- `key` displays `idx_shows_movie_time`.
- `rows` inspected drops from the entire table to only the relevant show records.

---

## Phase 5 — Backend Architecture & Database Connectivity

### Q10. Why use raw SQL with `mysql2` instead of an Object-Relational Mapper (ORM) like Sequelize or Prisma?
**Answer:**
1. **Full Transparency:** Every SQL query is hand-crafted and directly visible in the code. We can inspect query plans with `EXPLAIN` and optimize indexes without ORM abstraction layers generating slow N+1 queries.
2. **Access to Advanced RDBMS Features:** Calling stored procedures (`CALL sp_book_tickets`), pessimistic row locks (`FOR UPDATE`), and multi-statement transactions are simpler and more predictable with raw SQL drivers than fighting ORM abstractions.
3. **Academic & Performance Rigor:** In a DBMS viva, understanding relational algebra, joins, and transaction boundaries is the primary objective. ORMs hide relational mechanics behind JavaScript methods.

---

### Q11. How do parameterized queries (`?` placeholders) prevent SQL Injection attacks?
**Answer:**
In a classic injection attack, string concatenation allows malicious input like `' OR '1'='1` to alter query grammar.
In a parameterized query (e.g. `SELECT * FROM users WHERE email = ?`):
1. **Compilation Step:** The SQL statement template is sent to the MySQL server and parsed into an execution plan **first**.
2. **Parameter Binding Step:** User data is sent separately. The database treats the parameter strictly as a literal data value (string/number), never as executable SQL code. Even if the parameter contains single quotes, semicolons, or SQL keywords, it cannot alter the syntax tree of the compiled query.

---

### Q12. Why use a Connection Pool (`mysql.createPool`) instead of opening a single connection or creating a new connection per request?
**Answer:**
Establishing a TCP handshake and authenticating a MySQL connection is resource-intensive and adds latency to every HTTP request.
A connection pool creates and maintains a cache of active database connections:
1. **Reusability:** When an HTTP request arrives, it borrows an idle connection from the pool and returns it immediately after query execution (`connection.release()`).
2. **Resource Management:** `connectionLimit: 10` prevents sudden spikes in web traffic from overwhelming the MySQL server with thousands of simultaneous open connections.
3. **Queueing:** Incoming queries wait in a queue (`queueLimit: 0`) rather than crashing when connections are busy.

---

## Phase 6 — Frontend Integration & Client-Side Concurrency

### Q13. How does the frontend handle concurrent seat conflicts and the HTTP 409 Conflict status?
**Answer:**
When a user selects seats and clicks "Pay & Confirm", the frontend dispatches a POST request to `/api/bookings`. If another user booked any of those seats in the milliseconds prior, the backend stored procedure transaction aborts with a conflict and the API responds with `HTTP 409 Conflict`.
The frontend fetch wrapper in `confirm.js`:
1. Detects `err.status === 409`.
2. Prevents any state corruption or fake success receipts.
3. Renders a clear user alert explaining that the seat was taken and that the database transaction safely rolled back.
4. Provides a one-click button redirecting the user back to the refreshed seat map to pick alternative available seats.

---

### Q14. What are the key HTTP status codes used in your REST API and what do they signify?
**Answer:**
- `200 OK`: Successful read operations (`GET /api/movies`, `GET /api/shows/:id/seats`).
- `201 Created`: Successful creation of new entities (`POST /api/bookings`, `POST /api/movies`).
- `400 Bad Request`: Missing mandatory parameters or invalid formats (e.g. rating outside 1–5 range, missing seat array).
- `404 Not Found`: Requested resource ID does not exist in the database (e.g. invalid movie_id or booking_id).
- `409 Conflict`: Business rule or constraint violation (e.g. attempting to schedule an overlapping show on the same screen, or attempting to book an already occupied seat).
- `500 Internal Server Error`: Unhandled database connection failure or unexpected server crash.

---

### Q15. Explain Optimistic Concurrency Control vs Pessimistic Concurrency Control in the context of ticket booking.
**Answer:**
- **Pessimistic Concurrency (Our Implementation):** Assumes conflicts are frequent during popular movie ticket sales. Uses row locks (`SELECT ... FOR UPDATE`) inside an explicit transaction to lock the records immediately upon inspection, preventing any other concurrent transaction from modifying or reading them until `COMMIT` or `ROLLBACK`.
- **Optimistic Concurrency:** Assumes conflicts are rare. Does not lock rows up front; instead, it checks a `version` or timestamp column before committing (`UPDATE seats SET booked=1 WHERE id=? AND version=?`). If the version changed, the transaction aborts and retries.
Pessimistic locking is preferred in cinema booking because it guarantees immediate serializability and prevents two customers from both believing they have locked the same VIP seat.

---

## Phase 7 — Comprehensive RDBMS Theory & Viva Mastery

### Q16. Define Super Key, Candidate Key, Primary Key, Alternate Key, and Foreign Key.
**Answer:**
- **Super Key:** Any set of one or more attributes that uniquely identifies a row in a table.
- **Candidate Key:** A minimal Super Key — no proper subset of its attributes can uniquely identify a row. A table can have multiple candidate keys.
- **Primary Key:** The single candidate key selected by the database designer to uniquely identify tuples (e.g., `user_id`, or `(booking_id, seat_id)`). It cannot accept NULL values.
- **Alternate Key:** Any candidate key that was *not* chosen as the primary key (e.g. `email` in `users`).
- **Foreign Key:** An attribute or collection of attributes in a child table whose values must match the primary key of a parent table, establishing a referential relationship.

---

### Q17. What is the difference between 3NF and BCNF (Boyce-Codd Normal Form)?
**Answer:**
- **3NF Rule:** For every functional dependency $X \rightarrow Y$, either:
  1. $X$ is a superkey, OR
  2. $Y$ is a **prime attribute** (part of a candidate key).
- **BCNF Rule:** For every functional dependency $X \rightarrow Y$, $X$ **must strictly be a superkey** (no exceptions for prime attributes).
Every relation in BCNF is guaranteed to be in 3NF. 3NF allows anomalies when a relation has multiple overlapping composite candidate keys. Our schema has non-overlapping keys, so it satisfies both 3NF and BCNF.

---

### Q18. Explain the different types of SQL JOINs with their set semantics.
**Answer:**
1. **INNER JOIN:** Returns only the tuples where the join condition matches in *both* tables (intersection $A \cap B$).
2. **LEFT (OUTER) JOIN:** Returns all rows from the left table, matched with corresponding right table rows (or NULL if no match exists).
3. **RIGHT (OUTER) JOIN:** Returns all rows from the right table, with matching left rows (or NULL).
4. **FULL OUTER JOIN:** Returns all rows when there is a match in either table ($A \cup B$). *(Simulated in MySQL using `LEFT JOIN` UNION `RIGHT JOIN`)*.
5. **CROSS JOIN:** Produces the Cartesian product of two tables (every row of $A$ paired with every row of $B$).
6. **SELF JOIN:** A table joined with itself, often using aliases (e.g., comparing overlapping show intervals on the same screen).

---

### Q19. Explain MySQL Transaction Isolation Levels and the anomalies they prevent.
**Answer:**
InnoDB supports 4 SQL standard isolation levels:
1. **Read Uncommitted:** Allows reading uncommitted changes (**Dirty Reads**).
2. **Read Committed:** Prevents Dirty Reads. Only reads committed data. Subject to **Non-Repeatable Reads** (rereading the same row within a transaction returns different values).
3. **Repeatable Read (MySQL Default):** Prevents Dirty Reads and Non-Repeatable Reads using Multi-Version Concurrency Control (MVCC) snapshots.
4. **Serializable:** Highest isolation. Implements strict two-phase locking. Prevents **Phantom Reads** (new rows appearing in range queries), but incurs significant concurrency overhead.

---

### Q20. What is a Deadlock in MySQL, how is it detected, and how can it be prevented?
**Answer:**
A deadlock occurs when two or more transactions mutually wait for locks held by each other (Circular Wait condition).
- **Example:** Transaction 1 holds a lock on Seat 1 and requests Seat 2; Transaction 2 holds Seat 2 and requests Seat 1.
- **Detection:** InnoDB runs an automatic background deadlock detection algorithm that builds a wait-for graph. When a cycle is detected, InnoDB rolls back the transaction that has modified fewer rows (lowest cost).
- **Prevention:** Always access and lock resources in a **consistent sorted order** (e.g., sorting `seat_ids` numerically before acquiring locks in `sp_book_tickets`).

---

### Q21. What is the difference between a Clustered Index and a Secondary (Non-Clustered) Index in InnoDB?
**Answer:**
- **Clustered Index:** The table data itself is physically organized and stored directly in the leaf nodes of the Primary Key B+ Tree. Every InnoDB table has exactly one clustered index.
- **Secondary Index:** A separate B+ Tree where leaf nodes store the secondary index key columns and a pointer to the **Primary Key**. 
- **Lookup process:** When querying by secondary index, MySQL finds the primary key from the secondary index leaf, then performs a second lookup ("index traversal") into the clustered index to retrieve the remaining columns.

---

### Q22. Compare Stored Procedures and Triggers: When do you use each?
**Answer:**
- **Stored Procedure:** Explicitly invoked by application code (`CALL sp_book_tickets(...)`). Can accept input/output parameters, contain transaction logic (`START TRANSACTION`, `COMMIT`, `ROLLBACK`), and return multiple result sets. Ideal for business workflows like ticket purchase.
- **Trigger:** Implicitly fired by the database engine in response to DML operations (`INSERT`, `UPDATE`, `DELETE`). Cannot accept manual parameters or execute explicit transaction boundaries. Ideal for security, automated audits (`audit_log`), and data invariant checks (blocking overlapping show schedules).

---

### Q23. What are Database Views, and what is the difference between standard Views and Materialized Views?
**Answer:**
- **Standard View:** A saved virtual SQL query (`CREATE VIEW v_show_availability AS ...`). It does not physically store data on disk; each time the view is queried, the DBMS executes the underlying query on the fly.
- **Materialized View:** Physically precomputes and stores the query result on disk like a real table. It must be refreshed when underlying tables change. (MySQL does not have native materialized views, but they can be simulated via summary tables updated by triggers).

---

### Q24. What is the exact difference between `WHERE` and `HAVING` in SQL?
**Answer:**
- **`WHERE`:** Filters individual rows **before** any grouping or aggregate functions are computed. Cannot contain aggregate functions like `SUM()` or `COUNT()`.
- **`HAVING`:** Filters summary groups **after** the `GROUP BY` clause has aggregated the rows. Used to filter based on aggregate results (e.g., `HAVING COUNT(b.booking_id) >= 2`).

---

### Q25. Why use `CHAR(2)` instead of `VARCHAR(2)` for `row_label` in the `seats` table?
**Answer:**
- `CHAR(n)` is fixed-length: always consumes exactly $n$ bytes.
- `VARCHAR(n)` is variable-length: stores characters plus 1 or 2 overhead length-prefix bytes.
For seat row letters (`'A'`, `'B'`, `'AA'`), the length is practically uniform. Using `CHAR(2)` avoids variable-length storage overhead, prevents memory fragmentation, and slightly speeds up B+ Tree index scans.

---

### Q26. Explain Relational Division and how it was implemented in Query 3.2.
**Answer:**
In relational algebra, Division ($R \div S$) answers queries involving "for ALL" conditions — e.g., *"Find users who have booked tickets for ALL registered genres."*
In standard SQL without a native `DIVIDE BY` operator, division is formulated using:
1. **Double Negation (`NOT EXISTS` subqueries):** *"Find users such that there does NOT exist a genre for which there does NOT exist a booking by that user."*
2. **Cardinality Matching (`GROUP BY` + `HAVING`):** Group by user and check if `COUNT(DISTINCT genre_id)` equals `(SELECT COUNT(*) FROM genres)`.
