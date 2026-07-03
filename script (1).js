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
    { label:"New Ration Card",       docs:["Family Head Photo","Aadhaar Cards of All Family Members","Current Gas Bill","Marriage Invitation|OR|Marriage Certificate"] }
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
  const MAX_BYTES     = 20 * 1024 * 1024;
  const ALLOWED_EXT   = /\.(pdf|jpg|jpeg|png)$/i;
  const ALLOWED_MIME  = ["application/pdf","image/jpeg","image/jpg","image/png"];

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
     PAGE LOADER
  ══════════════════════════════════════════════════════ */
  window.addEventListener("load", () => {
    setTimeout(() => {
      const loader = $("pageLoader");
      if (loader) loader.classList.add("done");
    }, 1400);
  });

  /* ══════════════════════════════════════════════════════
     SCROLL REVEAL — IntersectionObserver
  ══════════════════════════════════════════════════════ */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

  /* ══════════════════════════════════════════════════════
     COUNTER ANIMATION for hero stats
  ══════════════════════════════════════════════════════ */
  function animateCount(el, target, duration = 1800) {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(ease * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll(".count-num").forEach(el => {
          animateCount(el, parseInt(el.dataset.target));
        });
        heroObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const statsEl = document.querySelector(".hero-stats");
  if (statsEl) heroObserver.observe(statsEl);

  /* ══════════════════════════════════════════════════════
     HEADER — shadow on scroll
  ══════════════════════════════════════════════════════ */
  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", () => {
    header && header.classList.toggle("scrolled", window.scrollY > 20);
  }, { passive: true });

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
    $("tabOffline").hidden = which !== "offline";
    $("tabOnline").hidden  = which !== "online";
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
        selectedFiles.splice(+btn.dataset.i, 1);
        renderFileList();
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
  const hiddenIframe    = $("hidden_iframe");

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

})();
