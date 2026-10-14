# ================================================================
# One-Click Database Setup Script for Movie Ticket Booking
# Run this anytime in PowerShell: .\init-db.ps1
# ================================================================

$mysqlExe = "C:\Program Files\MySQL\MySQL Server 5.5\bin\mysql.exe"
$projectDir = "C:\Users\Atx\OneDrive\Documents\RDBMS Project\movie-ticket-booking"

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "🎬 Initializing Movie Ticket Booking Database..." -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

# Step 1: Run schema
Write-Host "`n1️⃣ Creating Database, 14 Tables and Triggers..." -ForegroundColor Cyan
Get-Content "$projectDir\db\schema.sql" | & $mysqlExe -u root -proot

# Step 2: Run seed
Write-Host "2️⃣ Populating Seed Data (Movies, Theatres, Screens, Seats, Shows)..." -ForegroundColor Cyan
Get-Content "$projectDir\db\seed.sql" | & $mysqlExe -u root -proot movie_booking

# Step 3: Run queries / procedures
Write-Host "3️⃣ Creating Stored Procedure sp_book_tickets, Views & Indexes..." -ForegroundColor Cyan
Get-Content "$projectDir\db\queries.sql" | & $mysqlExe -u root -proot movie_booking

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "✅ ALL DONE! Database is completely initialized!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
