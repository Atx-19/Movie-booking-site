// ================================================================
// Seat Selection Grid Logic (/client/seats.html)
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const showId = urlParams.get('showId');

    if (!showId) {
        alert('No show selected. Redirecting to show schedules.');
        window.location.href = 'shows.html';
        return;
    }

    const movieTitleHeader = document.getElementById('movieTitleHeader');
    const showMetaHeader = document.getElementById('showMetaHeader');
    const seatMatrix = document.getElementById('seatMatrix');
    const bookingBar = document.getElementById('bookingBar');
    const selectedSeatsLabel = document.getElementById('selectedSeatsLabel');
    const selectedTotalAmount = document.getElementById('selectedTotalAmount');
    const btnProceed = document.getElementById('btnProceed');

    let showDetails = null;
    let allSeats = [];
    const selectedSeatMap = new Map(); // seat_id -> { seat_id, label, price, category }

    // 1. Fetch Show details & Seat Matrix
    try {
        const [showRes, seatsRes] = await Promise.all([
            api.get(`/shows/${showId}`),
            api.get(`/shows/${showId}/seats`)
        ]);

        if (!showRes.success || !seatsRes.success) {
            throw new Error('Failed to load show or seat data');
        }

        showDetails = showRes.data;
        allSeats = seatsRes.data;

        // Populate Headers
        movieTitleHeader.textContent = showDetails.movie_title;
        const formattedDate = new Date(showDetails.show_time).toLocaleString('en-IN', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        showMetaHeader.textContent = `🏛️ ${showDetails.theatre_name} (${showDetails.city}) • 📺 ${showDetails.screen_name} • 🕒 ${formattedDate}`;

        renderSeatMatrix(allSeats);
        bookingBar.style.display = 'flex';

    } catch (err) {
        seatMatrix.innerHTML = `<p style="color: var(--danger); text-align: center;">Error loading seats: ${err.message}</p>`;
    }

    // 2. Render Seat Rows
    function renderSeatMatrix(seats) {
        // Group seats by row_label (A, B, C...)
        const rows = {};
        seats.forEach(s => {
            if (!rows[s.row_label]) rows[s.row_label] = [];
            rows[s.row_label].push(s);
        });

        seatMatrix.innerHTML = Object.entries(rows).map(([rowLabel, rowSeats]) => {
            // Sort by seat_number
            rowSeats.sort((a, b) => a.seat_number - b.seat_number);

            const seatHtml = rowSeats.map(s => {
                const label = `${s.row_label}${s.seat_number}`;
                const isBooked = Boolean(s.is_booked);
                const statusClass = isBooked ? 'booked' : 'available';

                return `
                    <div class="seat ${statusClass}" 
                         data-id="${s.seat_id}"
                         data-label="${label}"
                         data-price="${s.price}"
                         data-category="${s.category}"
                         data-booked="${isBooked}"
                         title="${label} • ${s.category.toUpperCase()} • ₹${s.price}">
                        ${s.seat_number}
                    </div>
                `;
            }).join('');

            return `
                <div class="seat-row">
                    <span class="row-label">${rowLabel}</span>
                    ${seatHtml}
                    <span class="row-label">${rowLabel}</span>
                </div>
            `;
        }).join('');

        // Attach Click Listeners
        document.querySelectorAll('.seat.available').forEach(elem => {
            elem.addEventListener('click', () => toggleSeat(elem));
        });
    }

    // 3. Toggle Seat Selection
    function toggleSeat(elem) {
        const seatId = parseInt(elem.dataset.id, 10);
        const label = elem.dataset.label;
        const price = parseFloat(elem.dataset.price);
        const category = elem.dataset.category;

        if (selectedSeatMap.has(seatId)) {
            // Deselect
            selectedSeatMap.delete(seatId);
            elem.classList.remove('selected');
        } else {
            // Select (Max 8 seats per booking for standard guardrail)
            if (selectedSeatMap.size >= 8) {
                alert('You can select a maximum of 8 seats per booking.');
                return;
            }
            selectedSeatMap.set(seatId, { seat_id: seatId, label, price, category });
            elem.classList.add('selected');
        }

        updateSummary();
    }

    // 4. Update Booking Summary Bar
    function updateSummary() {
        const count = selectedSeatMap.size;

        if (count === 0) {
            selectedSeatsLabel.textContent = 'No seats selected';
            selectedTotalAmount.textContent = '₹0.00';
            btnProceed.disabled = true;
            return;
        }

        const seatList = Array.from(selectedSeatMap.values());
        const labels = seatList.map(s => s.label).join(', ');
        const total = seatList.reduce((sum, s) => sum + s.price, 0);

        selectedSeatsLabel.textContent = `Selected: ${labels} (${count} ${count === 1 ? 'seat' : 'seats'})`;
        selectedTotalAmount.textContent = `₹${total.toFixed(2)}`;
        btnProceed.disabled = false;
    }

    // 5. Proceed to Booking Confirmation
    btnProceed.addEventListener('click', () => {
        if (selectedSeatMap.size === 0) return;

        const bookingDraft = {
            showId: parseInt(showId, 10),
            movieTitle: showDetails.movie_title,
            theatreName: showDetails.theatre_name,
            screenName: showDetails.screen_name,
            showTime: showDetails.show_time,
            seats: Array.from(selectedSeatMap.values()),
            totalAmount: Array.from(selectedSeatMap.values()).reduce((sum, s) => sum + s.price, 0)
        };

        // Save in sessionStorage
        sessionStorage.setItem('pending_booking', JSON.stringify(bookingDraft));
        window.location.href = 'confirm.html';
    });
});
