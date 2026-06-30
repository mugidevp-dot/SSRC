/* =========================================================
   Sai Ram Communications — Booking Logic
   - 10 offline visit slots per day
   - Booking number generated on confirm
   - Booking details sent via WhatsApp click-to-chat link
========================================================= */

(function () {
  "use strict";

  // ---- Config ----
  const BUSINESS_SMS_NUMBER = "9042389819"; // used for sms: link
  // Office hours: 5 PM - 10 PM, 3 slots per hour (20 min each) = 15 slots/day
  const DAILY_SLOTS = [
    "5:00 PM", "5:20 PM", "5:40 PM",
    "6:00 PM", "6:20 PM", "6:40 PM",
    "7:00 PM", "7:20 PM", "7:40 PM",
    "8:00 PM", "8:20 PM", "8:40 PM",
    "9:00 PM", "9:20 PM", "9:40 PM"
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
    const availableSlots = DAILY_SLOTS.filter((slot) => !bookedSlots.includes(slot));

    if (availableSlots.length === 0) {
      const full = document.createElement("p");
      full.className = "slot-hint";
      full.textContent = "All slots for this date are fully booked (5 PM – 10 PM). Please choose another date.";
      slotGrid.appendChild(full);
      return;
    }

    availableSlots.forEach((slot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      btn.textContent = slot;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedSlotInput.value = slot;
      });
      slotGrid.appendChild(btn);
    });
  }

  if (visitDateInput) {
    visitDateInput.addEventListener("change", (e) => renderSlots(e.target.value));
  }

  // ---- Build SMS link ----
  function buildSmsLink({ bookingNo, name, phone, service, dateStr, slot }) {
    const message =
      `Sai Ram Communications - Appointment Confirmed. ` +
      `Booking No: ${bookingNo}. Name: ${name}. Service: ${service}. ` +
      `Date: ${formatDateNice(dateStr)}. Time: ${slot}. ` +
      `Visit our office (5 PM - 10 PM) with your documents.`;
    const encodedMsg = encodeURIComponent(message);
    // sms: URI works on mobile devices to open the messaging app with the body pre-filled
    return `sms:${BUSINESS_SMS_NUMBER}?&body=${encodedMsg}`;
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

      const waLink = buildSmsLink({ bookingNo, name: fullName, phone, service, dateStr, slot });
      whatsappConfirmLink.href = waLink;

      bookingForm.hidden = true;
      confirmCard.hidden = false;
      confirmCard.scrollIntoView({ behavior: "smooth", block: "center" });

      // Auto-open SMS app with prefilled confirmation message
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
