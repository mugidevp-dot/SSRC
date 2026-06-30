/* =========================================================
   Sai Ram Communications — Booking Logic
   - 10 offline visit slots per day
   - Booking number generated on confirm
   - Booking details sent via WhatsApp click-to-chat link
========================================================= */

(function () {
  "use strict";

  // ---- Config ----
  const BUSINESS_WHATSAPP_NUMBER = "919042389819"; // country code + number, no symbols
  const DAILY_SLOTS = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
    "11:30 AM", "12:00 PM", "1:00 PM", "1:30 PM", "2:00 PM"
  ];
  const STORAGE_KEY = "src_bookings_v1";

  // ---- Helpers: storage ----
  function loadBookings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveBookings(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getBookedSlotsForDate(dateStr) {
    const data = loadBookings();
    return data[dateStr] ? Object.keys(data[dateStr]) : [];
  }

  function addBooking(dateStr, slot, bookingDetails) {
    const data = loadBookings();
    if (!data[dateStr]) data[dateStr] = {};
    data[dateStr][slot] = bookingDetails;
    saveBookings(data);
  }

  function generateBookingNumber(dateStr) {
    const compactDate = dateStr.replace(/-/g, "").slice(2); // YYMMDD
    const rand = Math.floor(100 + Math.random() * 900); // 3-digit
    return `SRC-${compactDate}-${rand}`;
  }

  function formatDateNice(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  }

  // ---- DOM refs ----
  const visitDateInput = document.getElementById("visitDate");
  const slotGrid = document.getElementById("slotGrid");
  const slotDateLabel = document.getElementById("slotDateLabel");
  const selectedSlotInput = document.getElementById("selectedSlot");
  const bookingForm = document.getElementById("bookingForm");
  const confirmCard = document.getElementById("confirmCard");
  const confBookingNo = document.getElementById("confBookingNo");
  const confDate = document.getElementById("confDate");
  const confSlot = document.getElementById("confSlot");
  const confService = document.getElementById("confService");
  const whatsappConfirmLink = document.getElementById("whatsappConfirmLink");
  const newBookingBtn = document.getElementById("newBookingBtn");
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  // ---- Set min date to today ----
  if (visitDateInput) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    visitDateInput.min = todayStr;
    visitDateInput.value = todayStr;
    renderSlots(todayStr);
  }

  // ---- Render slot grid for a given date ----
  function renderSlots(dateStr) {
    slotGrid.innerHTML = "";
    selectedSlotInput.value = "";
    slotDateLabel.textContent = dateStr ? `— ${formatDateNice(dateStr)}` : "";

    if (!dateStr) {
      slotGrid.innerHTML = '<p class="slot-hint">Choose a date to see today\'s available slots.</p>';
      return;
    }

    const bookedSlots = getBookedSlotsForDate(dateStr);

    DAILY_SLOTS.forEach((slot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      btn.textContent = slot;

      const isFull = bookedSlots.includes(slot);
      if (isFull) {
        btn.classList.add("full");
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".slot-btn").forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          selectedSlotInput.value = slot;
        });
      }
      slotGrid.appendChild(btn);
    });

    if (bookedSlots.length >= DAILY_SLOTS.length) {
      const full = document.createElement("p");
      full.className = "slot-hint";
      full.textContent = "All 10 slots for this date are fully booked. Please choose another date.";
      slotGrid.appendChild(full);
    }
  }

  if (visitDateInput) {
    visitDateInput.addEventListener("change", (e) => renderSlots(e.target.value));
  }

  // ---- Build WhatsApp click-to-chat link ----
  function buildWhatsAppLink({ bookingNo, name, phone, service, dateStr, slot }) {
    const message =
      `*New Appointment Booking - Sai Ram Communications*%0A` +
      `Booking No: *${bookingNo}*%0A` +
      `Name: ${name}%0A` +
      `Phone: ${phone}%0A` +
      `Service: ${service}%0A` +
      `Scheduled Date: ${formatDateNice(dateStr)}%0A` +
      `Time Slot: ${slot}%0A` +
      `(Sent automatically from website booking form)`;
    return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${message}`;
  }

  // ---- Handle form submit ----
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const fullName = document.getElementById("fullName").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const service = document.getElementById("service").value;
      const dateStr = visitDateInput.value;
      const slot = selectedSlotInput.value;

      if (!fullName || !phone || !service || !dateStr) {
        alert("Please fill in all the details.");
        return;
      }
      if (!/^[0-9]{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (!slot) {
        alert("Please select an available time slot.");
        return;
      }

      // Double-check slot still free (race condition safety for same browser)
      const bookedSlots = getBookedSlotsForDate(dateStr);
      if (bookedSlots.includes(slot)) {
        alert("Sorry, that slot was just taken. Please choose another.");
        renderSlots(dateStr);
        return;
      }

      const bookingNo = generateBookingNumber(dateStr);

      addBooking(dateStr, slot, {
        bookingNo, fullName, phone, service, dateStr, slot,
        createdAt: new Date().toISOString()
      });

      // Populate confirmation card
      confBookingNo.textContent = bookingNo;
      confDate.textContent = formatDateNice(dateStr);
      confSlot.textContent = slot;
      confService.textContent = service;

      const waLink = buildWhatsAppLink({ bookingNo, name: fullName, phone, service, dateStr, slot });
      whatsappConfirmLink.href = waLink;

      bookingForm.hidden = true;
      confirmCard.hidden = false;
      confirmCard.scrollIntoView({ behavior: "smooth", block: "center" });

      // Auto-open WhatsApp with prefilled confirmation message
      window.open(waLink, "_blank");
    });
  }

  // ---- Reset to make another booking ----
  if (newBookingBtn) {
    newBookingBtn.addEventListener("click", () => {
      bookingForm.reset();
      bookingForm.hidden = false;
      confirmCard.hidden = true;
      const todayStr = new Date().toISOString().split("T")[0];
      visitDateInput.value = todayStr;
      renderSlots(todayStr);
      bookingForm.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // ---- Mobile nav toggle ----
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });
    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => mainNav.classList.remove("open"));
    });
  }

  // ---- Footer year ----
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
