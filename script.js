/* =========================================================
   Sai Ram Communications — script.js v5
   • Offline booking with WhatsApp confirmation
   • Online application with file upload (PDF/JPEG/PNG ≤ 20 MB)
     Files are emailed to SSRC7010@gmail.com via FormSubmit.co
     (Free service — no backend needed. First submission will
     send a one-time verification email to SSRC7010@gmail.com
     — click Verify, then all future submissions arrive instantly.)
========================================================= */
(function () {
  "use strict";

  /* ══ SERVICES & DOCUMENTS ════════════════════════════════
     To add a new service: add an object with label + docs.
     Use "|OR|" inside a doc string for "either / or" options.
  ════════════════════════════════════════════════════════ */
  const SERVICES = [
    {
      label: "Community Certificate",
      docs: [
        "Applicant Photo",
        "Applicant Aadhaar Card",
        "Parent's Transfer Certificate (TC)|OR|Parent's Community Certificate",
        "Applicant Signature",
        "Mobile Number"
      ]
    },
    {
      label: "Nativity Certificate",
      docs: [
        "Applicant Photo",
        "Applicant Aadhaar Card",
        "Applicant Birth Certificate",
        "Smart Card (Family Card)",
        "Applicant Signature",
        "Mobile Number"
      ]
    },
    {
      label: "Income Certificate",
      docs: [
        "Applicant Photo",
        "Applicant Aadhaar Card",
        "Applicant's PAN Card|OR|Father's PAN Card",
        "Smart Card (Family Card)",
        "Applicant Signature",
        "Mobile Number"
      ]
    },
    {
      label: "OBC Certificate",
      docs: [
        "Applicant Photo",
        "Applicant Aadhaar Card",
        "Income Certificate",
        "Community Certificate",
        "Applicant Signature",
        "Mobile Number"
      ]
    },
    {
      label: "New PAN Card",
      docs: [
        "Applicant Photo",
        "Aadhaar Card",
        "Birth Certificate"
      ]
    },
    {
      label: "PAN Card Correction",
      docs: [
        "Applicant Photo",
        "Aadhaar Card",
        "Birth Certificate|OR|Voter ID|OR|Driving Licence",
        "Old PAN Card",
        "Applicant Signature",
        "Mobile Number"
      ]
    },
    {
      label: "New Voter ID",
      docs: [
        "Applicant Photo",
        "Aadhaar Card"
      ]
    },
    {
      label: "Voter ID Correction",
      docs: [
        "Old Voter ID",
        "Aadhaar Card|OR|Driving Licence|OR|PAN Card"
      ]
    },
    {
      label: "New Ration Card",
      docs: [
        "Family Head Photo",
        "Aadhaar Cards of All Family Members",
        "Current Gas Bill",
        "Marriage Invitation|OR|Marriage Certificate"
      ]
    }
  ];

  /* ══ SLOT CONFIG ═════════════════════════════════════════
     Mon–Fri : 5 PM – 10 PM  | 2 slots/hour | 10/day
     Sat–Sun : 10 AM – 2 PM + 5 PM – 10 PM | 2/hour | 18/day
  ════════════════════════════════════════════════════════ */
  const WEEKDAY_SLOTS = [
    {time:"5:00 PM",session:"evening"},{time:"5:30 PM",session:"evening"},
    {time:"6:00 PM",session:"evening"},{time:"6:30 PM",session:"evening"},
    {time:"7:00 PM",session:"evening"},{time:"7:30 PM",session:"evening"},
    {time:"8:00 PM",session:"evening"},{time:"8:30 PM",session:"evening"},
    {time:"9:00 PM",session:"evening"},{time:"9:30 PM",session:"evening"}
  ];
  const WEEKEND_SLOTS = [
    {time:"10:00 AM",session:"morning"},{time:"10:30 AM",session:"morning"},
    {time:"11:00 AM",session:"morning"},{time:"11:30 AM",session:"morning"},
    {time:"12:00 PM",session:"morning"},{time:"12:30 PM",session:"morning"},
    {time:"1:00 PM", session:"morning"},{time:"1:30 PM", session:"morning"},
    {time:"5:00 PM", session:"evening"},{time:"5:30 PM", session:"evening"},
    {time:"6:00 PM", session:"evening"},{time:"6:30 PM", session:"evening"},
    {time:"7:00 PM", session:"evening"},{time:"7:30 PM", session:"evening"},
    {time:"8:00 PM", session:"evening"},{time:"8:30 PM", session:"evening"},
    {time:"9:00 PM", session:"evening"},{time:"9:30 PM", session:"evening"}
  ];
  const STORAGE_KEY = "src_bookings_v2";
  const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
  const ALLOWED_TYPES = ["application/pdf","image/jpeg","image/png","image/jpg"];
  const ALLOWED_EXT   = /\.(pdf|jpg|jpeg|png)$/i;

  /* ══ STORAGE ════════════════════════════════════════════ */
  function loadBookings(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}catch(e){return{}}}
  function saveBookings(d){localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}
  function getBooked(date){const d=loadBookings();return d[date]?Object.keys(d[date]):[]}
  function addBooking(date,slot,info){const d=loadBookings();if(!d[date])d[date]={};d[date][slot]=info;saveBookings(d)}

  /* ══ UTILS ══════════════════════════════════════════════ */
  function genBookingNo(date){return`SRC-${date.replace(/-/g,"").slice(2)}-${Math.floor(100+Math.random()*900)}`}
  function fmtDate(date){return new Date(date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}
  function isWeekend(date){const d=new Date(date+"T00:00:00").getDay();return d===0||d===6}
  function fmtBytes(b){if(b<1024)return b+" B";if(b<1048576)return(b/1024).toFixed(1)+" KB";return(b/1048576).toFixed(1)+" MB"}

  /* ══ DOM REFS ═══════════════════════════════════════════ */
  const $ = id => document.getElementById(id);
  const visitDateInput   = $("visitDate");
  const slotGrid         = $("slotGrid");
  const slotDateLabel    = $("slotDateLabel");
  const slotTimingNote   = $("slotTimingNote");
  const selectedSlotInput= $("selectedSlot");
  const serviceSelect    = $("service");
  const docPanel         = $("docPanel");
  const docList          = $("docList");
  const docServiceName   = $("docServiceName");
  const bookingForm      = $("bookingForm");
  const confirmCard      = $("confirmCard");
  const waCustomerLink   = $("waCustomerLink");
  const waOwnerLink      = $("waOwnerLink");
  const newBookingBtn    = $("newBookingBtn");
  const olService        = $("ol-service");
  const docPanelOnline   = $("docPanelOnline");
  const docListOnline    = $("docListOnline");
  const docServiceOnline = $("docServiceNameOnline");
  const uploadZone       = $("uploadZone");
  const fileInput        = $("fileInput");
  const fileList         = $("fileList");
  const uploadTotal      = $("uploadTotal");
  const onlineForm       = $("onlineForm");
  const onlineSuccess    = $("onlineSuccess");
  const onlineSubmitBtn  = $("onlineSubmitBtn");
  const onlineResetBtn   = $("onlineResetBtn");
  const navToggle        = $("navToggle");
  const mainNav          = $("mainNav");
  const heroOnlineBtn    = $("heroOnlineBtn");

  /* ══ TAB SWITCHING ══════════════════════════════════════ */
  function switchTab(which) {
    document.querySelectorAll(".btab").forEach(b => b.classList.toggle("active", b.dataset.tab === which));
    $("tabOffline").hidden = (which !== "offline");
    $("tabOnline").hidden  = (which !== "online");
  }
  document.querySelectorAll(".btab").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  if (heroOnlineBtn) {
    heroOnlineBtn.addEventListener("click", e => {
      e.preventDefault();
      document.querySelector("#booking").scrollIntoView({behavior:"smooth"});
      setTimeout(() => switchTab("online"), 400);
    });
  }

  /* ══ POPULATE SERVICE DROPDOWNS ════════════════════════ */
  SERVICES.forEach((svc, i) => {
    [serviceSelect, olService].forEach(sel => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = svc.label;
      sel.appendChild(opt);
    });
  });

  /* ══ DOCUMENT PANEL RENDERER ════════════════════════════ */
  function renderDocItem(docStr) {
    if (docStr.includes("|OR|")) {
      const parts = docStr.split("|OR|");
      const inner = parts.map((p,i) =>
        i < parts.length-1
          ? `<span class="doc-option">${p.trim()}</span><span class="doc-or">or</span>`
          : `<span class="doc-option">${p.trim()}</span>`
      ).join("");
      return `<li class="doc-item-or">${inner}</li>`;
    }
    return `<li>${docStr}</li>`;
  }

  function showDocPanel(index, listEl, nameEl, panelEl) {
    const svc = SERVICES[index];
    if (!svc) { panelEl.hidden = true; return; }
    nameEl.textContent = svc.label;
    listEl.innerHTML = svc.docs.map(renderDocItem).join("");
    panelEl.hidden = false;
  }

  serviceSelect.addEventListener("change", function(){
    if(this.value===""){docPanel.hidden=true;return}
    showDocPanel(parseInt(this.value),docList,docServiceName,docPanel);
  });
  olService.addEventListener("change", function(){
    if(this.value===""){docPanelOnline.hidden=true;return}
    showDocPanel(parseInt(this.value),docListOnline,docServiceOnline,docPanelOnline);
  });

  /* ══ SLOT RENDERING ═════════════════════════════════════ */
  function renderSlots(date) {
    slotGrid.innerHTML = "";
    selectedSlotInput.value = "";
    slotDateLabel.textContent = date ? `— ${fmtDate(date)}` : "";
    if (!date) { slotGrid.innerHTML='<p class="slot-hint">Choose a date to see available slots.</p>'; slotTimingNote.textContent=""; return; }

    slotTimingNote.textContent = isWeekend(date)
      ? "Weekend: Morning 10 AM–2 PM · Evening 5 PM–10 PM · 2 slots/hour"
      : "Weekday: 5 PM–10 PM · 2 slots/hour · 10 slots/day";

    const all     = isWeekend(date) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
    const booked  = getBooked(date);
    const avail   = all.filter(s => !booked.includes(s.time));

    if (!avail.length) {
      slotGrid.innerHTML='<p class="slot-hint">All slots for this date are fully booked. Please choose another date.</p>';
      return;
    }

    const sessions = {};
    avail.forEach(s => { if(!sessions[s.session])sessions[s.session]=[]; sessions[s.session].push(s); });

    if (sessions.morning) {
      const lbl = document.createElement("p"); lbl.className="session-label"; lbl.textContent="🌅 Morning Session"; slotGrid.appendChild(lbl);
      appendSlotBtns(sessions.morning);
    }
    if (sessions.morning && sessions.evening) {
      const gap = document.createElement("p"); gap.className="session-label lunch-gap"; gap.textContent="🍽️ Lunch Break · 2:00 PM – 5:00 PM"; slotGrid.appendChild(gap);
      const lbl = document.createElement("p"); lbl.className="session-label"; lbl.textContent="🌆 Evening Session"; slotGrid.appendChild(lbl);
    }
    if (sessions.evening) appendSlotBtns(sessions.evening);
  }

  function appendSlotBtns(slots) {
    const row = document.createElement("div"); row.className="slot-btn-row";
    slots.forEach(s => {
      const btn = document.createElement("button");
      btn.type="button"; btn.className="slot-btn"; btn.textContent=s.time;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn").forEach(b=>b.classList.remove("selected"));
        btn.classList.add("selected"); selectedSlotInput.value=s.time;
      });
      row.appendChild(btn);
    });
    slotGrid.appendChild(row);
  }

  if (visitDateInput) {
    const today = new Date().toISOString().split("T")[0];
    visitDateInput.min = today;
    visitDateInput.value = today;
    renderSlots(today);
    visitDateInput.addEventListener("change", e => renderSlots(e.target.value));
  }

  /* ══ WHATSAPP LINKS ═════════════════════════════════════ */
  function waLink(phone, msg){ return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`; }

  /* ══ OFFLINE BOOKING SUBMIT ═════════════════════════════ */
  if (bookingForm) {
    bookingForm.addEventListener("submit", function(e){
      e.preventDefault();
      const name    = $("fullName").value.trim();
      const phone   = $("phone").value.trim();
      const svcIdx  = serviceSelect.value;
      const date    = visitDateInput.value;
      const slot    = selectedSlotInput.value;

      if (!name||!phone||svcIdx===""||!date){ alert("Please fill in all the details."); return; }
      if (!/^[0-9]{10}$/.test(phone)){ alert("Enter a valid 10-digit mobile number."); return; }
      if (!slot){ alert("Please select an available time slot."); return; }
      if (getBooked(date).includes(slot)){ alert("That slot was just taken. Please choose another."); renderSlots(date); return; }

      const service  = SERVICES[parseInt(svcIdx)].label;
      const bookingNo= genBookingNo(date);
      const niceDate = fmtDate(date);

      addBooking(date, slot, {bookingNo,name,phone,service,date,slot,createdAt:new Date().toISOString()});

      $("confBookingNo").textContent = bookingNo;
      $("confDate").textContent      = niceDate;
      $("confSlot").textContent      = slot;
      $("confService").textContent   = service;

      const custMsg =
        `Sai Ram Communications — Appointment Confirmed ✅\n\n` +
        `Hello ${name},\nYour appointment is successfully booked.\n\n` +
        `📋 Booking No: ${bookingNo}\n🛎️ Service: ${service}\n📅 Date: ${niceDate}\n🕔 Time: ${slot}\n\n` +
        `📍 Sai Ram Communications, S Kolathur, Chennai\n⏰ Please arrive on time with your documents.\n📞 Queries: 90423 89819`;

      const ownerMsg =
        `New Booking 🔔 — Sai Ram Communications\n\n` +
        `📋 Booking No: ${bookingNo}\n👤 Customer: ${name}\n📞 Phone: ${phone}\n🛎️ Service: ${service}\n📅 Date: ${niceDate}\n🕔 Time: ${slot}`;

      waCustomerLink.href = waLink(`91${phone}`, custMsg);
      waOwnerLink.href    = waLink("919042389819", ownerMsg);

      bookingForm.hidden = true;
      confirmCard.hidden = false;
      confirmCard.scrollIntoView({behavior:"smooth",block:"center"});
      window.open(waCustomerLink.href, "_blank");
    });
  }

  if (newBookingBtn) {
    newBookingBtn.addEventListener("click", ()=>{
      bookingForm.reset(); bookingForm.hidden=false; confirmCard.hidden=true; docPanel.hidden=true;
      const today=new Date().toISOString().split("T")[0]; visitDateInput.value=today; renderSlots(today);
      bookingForm.scrollIntoView({behavior:"smooth",block:"center"});
    });
  }

  /* ══ FILE UPLOAD LOGIC ══════════════════════════════════ */
  let selectedFiles = [];   // array of File objects

  function totalSize(){ return selectedFiles.reduce((s,f)=>s+f.size, 0); }

  function fileIcon(type){
    if(type==="application/pdf") return "📄";
    if(type.startsWith("image/")) return "🖼️";
    return "📎";
  }

  function renderFileList(){
    fileList.innerHTML = "";
    selectedFiles.forEach((file, idx)=>{
      const chip = document.createElement("div"); chip.className="file-chip";
      chip.innerHTML=`
        <span class="file-chip-icon">${fileIcon(file.type)}</span>
        <div class="file-chip-info">
          <span class="file-chip-name">${file.name}</span>
          <span class="file-chip-size">${fmtBytes(file.size)}</span>
        </div>
        <button type="button" class="file-chip-remove" data-idx="${idx}" title="Remove">✕</button>`;
      fileList.appendChild(chip);
    });
    fileList.querySelectorAll(".file-chip-remove").forEach(btn=>{
      btn.addEventListener("click", ()=>{ selectedFiles.splice(parseInt(btn.dataset.idx),1); renderFileList(); updateTotal(); });
    });
    updateTotal();
  }

  function updateTotal(){
    const total = totalSize();
    if (!selectedFiles.length){ uploadTotal.textContent=""; return; }
    const pct = Math.min(100, Math.round(total/MAX_UPLOAD_BYTES*100));
    uploadTotal.textContent = `Total: ${fmtBytes(total)} / 20 MB (${pct}%)`;
    uploadTotal.classList.toggle("over-limit", total > MAX_UPLOAD_BYTES);
  }

  function addFiles(newFiles){
    for (const file of newFiles){
      if (!ALLOWED_EXT.test(file.name) && !ALLOWED_TYPES.includes(file.type)){
        alert(`"${file.name}" is not allowed. Please upload PDF, JPEG or PNG files only.`); continue;
      }
      if (totalSize() + file.size > MAX_UPLOAD_BYTES){
        alert(`Adding "${file.name}" would exceed the 20 MB limit. Please remove a file first.`); break;
      }
      // avoid duplicates
      if (!selectedFiles.find(f=>f.name===file.name && f.size===file.size)) selectedFiles.push(file);
    }
    renderFileList();
  }

  // Click to browse
  if(uploadZone){
    uploadZone.addEventListener("click", ()=>fileInput.click());
    uploadZone.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" ") fileInput.click(); });
  }
  if(fileInput) fileInput.addEventListener("change", ()=>{ addFiles(Array.from(fileInput.files)); fileInput.value=""; });

  // Drag and drop
  if(uploadZone){
    uploadZone.addEventListener("dragover",  e=>{ e.preventDefault(); uploadZone.classList.add("drag-over"); });
    uploadZone.addEventListener("dragleave", ()=>uploadZone.classList.remove("drag-over"));
    uploadZone.addEventListener("drop", e=>{
      e.preventDefault(); uploadZone.classList.remove("drag-over");
      addFiles(Array.from(e.dataTransfer.files));
    });
  }

  /* ══ ONLINE FORM SUBMIT ═════════════════════════════════
     Files are sent to FormSubmit.co which emails them to
     SSRC7010@gmail.com as attachments.
     NOTE: The very first submission triggers a one-time
     verification email to SSRC7010@gmail.com — click the
     Verify button in that email, then all future submissions
     deliver instantly.
  ════════════════════════════════════════════════════════ */
  if (onlineForm) {
    onlineForm.addEventListener("submit", async function(e){
      e.preventDefault();

      const name    = $("ol-name").value.trim();
      const phone   = $("ol-phone").value.trim();
      const email   = $("ol-email").value.trim();
      const svcIdx  = olService.value;
      const notes   = $("ol-notes").value.trim();

      if (!name||!phone||!email||svcIdx===""){
        alert("Please fill in all required fields."); return;
      }
      if (!/^[0-9]{10}$/.test(phone)){
        alert("Enter a valid 10-digit mobile number."); return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        alert("Enter a valid email address."); return;
      }
      if (!selectedFiles.length){
        alert("Please upload at least one document before submitting."); return;
      }
      if (totalSize() > MAX_UPLOAD_BYTES){
        alert("Total file size exceeds 20 MB. Please remove some files."); return;
      }

      const service = SERVICES[parseInt(svcIdx)].label;

      // Build FormData for FormSubmit.co
      const fd = new FormData();
      fd.append("name",    name);
      fd.append("phone",   phone);
      fd.append("email",   email);
      fd.append("service", service);
      fd.append("notes",   notes || "—");
      fd.append("_subject", `Online Application: ${service} — ${name}`);
      fd.append("_template", "table");
      fd.append("_captcha",  "false");
      fd.append("_autoresponse",
        `Hello ${name}, we have received your online application for "${service}" at Sai Ram Communications. ` +
        `We will review your documents and contact you on ${phone} within 24 hours. ` +
        `For urgent queries, call or WhatsApp us at 90423 89819.`
      );

      // Attach each file
      selectedFiles.forEach(file => fd.append("documents", file, file.name));

      // Disable button and show loading state
      onlineSubmitBtn.disabled = true;
      onlineSubmitBtn.textContent = "Sending… please wait";

      try {
        const res = await fetch("https://formsubmit.co/ajax/SSRC7010@gmail.com", {
          method:  "POST",
          headers: { "Accept": "application/json" },
          body:    fd
        });

        const result = await res.json();

        if (res.ok && result.success === "true") {
          // Show success
          $("ol-conf-name").textContent    = name;
          $("ol-conf-service").textContent = service;
          $("ol-conf-files").textContent   = `${selectedFiles.length} file${selectedFiles.length>1?"s":""}`;
          $("ol-conf-phone").textContent   = phone;

          onlineForm.hidden    = true;
          onlineSuccess.hidden = false;
          onlineSuccess.scrollIntoView({behavior:"smooth",block:"center"});
        } else {
          alert("Submission failed: " + (result.message || "Unknown error. Please try again or contact us on WhatsApp."));
          onlineSubmitBtn.disabled = false;
          onlineSubmitBtn.textContent = "Submit Application";
        }
      } catch(err) {
        alert("Could not connect. Please check your internet connection and try again, or contact us directly on WhatsApp at 90423 89819.");
        onlineSubmitBtn.disabled = false;
        onlineSubmitBtn.textContent = "Submit Application";
      }
    });
  }

  if (onlineResetBtn) {
    onlineResetBtn.addEventListener("click", ()=>{
      onlineForm.reset(); selectedFiles=[]; renderFileList();
      onlineForm.hidden=false; onlineSuccess.hidden=true; docPanelOnline.hidden=true;
      onlineSubmitBtn.disabled=false; onlineSubmitBtn.textContent="Submit Application";
      onlineForm.scrollIntoView({behavior:"smooth",block:"center"});
    });
  }

  /* ══ MOBILE NAV ═════════════════════════════════════════ */
  if(navToggle&&mainNav){
    navToggle.addEventListener("click",()=>mainNav.classList.toggle("open"));
    mainNav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>mainNav.classList.remove("open")));
  }

  $("year").textContent = new Date().getFullYear();

})();
