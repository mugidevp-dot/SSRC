/* =========================================================
   Sai Ram Communications — script.js v6
   FILE UPLOAD FIX: Uses hidden <iframe> so the real
   multipart form POST goes to FormSubmit.co — files arrive
   as email attachments. No AJAX needed, no CORS issues.
   First submission → verify the email Formsubmit sends to
   SSRC7010@gmail.com, then all future submissions deliver.
========================================================= */
(function () {
  "use strict";

  /* ── SERVICES ────────────────────────────────────────── */
  const SERVICES = [
    { label:"Community Certificate", docs:["Applicant Photo","Applicant Aadhaar Card","Parent's Transfer Certificate (TC)|OR|Parent's Community Certificate","Applicant Signature","Mobile Number"] },
    { label:"Nativity Certificate",  docs:["Applicant Photo","Applicant Aadhaar Card","Applicant Birth Certificate","Smart Card (Family Card)","Applicant Signature","Mobile Number"] },
    { label:"Income Certificate",    docs:["Applicant Photo","Applicant Aadhaar Card","Applicant's PAN Card|OR|Father's PAN Card","Smart Card (Family Card)","Applicant Signature","Mobile Number"] },
    { label:"OBC Certificate",       docs:["Applicant Photo","Applicant Aadhaar Card","Income Certificate","Community Certificate","Applicant Signature","Mobile Number"] },
    { label:"New PAN Card",          docs:["Applicant Photo","Aadhaar Card","Birth Certificate"] },
    { label:"PAN Card Correction",   docs:["Applicant Photo","Aadhaar Card","Birth Certificate|OR|Voter ID|OR|Driving Licence","Old PAN Card","Applicant Signature","Mobile Number"] },
    { label:"New Voter ID",          docs:["Applicant Photo","Aadhaar Card"] },
    { label:"Voter ID Correction",   docs:["Old Voter ID","Aadhaar Card|OR|Driving Licence|OR|PAN Card"] },
    { label:"New Ration Card",       docs:["Family Head Photo","Aadhaar Cards of All Family Members","Current Gas Bill","Marriage Invitation|OR|Marriage Certificate"] },
    { label:"EB Bill Payment",       docs:["EB Bill Copy|OR|Consumer Number","Mobile Number"] },
    { label:"College Fees / Exam Fee Payments", docs:["Fee Payment Challan|OR|Receipt Details","Student ID|OR|Admit Card","Mobile Number"] },
    { label:"TNPSC Exam Services",   docs:["Applicant Photo","Aadhaar Card","Educational Certificates","Mobile Number"] },
    { label:"MSME Registration / Update", docs:["Aadhaar Card","PAN Card","Business Address Proof","Bank Passbook|OR|Cancelled Cheque","Mobile Number"] },
    { label:"PVC Card / Plastic Card Printing", docs:["ID Card Photo|OR|Scanned Copy","Mobile Number"] },
    { label:"Certificate Lamination", docs:["Certificate(s) to be Laminated"] },
    { label:"Spiral Binding",        docs:["Documents to be Bound"] },
    { label:"PF Services",           docs:["UAN Number|OR|PF Account Number","Aadhaar Card","Bank Passbook","Mobile Number"] }
  ];

  /* ── SLOTS ───────────────────────────────────────────── */
  const WD = [
    {t:"5:00 PM",s:"evening"},{t:"5:30 PM",s:"evening"},{t:"6:00 PM",s:"evening"},{t:"6:30 PM",s:"evening"},
    {t:"7:00 PM",s:"evening"},{t:"7:30 PM",s:"evening"},{t:"8:00 PM",s:"evening"},{t:"8:30 PM",s:"evening"},
    {t:"9:00 PM",s:"evening"},{t:"9:30 PM",s:"evening"}
  ];
  const WE = [
    {t:"10:00 AM",s:"morning"},{t:"10:30 AM",s:"morning"},{t:"11:00 AM",s:"morning"},{t:"11:30 AM",s:"morning"},
    {t:"12:00 PM",s:"morning"},{t:"12:30 PM",s:"morning"},{t:"1:00 PM",s:"morning"},{t:"1:30 PM",s:"morning"},
    {t:"5:00 PM",s:"evening"},{t:"5:30 PM",s:"evening"},{t:"6:00 PM",s:"evening"},{t:"6:30 PM",s:"evening"},
    {t:"7:00 PM",s:"evening"},{t:"7:30 PM",s:"evening"},{t:"8:00 PM",s:"evening"},{t:"8:30 PM",s:"evening"},
    {t:"9:00 PM",s:"evening"},{t:"9:30 PM",s:"evening"}
  ];

  const STORAGE_KEY   = "src_v2";
  const ALLOWED_EXT   = /\.(pdf|jpg|jpeg|png)$/i;
  const ALLOWED_MIME  = ["application/pdf","image/jpeg","image/jpg","image/png"];
  const MAX_BYTES     = 20 * 1024 * 1024; // 20 MB total upload limit

  /* ── UTILS ───────────────────────────────────────────── */
  const $ = id => document.getElementById(id);
  function loadB(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}catch(e){return{}}}
  function saveB(d){localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}
  function getBooked(date){const d=loadB();return d[date]?Object.keys(d[date]):[]}
  function addBooked(date,slot,info){const d=loadB();if(!d[date])d[date]={};d[date][slot]=info;saveB(d)}
  function genNo(date){return`SRC-${date.replace(/-/g,"").slice(2)}-${100+Math.floor(Math.random()*900)}`}
  function fmtDate(date){return new Date(date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}
  function isWE(date){const d=new Date(date+"T00:00:00").getDay();return d===0||d===6}
  function fmtBytes(b){return b<1048576?(b/1024).toFixed(1)+" KB":(b/1048576).toFixed(1)+" MB"}
  function fileIcon(t){return t==="application/pdf"?"📄":t.startsWith("image/")?"🖼️":"📎"}
  function waLink(ph,msg){return`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`}

  /* ══════════════════════════════════════════════════════
     PAGE LOAD PROGRESS BAR
  ══════════════════════════════════════════════════════ */
  const loadBar = $("loadBar");
  if (loadBar) {
    requestAnimationFrame(() => { loadBar.style.width = "70%"; });
    window.addEventListener("load", () => {
      loadBar.style.width = "100%";
      setTimeout(() => loadBar.classList.add("done"), 350);
      setTimeout(() => { loadBar.style.display = "none"; }, 900);
    });
  }

  /* ══════════════════════════════════════════════════════
     HERO ENTRANCE ANIMATIONS
     Hero elements (anim-slide-up / anim-slide-right) are
     above the fold, so trigger them right away rather than
     waiting for a scroll-based IntersectionObserver.
  ══════════════════════════════════════════════════════ */
  requestAnimationFrame(() => {
    document.querySelectorAll(".anim-slide-up, .anim-slide-right").forEach(el => {
      el.classList.add("visible");
    });
  });

  /* ══════════════════════════════════════════════════════
     SCROLL REVEAL — IntersectionObserver
     Covers every other section (anim-up / anim-left /
     anim-right / anim-scale) as it enters the viewport.
  ══════════════════════════════════════════════════════ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".anim-up, .anim-left, .anim-right, .anim-scale")
    .forEach(el => revealObserver.observe(el));

  /* ══════════════════════════════════════════════════════
     COUNTER ANIMATION for hero stats
  ══════════════════════════════════════════════════════ */
  function animateCount(el, target, duration = 1800) {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(ease * target);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        el.classList.add("count-done");
        setTimeout(() => el.classList.remove("count-done"), 350);
      }
    };
    requestAnimationFrame(tick);
  }

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll(".hero-stats [data-count]").forEach(el => {
          animateCount(el, parseInt(el.dataset.count, 10));
        });
        heroObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const statsEl = document.querySelector(".hero-stats");
  if (statsEl) heroObserver.observe(statsEl);

  /* ══════════════════════════════════════════════════════
     HEADER — shadow + hide-on-scroll-down
  ══════════════════════════════════════════════════════ */
  const header = document.querySelector(".site-header");
  let lastScrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (!header) return;
    header.classList.toggle("scrolled", y > 20);
    if (y > lastScrollY && y > 160) {
      header.classList.add("hide-on-scroll");   // scrolling down — hide
    } else {
      header.classList.remove("hide-on-scroll"); // scrolling up — show
    }
    lastScrollY = y;
  }, { passive: true });

  /* ══════════════════════════════════════════════════════
     BACK TO TOP BUTTON
  ══════════════════════════════════════════════════════ */
  const backToTop = $("backToTop");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("show", window.scrollY > 500);
    }, { passive: true });
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ══════════════════════════════════════════════════════
     GOOGLE REVIEWS — "Show more" toggle
  ══════════════════════════════════════════════════════ */
  const reviewsMoreBtn = $("reviewsMoreBtn");
  if (reviewsMoreBtn) {
    reviewsMoreBtn.addEventListener("click", () => {
      const extras = document.querySelectorAll(".extra-review");
      extras.forEach(card => {
        card.hidden = false;
        requestAnimationFrame(() => card.classList.add("visible"));
      });
      reviewsMoreBtn.hidden = true;
    });
  }

  /* ══════════════════════════════════════════════════════
     BUTTON RIPPLE EFFECT — applies to every .btn
  ══════════════════════════════════════════════════════ */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn || btn.disabled) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    ripple.className = "btn-ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top  = (e.clientY - rect.top - size / 2) + "px";
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });

  /* ══════════════════════════════════════════════════════
     HERO CARD — subtle mouse-tracking 3D tilt
  ══════════════════════════════════════════════════════ */
  const heroCard = $("heroCard");
  if (heroCard) {
    heroCard.addEventListener("mousemove", (e) => {
      const rect = heroCard.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      heroCard.style.setProperty("--rx", (px * 8).toFixed(2) + "deg");
      heroCard.style.setProperty("--ry", (-py * 8).toFixed(2) + "deg");
    });
    heroCard.addEventListener("mouseleave", () => {
      heroCard.style.setProperty("--rx", "0deg");
      heroCard.style.setProperty("--ry", "0deg");
    });
  }

  /* ══════════════════════════════════════════════════════
     MOBILE NAV
  ══════════════════════════════════════════════════════ */
  const navToggle = $("navToggle"), mainNav = $("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("open");
      mainNav.classList.toggle("open");
    });
    mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      navToggle.classList.remove("open"); mainNav.classList.remove("open");
    }));
  }

  /* ══════════════════════════════════════════════════════
     TAB SWITCHING
  ══════════════════════════════════════════════════════ */
  function switchTab(which) {
    document.querySelectorAll(".btab").forEach(b => b.classList.toggle("active", b.dataset.tab === which));
    const paneOn  = which === "offline" ? $("tabOffline") : $("tabOnline");
    const paneOff = which === "offline" ? $("tabOnline")  : $("tabOffline");
    paneOff.hidden = true;
    paneOn.hidden = false;
    paneOn.classList.remove("tab-anim");
    void paneOn.offsetWidth; // force reflow so the animation replays
    paneOn.classList.add("tab-anim");
    if (which === "online") updateOnlineAccess();
  }
  document.querySelectorAll(".btab").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

  const heroOnlineBtn = $("heroOnlineBtn");
  if (heroOnlineBtn) {
    heroOnlineBtn.addEventListener("click", e => {
      e.preventDefault();
      $("booking").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => switchTab("online"), 380);
    });
  }

  /* ══════════════════════════════════════════════════════
     SERVICE DROPDOWNS + DOC PANEL
  ══════════════════════════════════════════════════════ */
  const serviceSelect = $("service"), olService = $("ol-service");
  const docPanel = $("docPanel"), docList = $("docList"), docServiceName = $("docServiceName");
  const docPanelOnline = $("docPanelOnline"), docListOnline = $("docListOnline"), docServiceOnline = $("docServiceNameOnline");

  SERVICES.forEach((svc, i) => {
    [serviceSelect, olService].forEach(sel => {
      const opt = document.createElement("option");
      opt.value = i; opt.textContent = svc.label; sel.appendChild(opt);
    });
  });

  function renderDocItem(str) {
    if (str.includes("|OR|")) {
      const parts = str.split("|OR|");
      const inner = parts.map((p,i) =>
        i < parts.length-1
          ? `<span class="doc-option">${p.trim()}</span><span class="doc-or">or</span>`
          : `<span class="doc-option">${p.trim()}</span>`
      ).join("");
      return `<li class="doc-item-or">${inner}</li>`;
    }
    return `<li>${str}</li>`;
  }

  function showDoc(idx, listEl, nameEl, panelEl) {
    const svc = SERVICES[idx];
    if (!svc) { panelEl.hidden = true; return; }
    nameEl.textContent = svc.label;
    listEl.innerHTML = svc.docs.map(renderDocItem).join("");
    panelEl.hidden = false;
    // Trigger reveal animation
    panelEl.classList.add("visible");
  }

  serviceSelect.addEventListener("change", function() {
    this.value === "" ? docPanel.hidden=true : showDoc(+this.value, docList, docServiceName, docPanel);
  });
  olService.addEventListener("change", function() {
    this.value === "" ? docPanelOnline.hidden=true : showDoc(+this.value, docListOnline, docServiceOnline, docPanelOnline);
    // Update form subject dynamically
    const fsSubject = $("fs-subject");
    if (fsSubject && this.value !== "") fsSubject.value = `Online Application: ${SERVICES[+this.value].label} — Sai Ram Communications`;
  });

  /* ══════════════════════════════════════════════════════
     SLOT RENDERING
  ══════════════════════════════════════════════════════ */
  const visitDateInput = $("visitDate"), slotGrid = $("slotGrid");
  const slotDateLabel = $("slotDateLabel"), slotTimingNote = $("slotTimingNote");
  const selectedSlotInput = $("selectedSlot");

  function renderSlots(date) {
    slotGrid.innerHTML = ""; selectedSlotInput.value = "";
    slotDateLabel.textContent = date ? `— ${fmtDate(date)}` : "";
    if (!date) { slotGrid.innerHTML='<p class="slot-hint">Choose a date to see available slots.</p>'; slotTimingNote.textContent=""; return; }

    slotTimingNote.textContent = isWE(date)
      ? "Weekend: Morning 10 AM–2 PM · Evening 5 PM–10 PM · 2 slots/hour"
      : "Weekday: 5 PM–10 PM · 2 slots/hour · 10 slots/day";

    const all = isWE(date) ? WE : WD;
    const booked = getBooked(date);
    const avail  = all.filter(s => !booked.includes(s.t));

    if (!avail.length) {
      slotGrid.innerHTML='<p class="slot-hint">All slots fully booked for this date. Please choose another.</p>'; return;
    }

    const sess = {};
    avail.forEach(s => { if(!sess[s.s])sess[s.s]=[]; sess[s.s].push(s); });

    if (sess.morning) {
      addLabel("🌅 Morning Session"); addBtns(sess.morning);
    }
    if (sess.morning && sess.evening) {
      addLabel("🍽️ Lunch Break · 2:00 PM – 5:00 PM", true);
      addLabel("🌆 Evening Session");
    }
    if (sess.evening) addBtns(sess.evening);
  }

  function addLabel(text, isLunch=false) {
    const p = document.createElement("p");
    p.className = "session-label" + (isLunch ? " lunch-gap" : "");
    p.textContent = text; slotGrid.appendChild(p);
  }

  function addBtns(slots) {
    const row = document.createElement("div"); row.className = "slot-btn-row";
    slots.forEach(s => {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "slot-btn"; btn.textContent = s.t;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected"); selectedSlotInput.value = s.t;
      });
      row.appendChild(btn);
    });
    slotGrid.appendChild(row);
  }

  if (visitDateInput) {
    const today = new Date().toISOString().split("T")[0];
    visitDateInput.min = today; visitDateInput.value = today;
    renderSlots(today);
    visitDateInput.addEventListener("change", e => renderSlots(e.target.value));
  }

  /* ══════════════════════════════════════════════════════
     OFFLINE BOOKING SUBMIT → WhatsApp
  ══════════════════════════════════════════════════════ */
  const bookingForm  = $("bookingForm"),  confirmCard  = $("confirmCard");
  const waCustomerLink = $("waCustomerLink"), waOwnerLink = $("waOwnerLink");
  const newBookingBtn  = $("newBookingBtn");

  if (bookingForm) {
    bookingForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const name   = $("fullName").value.trim();
      const phone  = $("phone").value.trim();
      const svcIdx = serviceSelect.value;
      const date   = visitDateInput.value;
      const slot   = selectedSlotInput.value;

      if (!name||!phone||svcIdx===""||!date){ alert("Please fill in all the details."); return; }
      if (!/^[0-9]{10}$/.test(phone)){ alert("Enter a valid 10-digit mobile number."); return; }
      if (!slot){ alert("Please select an available time slot."); return; }
      if (getBooked(date).includes(slot)){ alert("That slot was just taken. Please choose another."); renderSlots(date); return; }

      const service  = SERVICES[+svcIdx].label;
      const bookingNo = genNo(date);
      const niceDate  = fmtDate(date);

      addBooked(date, slot, { bookingNo, name, phone, service, date, slot, ts: Date.now() });

      $("confBookingNo").textContent = bookingNo;
      $("confDate").textContent      = niceDate;
      $("confSlot").textContent      = slot;
      $("confService").textContent   = service;

      const custMsg =
        `Sai Ram Communications — Appointment Confirmed ✅\n\nHello ${name},\nYour appointment is successfully booked.\n\n` +
        `📋 Booking No: ${bookingNo}\n🛎️ Service: ${service}\n📅 Date: ${niceDate}\n🕔 Time: ${slot}\n\n` +
        `📍 Sai Ram Communications, S Kolathur, Chennai\n⏰ Please arrive on time with your original documents.\n📞 Queries: 90423 89819`;

      const ownerMsg =
        `New Booking 🔔 — Sai Ram Communications\n\n` +
        `📋 Booking No: ${bookingNo}\n👤 Customer: ${name}\n📞 Phone: ${phone}\n` +
        `🛎️ Service: ${service}\n📅 Date: ${niceDate}\n🕔 Time: ${slot}`;

      waCustomerLink.href = waLink(`91${phone}`, custMsg);
      waOwnerLink.href    = waLink("919042389819", ownerMsg);

      bookingForm.hidden = true; confirmCard.hidden = false;
      confirmCard.scrollIntoView({ behavior:"smooth", block:"center" });
      window.open(waCustomerLink.href, "_blank");
    });
  }

  if (newBookingBtn) {
    newBookingBtn.addEventListener("click", () => {
      bookingForm.reset(); bookingForm.hidden=false; confirmCard.hidden=true; docPanel.hidden=true;
      const today=new Date().toISOString().split("T")[0];
      visitDateInput.value=today; renderSlots(today);
      bookingForm.scrollIntoView({ behavior:"smooth", block:"center" });
    });
  }

  /* ══════════════════════════════════════════════════════
     FILE UPLOAD UI
     selectedFiles[] tracks chosen files visually.
     Before submit, DataTransfer syncs them to the real
     <input name="attachment"> so FormSubmit sends them.
  ══════════════════════════════════════════════════════ */
  let selectedFiles = [];
  const uploadZone    = $("uploadZone");
  const fileInput     = $("fileInput");
  const fileListEl    = $("fileList");
  const uploadTotal   = $("uploadTotal");

  function totalSize(){ return selectedFiles.reduce((a,f) => a+f.size, 0); }

  function renderFileList() {
    fileListEl.innerHTML = "";
    selectedFiles.forEach((file, idx) => {
      const chip = document.createElement("div"); chip.className = "file-chip";
      chip.innerHTML = `
        <span class="file-chip-icon">${fileIcon(file.type)}</span>
        <div class="file-chip-info">
          <span class="file-chip-name">${file.name}</span>
          <span class="file-chip-size">${fmtBytes(file.size)}</span>
        </div>
        <button type="button" class="file-chip-remove" data-i="${idx}">✕</button>`;
      fileListEl.appendChild(chip);
    });
    fileListEl.querySelectorAll(".file-chip-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const chip = btn.closest(".file-chip");
        const idx = +btn.dataset.i;
        if (chip) {
          chip.classList.add("removing");
          chip.addEventListener("animationend", () => {
            selectedFiles.splice(idx, 1);
            renderFileList();
          }, { once: true });
        } else {
          selectedFiles.splice(idx, 1);
          renderFileList();
        }
      });
    });
    // update total
    if (!selectedFiles.length) { uploadTotal.textContent=""; return; }
    const total = totalSize();
    const pct   = Math.min(100, Math.round(total/MAX_BYTES*100));
    uploadTotal.textContent = `Total: ${fmtBytes(total)} / 20 MB (${pct}%)`;
    uploadTotal.classList.toggle("over-limit", total > MAX_BYTES);
  }

  function addFiles(list) {
    for (const file of list) {
      if (!ALLOWED_EXT.test(file.name) && !ALLOWED_MIME.includes(file.type)) {
        alert(`"${file.name}" is not allowed.\nPlease upload PDF, JPEG or PNG files only.`); continue;
      }
      if (totalSize() + file.size > MAX_BYTES) {
        alert(`Adding "${file.name}" would exceed the 20 MB limit. Please remove a file first.`); break;
      }
      if (!selectedFiles.find(f => f.name===file.name && f.size===file.size)) selectedFiles.push(file);
    }
    renderFileList();
  }

  /* Sync selectedFiles array → the real file input via DataTransfer */
  function syncToInput() {
    try {
      const dt = new DataTransfer();
      selectedFiles.forEach(f => dt.items.add(f));
      fileInput.files = dt.files;
    } catch(e) {
      // DataTransfer not available (old browser) — fallback: form submits without files
      console.warn("DataTransfer not supported. Files may not attach.");
    }
  }

  if (uploadZone) {
    uploadZone.addEventListener("click",   ()  => fileInput.click());
    uploadZone.addEventListener("keydown", e   => { if(e.key==="Enter"||e.key===" ") fileInput.click(); });
    uploadZone.addEventListener("dragover",  e => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
    uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
    uploadZone.addEventListener("drop",      e => {
      e.preventDefault(); uploadZone.classList.remove("drag-over");
      addFiles(Array.from(e.dataTransfer.files));
    });
  }
  if (fileInput) fileInput.addEventListener("change", () => { addFiles(Array.from(fileInput.files)); fileInput.value=""; });

  /* ══════════════════════════════════════════════════════
     ONLINE FORM — hidden iframe submission
     The form POSTs to FormSubmit with target="hidden_iframe"
     so the page never navigates away.
     We detect the iframe's load event to show success.
  ══════════════════════════════════════════════════════ */
  const onlineForm      = $("onlineForm");
  const onlineSuccess   = $("onlineSuccess");
  const onlineSubmitBtn = $("onlineSubmitBtn");
  const onlineResetBtn  = $("onlineResetBtn");
  const hiddenIframe    = $("fs-iframe");

  let formJustSubmitted = false;   // flag to ignore iframe's initial load

  if (hiddenIframe) {
    hiddenIframe.addEventListener("load", () => {
      if (!formJustSubmitted) return;   // ignore the first load (empty iframe)
      formJustSubmitted = false;

      // Populate success card
      $("ol-conf-name").textContent    = $("ol-name").value.trim();
      $("ol-conf-service").textContent = olService.options[olService.selectedIndex]?.text || "";
      $("ol-conf-files").textContent   = `${selectedFiles.length} file${selectedFiles.length!==1?"s":""}`;
      $("ol-conf-phone").textContent   = $("ol-phone").value.trim();

      onlineForm.hidden    = true;
      onlineSuccess.hidden = false;
      onlineSuccess.scrollIntoView({ behavior:"smooth", block:"center" });

      onlineSubmitBtn.disabled    = false;
      onlineSubmitBtn.innerHTML   = "Submit Application";
    });
  }

  if (onlineForm) {
    onlineForm.addEventListener("submit", function(e) {
      e.preventDefault();   // validate first, then submit manually

      if (!getSession()) { alert("Please login or register first to apply online."); return; }

      const name   = $("ol-name").value.trim();
      const phone  = $("ol-phone").value.trim();
      const email  = $("ol-email").value.trim();
      const svcIdx = olService.value;

      if (!name||!phone||!email||svcIdx==="") { alert("Please fill in all required fields."); return; }
      if (!/^[0-9]{10}$/.test(phone))          { alert("Enter a valid 10-digit mobile number."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ alert("Enter a valid email address."); return; }
      if (!selectedFiles.length)                { alert("Please upload at least one document before submitting."); return; }
      if (totalSize() > MAX_BYTES)              { alert("Total file size exceeds 20 MB. Please remove some files."); return; }

      // Sync visual file list → actual <input name="attachment">
      syncToInput();

      // Loading state
      onlineSubmitBtn.disabled  = true;
      onlineSubmitBtn.innerHTML = `<span class="btn-spinner"></span> Sending… please wait`;

      formJustSubmitted = true;

      // Submit the form (targets hidden_iframe → no page navigation)
      this.submit();
    });
  }

  if (onlineResetBtn) {
    onlineResetBtn.addEventListener("click", () => {
      onlineForm.reset(); selectedFiles=[]; renderFileList();
      onlineForm.hidden=false; onlineSuccess.hidden=true; docPanelOnline.hidden=true;
      onlineSubmitBtn.disabled=false; onlineSubmitBtn.innerHTML="Submit Application";
      olService.value="";
      onlineForm.scrollIntoView({ behavior:"smooth", block:"center" });
    });
  }

  /* ── Footer year ── */
  $("year").textContent = new Date().getFullYear();

  /* ══════════════════════════════════════════════════════
     LOGIN / REGISTER — client-side demo account system
     NOTE: Accounts are stored in this browser's localStorage
     only (no real server/database). Passwords are hashed
     with SHA-256 before storage, but this is still a
     front-end demo, not a substitute for real server-side
     authentication. Good for prefilling forms / a personal
     "logged in" feel on this static site.
  ══════════════════════════════════════════════════════ */
  const USERS_KEY   = "src_users";
  const SESSION_KEY = "src_session";

  function loadUsers(){ try{ return JSON.parse(localStorage.getItem(USERS_KEY)||"[]"); }catch(e){ return []; } }
  function saveUsers(list){ localStorage.setItem(USERS_KEY, JSON.stringify(list)); }
  function getSession(){ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)||"null"); }catch(e){ return null; } }
  function setSession(user){ localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
  function clearSession(){ localStorage.removeItem(SESSION_KEY); }

  async function hashPassword(str) {
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
    } catch (e) {
      // Fallback for very old browsers without SubtleCrypto
      let h = 0; for (let i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0; }
      return "fb"+h;
    }
  }

  /* ── Toasts ── */
  const toastStack = $("toastStack");
  function showToast(message, type="success", icon) {
    if (!toastStack) return;
    const t = document.createElement("div");
    t.className = "toast" + (type==="error" ? " toast-error" : "");
    t.innerHTML = `<span class="toast-icon">${icon || (type==="error" ? "⚠️" : "✔️")}</span><span>${message}</span>`;
    toastStack.appendChild(t);
    setTimeout(() => {
      t.classList.add("toast-out");
      t.addEventListener("animationend", () => t.remove(), { once:true });
    }, 3200);
  }

  /* ── Header UI sync ── */
  const loginNavBtn      = $("loginNavBtn");
  const userChip         = $("userChip");
  const userAvatar       = $("userAvatar");
  const userNameDisplay  = $("userNameDisplay");
  const logoutBtn        = $("logoutBtn");

  function prefillFromSession(user) {
    if (!user) return;
    const fn = $("fullName"), ph = $("phone");
    if (fn && !fn.value) fn.value = user.name;
    if (ph && !ph.value) ph.value = user.phone;
    const on = $("ol-name"), op = $("ol-phone"), oe = $("ol-email");
    if (on && !on.value) on.value = user.name;
    if (op && !op.value) op.value = user.phone;
    if (oe && !oe.value) oe.value = user.email;
  }

  /* ══════════════════════════════════════════════════════
     APPLY ONLINE — login-required gate
     Only a logged-in user can see/use the online application
     form; everyone else sees a friendly "register to apply
     online" panel instead.
  ══════════════════════════════════════════════════════ */
  const onlineLocked  = $("onlineLocked");
  const onlineContent = $("onlineContent");
  const onlineTabLock = $("onlineTabLock");

  function updateOnlineAccess() {
    const loggedIn = !!getSession();
    if (onlineTabLock) onlineTabLock.hidden = loggedIn;
    if (!onlineLocked || !onlineContent) return;
    onlineLocked.hidden  = loggedIn;
    onlineContent.hidden = !loggedIn;
  }

  function updateAuthUI() {
    const user = getSession();
    if (user) {
      loginNavBtn.hidden = true;
      userChip.hidden = false;
      userAvatar.textContent = (user.name||"?").trim().charAt(0).toUpperCase();
      userNameDisplay.textContent = user.name;
      prefillFromSession(user);
    } else {
      loginNavBtn.hidden = false;
      userChip.hidden = true;
    }
    updateOnlineAccess();
  }
  updateAuthUI();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Clear any auto-filled personal details before wiping the session,
      // so the previous user's name/phone/email don't linger in the forms.
      const fn = $("fullName"), ph = $("phone");
      const on = $("ol-name"), op = $("ol-phone"), oe = $("ol-email");
      [fn, ph, on, op, oe].forEach(el => { if (el) el.value = ""; });

      clearSession();
      updateAuthUI();
      showToast("You've been logged out.", "success", "👋");
    });
  }

  const lockedRegisterBtn  = $("lockedRegisterBtn");
  const lockedLoginBtn     = $("lockedLoginBtn");
  const lockedSwitchOffline = $("lockedSwitchOffline");
  if (lockedRegisterBtn)  lockedRegisterBtn.addEventListener("click", () => openAuthModal("register"));
  if (lockedLoginBtn)     lockedLoginBtn.addEventListener("click", () => openAuthModal("login"));
  if (lockedSwitchOffline) lockedSwitchOffline.addEventListener("click", e => { e.preventDefault(); switchTab("offline"); });

  /* ── Modal open / close ── */
  const authOverlay  = $("authOverlay");
  const authModal    = $("authModal");
  const authClose    = $("authClose");
  const authTabs     = $("authTabs");
  const authTitle    = $("authTitle");
  const authSubtitle = $("authSubtitle");
  const loginForm    = $("loginForm");
  const registerForm = $("registerForm");
  const loginError   = $("loginError");
  const registerError= $("registerError");

  function clearAuthErrors() {
    [loginError, registerError].forEach(el => { el.textContent=""; el.classList.remove("show"); });
  }

  function setAuthTab(which) {
    document.querySelectorAll(".atab").forEach(b => b.classList.toggle("active", b.dataset.atab === which));
    authTabs.classList.toggle("reg-active", which === "register");
    loginForm.classList.toggle("active", which === "login");
    registerForm.classList.toggle("active", which === "register");
    authTitle.textContent    = which === "login" ? "Welcome Back" : "Create Your Account";
    authSubtitle.textContent = which === "login"
      ? "Login to manage your bookings and applications"
      : "Register once — we'll remember your details next time";
    clearAuthErrors();
  }

  function openAuthModal(tab="login") {
    setAuthTab(tab);
    authOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => { const f = tab==="login" ? $("li-identifier") : $("re-name"); f && f.focus(); }, 350);
  }
  function closeAuthModal() {
    authOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (loginNavBtn) loginNavBtn.addEventListener("click", () => openAuthModal("login"));
  if (authClose)   authClose.addEventListener("click", closeAuthModal);
  if (authOverlay) authOverlay.addEventListener("click", e => { if (e.target === authOverlay) closeAuthModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && authOverlay.classList.contains("open")) closeAuthModal(); });

  document.querySelectorAll(".atab").forEach(btn => btn.addEventListener("click", () => setAuthTab(btn.dataset.atab)));
  document.querySelectorAll("[data-switch]").forEach(link => link.addEventListener("click", e => {
    e.preventDefault(); setAuthTab(link.dataset.switch);
  }));

  function shakeModal() {
    authModal.classList.remove("shake");
    void authModal.offsetWidth;
    authModal.classList.add("shake");
  }

  function showAuthError(el, msg) {
    el.textContent = msg; el.classList.add("show"); shakeModal();
  }

  /* ── Password show/hide toggles ── */
  document.querySelectorAll(".pw-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = $(btn.dataset.target);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "🙈" : "👁️";
    });
  });

  /* ── Register ── */
  if (registerForm) {
    registerForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      clearAuthErrors();

      const name    = $("re-name").value.trim();
      const phone   = $("re-phone").value.trim();
      const email   = $("re-email").value.trim().toLowerCase();
      const pass    = $("re-password").value;
      const confirm = $("re-confirm").value;

      if (!name || !phone || !email || !pass || !confirm) { showAuthError(registerError, "Please fill in every field."); return; }
      if (!/^[0-9]{10}$/.test(phone))                       { showAuthError(registerError, "Enter a valid 10-digit mobile number."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))        { showAuthError(registerError, "Enter a valid email address."); return; }
      if (pass.length < 6)                                  { showAuthError(registerError, "Password must be at least 6 characters."); return; }
      if (pass !== confirm)                                 { showAuthError(registerError, "Passwords do not match."); return; }

      const users = loadUsers();
      if (users.some(u => u.phone === phone))               { showAuthError(registerError, "An account with this mobile number already exists."); return; }
      if (users.some(u => u.email === email))               { showAuthError(registerError, "An account with this email already exists."); return; }

      const submitBtn = $("registerSubmitBtn");
      submitBtn.disabled = true; submitBtn.innerHTML = `<span class="btn-spinner"></span> Creating account…`;

      const passwordHash = await hashPassword(pass);
      const user = { id: "u_"+Date.now(), name, phone, email, passwordHash, createdAt: Date.now() };
      users.push(user); saveUsers(users);

      setSession({ name, phone, email });
      updateAuthUI();
      closeAuthModal();
      registerForm.reset();
      submitBtn.disabled = false; submitBtn.innerHTML = "Create Account";
      showToast(`Welcome, ${name.split(" ")[0]}! Your account is ready.`, "success", "🎉");
    });
  }

  /* ── Login ── */
  if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      clearAuthErrors();

      const identifier = $("li-identifier").value.trim().toLowerCase();
      const pass        = $("li-password").value;
      if (!identifier || !pass) { showAuthError(loginError, "Please enter your mobile/email and password."); return; }

      const users = loadUsers();
      const user = users.find(u => u.email === identifier || u.phone === identifier);
      if (!user) { showAuthError(loginError, "No account found with that mobile number or email."); return; }

      const submitBtn = $("loginSubmitBtn");
      submitBtn.disabled = true; submitBtn.innerHTML = `<span class="btn-spinner"></span> Logging in…`;

      const passwordHash = await hashPassword(pass);
      submitBtn.disabled = false; submitBtn.innerHTML = "Login";

      if (passwordHash !== user.passwordHash) { showAuthError(loginError, "Incorrect password. Please try again."); return; }

      setSession({ name: user.name, phone: user.phone, email: user.email });
      updateAuthUI();
      closeAuthModal();
      loginForm.reset();
      showToast(`Welcome back, ${user.name.split(" ")[0]}!`, "success", "👋");
    });
  }

})();
