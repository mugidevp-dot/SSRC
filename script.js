/* =========================================================
   Sai Ram Communications — Booking Logic v4
   Mon–Fri : 5 PM – 10 PM | 2 slots/hour | 10 slots/day
   Sat–Sun : 10 AM – 2 PM + 5 PM – 10 PM | 2 slots/hour | 18 slots/day
   Document panel updates live when service is selected.
========================================================= */
(function () {
  "use strict";

  const BUSINESS_WHATSAPP_NUMBER = "919042389819";
  const STORAGE_KEY = "src_bookings_v2";

  /* ── SERVICES & DOCUMENTS ─────────────────────────────
     Add new services here. Each entry:
       label    : shown in the dropdown
       docs     : array of required document strings
     To add a new service later, just add another object.
  ──────────────────────────────────────────────────── */
  const SERVICES = [
    {
      label: "PAN Card – New Application",
      docs: [
        "Aadhaar Card (original + photocopy)",
        "Passport-size photograph (2 copies)",
        "Date of Birth proof (Birth certificate / 10th marksheet)",
        "Mobile number linked to Aadhaar"
      ]
    },
    {
      label: "PAN Card – Correction / Reprint",
      docs: [
        "Existing PAN card copy",
        "Aadhaar Card (original + photocopy)",
        "Proof of correction (e.g. name change gazette)",
        "Passport-size photograph (2 copies)"
      ]
    },
    {
      label: "Voter ID – New Registration",
      docs: [
        "Aadhaar Card (original + photocopy)",
        "Passport-size photograph (2 copies)",
        "Age proof (Birth certificate / 10th marksheet)",
        "Address proof (Aadhaar / Electricity bill)"
      ]
    },
    {
      label: "Voter ID – Correction / Transfer",
      docs: [
        "Existing Voter ID card copy",
        "Aadhaar Card (original + photocopy)",
        "Address proof for transfer (Aadhaar / Utility bill)",
        "Passport-size photograph (1 copy)"
      ]
    },
    {
      label: "GST – New Registration",
      docs: [
        "PAN Card of proprietor / partners",
        "Aadhaar Card of proprietor",
        "Business address proof (Electricity bill / Rent agreement)",
        "Bank account details (cancelled cheque / passbook)",
        "Passport-size photograph",
        "Mobile & email (active)"
      ]
    },
    {
      label: "GST – Return Filing",
      docs: [
        "GST Registration number (GSTIN)",
        "Sales invoices for the period",
        "Purchase invoices for the period",
        "Bank statement for the period"
      ]
    },
    {
      label: "Aadhaar – Update / Correction",
      docs: [
        "Existing Aadhaar card",
        "Proof for field being corrected:",
        "→ Name: Gazette notification / School certificate",
        "→ Address: Electricity bill / Bank passbook",
        "→ DOB: Birth certificate / 10th marksheet",
        "Mobile number (for OTP)"
      ]
    },
    {
      label: "Income Certificate",
      docs: [
        "Aadhaar Card (original + photocopy)",
        "Ration Card copy",
        "Salary slip or income proof",
        "Self-declaration letter",
        "Passport-size photograph (2 copies)"
      ]
    },
    {
      label: "Community Certificate",
      docs: [
        "Aadhaar Card (original + photocopy)",
        "Ration Card copy",
        "School Transfer Certificate (TC)",
        "Father's community certificate (if available)",
        "Passport-size photograph (2 copies)"
      ]
    },
    {
      label: "Nativity Certificate",
      docs: [
        "Aadhaar Card (original + photocopy)",
        "Ration Card copy",
        "School TC or Birth Certificate",
        "Revenue / VAO recommendation letter",
        "Passport-size photograph (2 copies)"
      ]
    },
    {
      label: "Birth Certificate",
      docs: [
        "Hospital discharge summary",
        "Parents' Aadhaar Card copies",
        "Parents' marriage certificate",
        "Ration Card copy"
      ]
    },
    {
      label: "Other Esevai Service",
      docs: [
        "Aadhaar Card (original + photocopy)",
        "Please bring all relevant original documents",
        "Passport-size photographs (2 copies)",
        "Contact us at 90423 89819 for specific document list"
      ]
    }
  ];

  /* ── SLOT DEFINITIONS ───────────────────────────────── */
  const WEEKDAY_SLOTS = [
    { time: "5:00 PM", session: "evening" },
    { time: "5:30 PM", session: "evening" },
    { time: "6:00 PM", session: "evening" },
    { time: "6:30 PM", session: "evening" },
    { time: "7:00 PM", session: "evening" },
    { time: "7:30 PM", session: "evening" },
    { time: "8:00 PM", session: "evening" },
    { time: "8:30 PM", session: "evening" },
    { time: "9:00 PM", session: "evening" },
    { time: "9:30 PM", session: "evening" }
  ];

  const WEEKEND_SLOTS = [
    { time: "10:00 AM", session: "morning" },
    { time: "10:30 AM", session: "morning" },
    { time: "11:00 AM", session: "morning" },
    { time: "11:30 AM", session: "morning" },
    { time: "12:00 PM", session: "morning" },
    { time: "12:30 PM", session: "morning" },
    { time: "1:00 PM",  session: "morning" },
    { time: "1:30 PM",  session: "morning" },
    // lunch gap — no 2 PM to 5 PM
    { time: "5:00 PM", session: "evening" },
    { time: "5:30 PM", session: "evening" },
    { time: "6:00 PM", session: "evening" },
    { time: "6:30 PM", session: "evening" },
    { time: "7:00 PM", session: "evening" },
    { time: "7:30 PM", session: "evening" },
    { time: "8:00 PM", session: "evening" },
    { time: "8:30 PM", session: "evening" },
    { time: "9:00 PM", session: "evening" },
    { time: "9:30 PM", session: "evening" }
  ];

  function getSlotsForDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    return (day === 0 || day === 6) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
  }

  function isWeekend(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  /* ── STORAGE ────────────────────────────────────────── */
  function loadBookings() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch(e) { return {}; }
  }
  function saveBookings(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function getBookedSlotsForDate(dateStr) {
    const data = loadBookings();
    return data[dateStr] ? Object.keys(data[dateStr]) : [];
  }
  function addBooking(dateStr, slot, details) {
    const data = loadBookings();
    if (!data[dateStr]) data[dateStr] = {};
    data[dateStr][slot] = details;
    saveBookings(data);
  }

  /* ── UTILS ──────────────────────────────────────────── */
  function generateBookingNumber(dateStr) {
    const compact = dateStr.replace(/-/g, "").slice(2);
    return `SRC-${compact}-${Math.floor(100 + Math.random() * 900)}`;
  }
  function formatDateNice(dateStr) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short", day: "2-digit", month: "short", year: "numeric"
    });
  }

  /* ── DOM REFS ───────────────────────────────────────── */
  const visitDateInput   = document.getElementById("visitDate");
  const slotGrid         = document.getElementById("slotGrid");
  const slotDateLabel    = document.getElementById("slotDateLabel");
  const slotTimingNote   = document.getElementById("slotTimingNote");
  const selectedSlotInput= document.getElementById("selectedSlot");
  const serviceSelect    = document.getElementById("service");
  const docPanel         = document.getElementById("docPanel");
  const docList          = document.getElementById("docList");
  const docServiceName   = document.getElementById("docServiceName");
  const bookingForm      = document.getElementById("bookingForm");
  const confirmCard      = document.getElementById("confirmCard");
  const confBookingNo    = document.getElementById("confBookingNo");
  const confDate         = document.getElementById("confDate");
  const confSlot         = document.getElementById("confSlot");
  const confService      = document.getElementById("confService");
  const waCustomerLink   = document.getElementById("waCustomerLink");
  const waOwnerLink      = document.getElementById("waOwnerLink");
  const newBookingBtn    = document.getElementById("newBookingBtn");
  const navToggle        = document.getElementById("navToggle");
  const mainNav          = document.getElementById("mainNav");

  /* ── POPULATE SERVICES DROPDOWN ─────────────────────── */
  SERVICES.forEach((svc, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = svc.label;
    serviceSelect.appendChild(opt);
  });

  /* ── DOCUMENT PANEL ─────────────────────────────────── */
  function showDocPanel(index) {
    const svc = SERVICES[index];
    if (!svc) { docPanel.hidden = true; return; }
    docServiceName.textContent = svc.label;
    docList.innerHTML = svc.docs.map(d => `<li>${d}</li>`).join("");
    docPanel.hidden = false;
  }

  serviceSelect.addEventListener("change", function () {
    const idx = this.value;
    if (idx === "") { docPanel.hidden = true; return; }
    showDocPanel(parseInt(idx, 10));
  });

  /* ── SLOT RENDERING ─────────────────────────────────── */
  function renderSlots(dateStr) {
    slotGrid.innerHTML = "";
    selectedSlotInput.value = "";
    slotDateLabel.textContent = dateStr ? `— ${formatDateNice(dateStr)}` : "";

    if (!dateStr) {
      slotGrid.innerHTML = '<p class="slot-hint">Choose a date to see available slots.</p>';
      slotTimingNote.textContent = "";
      return;
    }

    const weekend = isWeekend(dateStr);
    slotTimingNote.textContent = weekend
      ? "Weekend: 10 AM–2 PM (Morning) · 5 PM–10 PM (Evening) · 2 slots/hour"
      : "Weekday: 5 PM–10 PM · 2 slots/hour · 10 slots/day";

    const allSlots    = getSlotsForDate(dateStr);
    const bookedSlots = getBookedSlotsForDate(dateStr);
    const available   = allSlots.filter(s => !bookedSlots.includes(s.time));

    if (available.length === 0) {
      slotGrid.innerHTML = '<p class="slot-hint">All slots for this date are fully booked. Please choose another date.</p>';
      return;
    }

    // Group by session so we can show a lunch label on weekends
    const sessions = {};
    available.forEach(s => {
      if (!sessions[s.session]) sessions[s.session] = [];
      sessions[s.session].push(s);
    });

    if (sessions.morning && sessions.morning.length) {
      const label = document.createElement("p");
      label.className = "session-label";
      label.textContent = "🌅 Morning Session";
      slotGrid.appendChild(label);
      renderSlotButtons(sessions.morning);
    }

    if (sessions.morning && sessions.evening) {
      const gap = document.createElement("p");
      gap.className = "session-label lunch-gap";
      gap.textContent = "🍽️ Lunch Break · 2:00 PM – 5:00 PM";
      slotGrid.appendChild(gap);
    }

    if (sessions.evening && sessions.evening.length) {
      if (sessions.morning) {
        const label = document.createElement("p");
        label.className = "session-label";
        label.textContent = "🌆 Evening Session";
        slotGrid.appendChild(label);
      }
      renderSlotButtons(sessions.evening);
    }
  }

  function renderSlotButtons(slots) {
    const wrap = document.createElement("div");
    wrap.className = "slot-btn-row";
    slots.forEach(s => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      btn.textContent = s.time;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedSlotInput.value = s.time;
      });
      wrap.appendChild(btn);
    });
    slotGrid.appendChild(wrap);
  }

  /* ── INIT DATE ──────────────────────────────────────── */
  if (visitDateInput) {
    const todayStr = new Date().toISOString().split("T")[0];
    visitDateInput.min = todayStr;
    visitDateInput.value = todayStr;
    renderSlots(todayStr);
    visitDateInput.addEventListener("change", e => renderSlots(e.target.value));
  }

  /* ── WHATSAPP LINKS ─────────────────────────────────── */
  function buildCustomerWA({ bookingNo, name, service, dateStr, slot }) {
    const phone = document.getElementById("phone").value.trim();
    const msg =
      `*Sai Ram Communications — Appointment Confirmed ✅*%0A%0A` +
      `Hello ${name},%0A` +
      `Your appointment is successfully booked.%0A%0A` +
      `📋 *Booking No:* ${bookingNo}%0A` +
      `🛎️ *Service:* ${service}%0A` +
      `📅 *Date:* ${formatDateNice(dateStr)}%0A` +
      `🕔 *Time Slot:* ${slot}%0A%0A` +
      `📍 Sai Ram Communications, S Kolathur, Chennai%0A` +
      `⏰ Please arrive on time with your original documents.%0A` +
      `📞 Queries: 90423 89819`;
    return `https://wa.me/91${phone}?text=${msg}`;
  }

  function buildOwnerWA({ bookingNo, name, phone, service, dateStr, slot }) {
    const msg =
      `*New Booking Alert — Sai Ram Communications 🔔*%0A%0A` +
      `📋 *Booking No:* ${bookingNo}%0A` +
      `👤 *Customer:* ${name}%0A` +
      `📞 *Phone:* ${phone}%0A` +
      `🛎️ *Service:* ${service}%0A` +
      `📅 *Date:* ${formatDateNice(dateStr)}%0A` +
      `🕔 *Time:* ${slot}`;
    return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${msg}`;
  }

  /* ── FORM SUBMIT ────────────────────────────────────── */
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const fullName   = document.getElementById("fullName").value.trim();
      const phone      = document.getElementById("phone").value.trim();
      const svcIdx     = serviceSelect.value;
      const dateStr    = visitDateInput.value;
      const slot       = selectedSlotInput.value;

      if (!fullName || !phone || svcIdx === "" || !dateStr) {
        alert("Please fill in all the details."); return;
      }
      if (!/^[0-9]{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number."); return;
      }
      if (!slot) {
        alert("Please select an available time slot."); return;
      }

      const booked = getBookedSlotsForDate(dateStr);
      if (booked.includes(slot)) {
        alert("That slot was just taken. Please choose another.");
        renderSlots(dateStr); return;
      }

      const service    = SERVICES[parseInt(svcIdx, 10)].label;
      const bookingNo  = generateBookingNumber(dateStr);

      addBooking(dateStr, slot, { bookingNo, fullName, phone, service, dateStr, slot, createdAt: new Date().toISOString() });

      confBookingNo.textContent = bookingNo;
      confDate.textContent      = formatDateNice(dateStr);
      confSlot.textContent      = slot;
      confService.textContent   = service;

      waCustomerLink.href = buildCustomerWA({ bookingNo, name: fullName, service, dateStr, slot });
      waOwnerLink.href    = buildOwnerWA({ bookingNo, name: fullName, phone, service, dateStr, slot });

      bookingForm.hidden = true;
      confirmCard.hidden = false;
      confirmCard.scrollIntoView({ behavior: "smooth", block: "center" });

      window.open(waCustomerLink.href, "_blank");
    });
  }

  /* ── NEW BOOKING ────────────────────────────────────── */
  if (newBookingBtn) {
    newBookingBtn.addEventListener("click", () => {
      bookingForm.reset();
      bookingForm.hidden = false;
      confirmCard.hidden = true;
      docPanel.hidden = true;
      const todayStr = new Date().toISOString().split("T")[0];
      visitDateInput.value = todayStr;
      renderSlots(todayStr);
      bookingForm.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ── MOBILE NAV ─────────────────────────────────────── */
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
    mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => mainNav.classList.remove("open")));
  }

  document.getElementById("year").textContent = new Date().getFullYear();

})();
