/**
 * KAIH 30 Hari — logika aplikasi
 * Mengelola state, tracker, media, rekap, dan seluruh interaksi.
 */
(function () {
  "use strict";

  const NS = (window.KAIH = window.KAIH || {});
  const CONFIG = NS.CONFIG;
  const Storage = NS.Storage;
  const UI = NS.UI;
  const TOTAL_DAYS = CONFIG.totalDays;
  const HABIT_COUNT = CONFIG.habits.length;
  const API = NS.API;
  const PENDING_LOGS_KEY = "kaih_pending_logs_v1";

  const state = {
    data: Storage.createDefaultData(),
    activeDay: 1,
    drafts: new Map(),
    activePosterIndex: 0,
    appMode: false,
    session: null,
    authMode: "register",
    remoteReady: false
  };

  const elements = {};
  let dailyProgressChart = null;
  let deferredInstallPrompt = null;

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function pad2(number) {
    return String(number).padStart(2, "0");
  }

  function dayKey(day) {
    return "day_" + day;
  }

  function clampDay(day) {
    return Math.min(TOTAL_DAYS, Math.max(1, Number(day) || 1));
  }

  function cacheElements() {
    elements.navToggle = document.getElementById("navToggle");
    elements.mobileMenu = document.getElementById("mobileMenu");
    elements.habitsGrid = document.getElementById("habitsGrid");
    elements.videoStage = document.getElementById("videoStage");
    elements.videoKicker = document.getElementById("videoKicker");
    elements.videoTitle = document.getElementById("videoTitle");
    elements.videoDescription = document.getElementById("videoDescription");
    elements.videoMeta = document.getElementById("videoMeta");
    elements.videoExternal = document.getElementById("videoExternal");
    elements.posterGallery = document.getElementById("posterGallery");
    elements.activeDayNumber = document.getElementById("activeDayNumber");
    elements.activeWeekLabel = document.getElementById("activeWeekLabel");
    elements.draftHabitCount = document.getElementById("draftHabitCount");
    elements.prevDayBtn = document.getElementById("prevDayBtn");
    elements.nextDayBtn = document.getElementById("nextDayBtn");
    elements.dayScrollPrev = document.getElementById("dayScrollPrev");
    elements.dayScrollNext = document.getElementById("dayScrollNext");
    elements.daySelector = document.getElementById("daySelector");
    elements.trackerDayHeading = document.getElementById("trackerDayHeading");
    elements.checklistProgressText = document.getElementById("checklistProgressText");
    elements.checklistProgressBar = document.getElementById("checklistProgressBar");
    elements.habitChecklist = document.getElementById("habitChecklist");
    elements.dailyNote = document.getElementById("dailyNote");
    elements.noteCount = document.getElementById("noteCount");
    elements.noteDate = document.getElementById("noteDate");
    elements.moodPicker = document.getElementById("moodPicker");
    elements.saveProgress = document.getElementById("saveProgress");
    elements.saveButtonLabel = document.getElementById("saveButtonLabel");
    elements.saveStatus = document.getElementById("saveStatus");
    elements.statDays = document.getElementById("statDays");
    elements.statHabits = document.getElementById("statHabits");
    elements.statConsistency = document.getElementById("statConsistency");
    elements.statDaysCaption = document.getElementById("statDaysCaption");
    elements.statHabitsCaption = document.getElementById("statHabitsCaption");
    elements.statConsistencyCaption = document.getElementById("statConsistencyCaption");
    elements.dailyProgressChart = document.getElementById("dailyProgressChart");
    elements.dailyChartStatus = document.getElementById("dailyChartStatus");
    elements.habitProgress = document.getElementById("habitProgress");
    elements.dayMap = document.getElementById("dayMap");
    elements.dayMapCount = document.getElementById("dayMapCount");
    elements.recapEmptyNote = document.getElementById("recapEmptyNote");
    elements.recapStudentName = document.getElementById("recapStudentName");
    elements.recapSchool = document.getElementById("recapSchool");
    elements.recapDate = document.getElementById("recapDate");
    elements.footerSchool = document.getElementById("footerSchool");
    elements.footerYear = document.getElementById("footerYear");
    elements.exportJsonBtn = document.getElementById("exportJsonBtn");
    elements.printReportBtn = document.getElementById("printReportBtn");
    elements.resetDataBtn = document.getElementById("resetDataBtn");
    elements.confirmResetBtn = document.getElementById("confirmResetBtn");
    elements.habitModal = document.getElementById("habitModal");
    elements.habitModalIcon = document.getElementById("habitModalIcon");
    elements.habitModalKicker = document.getElementById("habitModalKicker");
    elements.habitModalTitle = document.getElementById("habitModalTitle");
    elements.habitModalBody = document.getElementById("habitModalBody");
    elements.resetModal = document.getElementById("resetModal");
    elements.posterLightbox = document.getElementById("posterLightbox");
    elements.lightboxTitle = document.getElementById("lightboxTitle");
    elements.lightboxDesc = document.getElementById("lightboxDesc");
    elements.lightboxImage = document.getElementById("lightboxImage");
    elements.lightboxStage = document.getElementById("lightboxStage");
    elements.downloadPosterBtn = document.getElementById("downloadPosterBtn");
    elements.printReport = document.getElementById("printReport");
    elements.trackerOnboarding = document.getElementById("trackerOnboarding");
    elements.onboardingTooltip = document.getElementById("onboardingTooltip");
    elements.onboardingStep = document.getElementById("onboardingStep");
    elements.onboardingTitle = document.getElementById("onboardingTitle");
    elements.onboardingText = document.getElementById("onboardingText");
    elements.onboardingNext = document.getElementById("onboardingNext");
    elements.onboardingSkip = document.getElementById("onboardingSkip");
    elements.installButtons = Array.from(document.querySelectorAll("[data-install-app]"));
    elements.installModal = document.getElementById("installModal");
    elements.trackerShell = document.querySelector(".tracker-shell");
    elements.trackerLock = document.getElementById("trackerLock");
    elements.openAuthBtn = document.getElementById("openAuthBtn");
    elements.sessionBar = document.getElementById("sessionBar");
    elements.sessionName = document.getElementById("sessionName");
    elements.logoutBtn = document.getElementById("logoutBtn");
    elements.authModal = document.getElementById("authModal");
    elements.authForm = document.getElementById("authForm");
    elements.authTitle = document.getElementById("authTitle");
    elements.authIntro = document.getElementById("authIntro");
    elements.authError = document.getElementById("authError");
    elements.authSubmitBtn = document.getElementById("authSubmitBtn");
    elements.authTabs = Array.from(document.querySelectorAll("[data-auth-tab]"));
    elements.authRegisterOnly = Array.from(
      document.querySelectorAll("[data-auth-register-only]")
    );
  }

  /* ------------------------------------------------------------------
     Profile
     ------------------------------------------------------------------ */
  function renderProfile() {
    const profile = state.data.profile;

    elements.recapStudentName.textContent = profile.studentName || "Siswa KAIH";
    elements.recapSchool.textContent = profile.school || "Sekolah belum diisi";
    elements.footerSchool.textContent = profile.school
      ? "Bersama " + profile.school + "."
      : "Untuk sekolah dan keluarga Indonesia.";
  }

  /* ------------------------------------------------------------------
     Sesi siswa & sinkronisasi server
     ------------------------------------------------------------------ */
  function applySessionUI() {
    const session = state.session;
    const loggedIn = Boolean(session && session.student);
    const name = loggedIn ? session.student.name || session.student.username : "";

    if (elements.trackerShell) {
      elements.trackerShell.classList.toggle("is-locked", !loggedIn);
      Array.from(elements.trackerShell.children).forEach(function (child) {
        if (child === elements.trackerLock) return;
        child.inert = !loggedIn;
      });
    }
    if (elements.sessionBar) {
      elements.sessionBar.hidden = !loggedIn;
    }
    if (elements.sessionName) {
      elements.sessionName.textContent = name || "Siswa KAIH";
    }
    document.body.classList.toggle("is-authenticated", loggedIn);
  }

  function setAuthMode(mode) {
    state.authMode = mode === "login" ? "login" : "register";

    elements.authTabs.forEach(function (tab) {
      const active = tab.getAttribute("data-auth-tab") === state.authMode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    elements.authRegisterOnly.forEach(function (node) {
      node.hidden = state.authMode !== "register";
    });

    if (elements.authTitle) {
      elements.authTitle.textContent =
        state.authMode === "register" ? "Isi identitas dulu" : "Masuk ke akunmu";
    }
    if (elements.authIntro) {
      elements.authIntro.textContent =
        state.authMode === "register"
          ? "Simpan username dan nama siswa sebelum mulai mengisi jurnal 30 hari. Progres akan masuk ke database sekolah."
          : "Masukkan username dan PIN yang kamu buat saat mendaftar untuk melanjutkan jurnalmu.";
    }

    elements.authSubmitBtn.textContent =
      state.authMode === "register" ? "Simpan & Mulai" : "Masuk";
    hideAuthError();
  }

  function hideAuthError() {
    if (!elements.authError) return;
    elements.authError.hidden = true;
    elements.authError.textContent = "";
  }

  function showAuthError(message) {
    if (!elements.authError) return;
    elements.authError.hidden = false;
    elements.authError.textContent = message;
  }

  function openAuth(mode) {
    if (!elements.authModal) return;
    setAuthMode(mode || "register");
    UI.openModal(elements.authModal, elements.openAuthBtn || null);
    window.setTimeout(function () {
      const input = elements.authForm.querySelector('[name="username"]');
      if (input) input.focus({ preventScroll: true });
    }, 80);
  }

  function readPendingLogs() {
    try {
      const raw = window.localStorage.getItem(PENDING_LOGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writePendingLogs(map) {
    try {
      window.localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(map));
    } catch (error) {
      /* Abaikan: antrean sinkronisasi hanya best-effort. */
    }
  }

  function queuePendingLog(day, payload) {
    const map = readPendingLogs();
    map["day_" + day] = payload;
    writePendingLogs(map);
  }

  function removePendingLog(day) {
    const map = readPendingLogs();
    delete map["day_" + day];
    writePendingLogs(map);
  }

  async function flushPendingLogs() {
    const session = state.session;
    if (!session || !session.token) return;

    const map = readPendingLogs();
    const keys = Object.keys(map);
    if (!keys.length) return;

    let synced = 0;
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const day = Number(key.replace("day_", ""));
      if (!day) {
        delete map[key];
        continue;
      }
      try {
        await API.saveLog(session.token, day, map[key]);
        delete map[key];
        synced += 1;
      } catch (error) {
        if (error.status === 401) break;
      }
    }
    writePendingLogs(map);

    if (synced > 0) {
      UI.showToast(synced + " catatan tertunda berhasil dikirim ke server.", {
        title: "Sinkronisasi selesai",
        type: "success"
      });
      await loadRemoteData({ silent: true });
    }
  }

  function mergeRemoteData(payload) {
    if (!payload) return;

    const student = payload.student || {};
    const preservedDrafts = new Map();
    state.drafts.forEach(function (draft, day) {
      if (draft.dirty) preservedDrafts.set(day, draft);
    });

    state.data.profile = {
      school: student.school || "",
      studentName: student.name || "",
      studentClass: student.studentClass || ""
    };
    state.data.logs = payload.logs || {};
    Storage.saveData(state.data);

    state.drafts.clear();
    preservedDrafts.forEach(function (draft, day) {
      state.drafts.set(day, draft);
    });
    state.activeDay = findNextIncompleteDay();
  }

  async function loadRemoteData(options) {
    const settings = options || {};
    const session = state.session;
    if (!session || !session.token) return false;

    try {
      const payload = await API.me(session.token);
      mergeRemoteData(payload);
      session.student = payload.student;
      API.setSession(session);
      state.remoteReady = true;
      applySessionUI();
      renderProfile();
      renderDaySelector();
      renderDayContent();
      renderRecap();
      if (NS.Buddy) NS.Buddy.refresh(state.data);
      return true;
    } catch (error) {
      if (error.status === 401) {
        logoutLocal({ silent: true });
        UI.showToast("Sesi berakhir. Silakan masuk lagi untuk melanjutkan.", {
          title: "Perlu masuk ulang",
          type: "warning"
        });
      } else if (!settings.silent) {
        UI.showToast(
          error.message || "Data server belum bisa dimuat. Data lokal tetap dipakai.",
          { title: "Mode offline", type: "warning", duration: 6200 }
        );
      }
      return false;
    }
  }

  function logoutLocal(options) {
    const settings = options || {};
    API.clearSession();
    state.session = null;
    state.remoteReady = false;
    state.data = Storage.createDefaultData();
    Storage.resetData();
    state.drafts.clear();
    state.activeDay = 1;
    applySessionUI();
    renderProfile();
    renderDaySelector();
    renderDayContent();
    renderRecap();
    if (NS.Buddy) NS.Buddy.refresh(state.data);
    if (!settings.silent) {
      UI.showToast("Kamu sudah keluar. Data di server tetap tersimpan.", {
        title: "Keluar",
        type: "info"
      });
    }
  }

  async function migrateLocalLogs(localData) {
    const session = state.session;
    if (!session || !session.token || !localData || !localData.logs) return;

    const pending = [];
    Object.keys(localData.logs).forEach(function (key) {
      if (state.data.logs[key]) return;
      const log = localData.logs[key];
      if (!log || !Array.isArray(log.habits)) return;
      const day = Number(key.replace("day_", ""));
      if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) return;
      pending.push({
        day,
        payload: {
          habits: log.habits.slice(0, HABIT_COUNT),
          note: log.note || "",
          mood: log.mood || ""
        }
      });
    });

    if (!pending.length) return;

    let moved = 0;
    for (let index = 0; index < pending.length; index += 1) {
      try {
        await API.saveLog(session.token, pending[index].day, pending[index].payload);
        moved += 1;
      } catch (error) {
        /* Lewati hari yang gagal; sisa data lokal tetap aman. */
      }
    }

    if (moved > 0) {
      await loadRemoteData({ silent: true });
      UI.showToast(
        moved + " catatan lama di perangkat ini berhasil dipindahkan ke database.",
        { title: "Data dipindahkan", type: "success", duration: 5200 }
      );
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    hideAuthError();

    const form = elements.authForm;
    const mode = state.authMode;
    const fields = form.elements;
    const username = fields.username.value.trim().toLowerCase();
    const pin = fields.pin.value.trim();
    const name = fields.name.value.trim();
    const studentClass = fields.studentClass.value.trim();
    const school = fields.school.value.trim();
    const localBefore = mode === "register" ? Storage.loadData() : null;

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      showAuthError(
        "Username 3–30 karakter. Gunakan huruf kecil, angka, titik, garis bawah, atau strip."
      );
      fields.username.focus();
      return;
    }
    if (mode === "register" && (name.length < 2 || name.length > 60)) {
      showAuthError("Nama siswa harus 2–60 karakter.");
      fields.name.focus();
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      showAuthError("PIN harus 4–6 angka.");
      fields.pin.focus();
      return;
    }

    const originalLabel = elements.authSubmitBtn.textContent;
    elements.authSubmitBtn.disabled = true;
    elements.authSubmitBtn.textContent = mode === "register" ? "Menyimpan..." : "Memeriksa...";

    try {
      const payload =
        mode === "register"
          ? await API.register({ username, name, studentClass, school, pin })
          : await API.login({ username, pin });

      const session = { token: payload.token, student: payload.student };
      API.setSession(session);
      state.session = session;
      applySessionUI();
      UI.closeModal(elements.authModal);
      form.reset();

      UI.showToast(
        mode === "register"
          ? "Identitas tersimpan. Sekarang kamu bisa mengisi jurnal 30 hari."
          : "Selamat datang kembali, " + (payload.student.name || payload.student.username) + ".",
        {
          title: mode === "register" ? "Siap memulai" : "Berhasil masuk",
          type: "success"
        }
      );

      await loadRemoteData({ silent: true });
      if (localBefore) await migrateLocalLogs(localBefore);
      await flushPendingLogs();

      const tracker = document.getElementById("tracker");
      if (tracker) tracker.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showAuthError(error.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      elements.authSubmitBtn.disabled = false;
      elements.authSubmitBtn.textContent = originalLabel;
    }
  }

  async function syncLogToServer(day, payload) {
    const session = state.session;
    if (!session || !session.token) return;

    try {
      await API.saveLog(session.token, day, payload);
      removePendingLog(day);
      if (state.activeDay === day) {
        elements.saveStatus.classList.remove("is-dirty", "is-idle");
        elements.saveStatus.classList.add("is-saved");
        elements.saveStatus.innerHTML =
          UI.icon("check", 14) + "<span>Tersimpan di server</span>";
      }
    } catch (error) {
      queuePendingLog(day, payload);
      if (error.status === 401) {
        logoutLocal({ silent: true });
        UI.showToast("Sesi berakhir. Silakan masuk lagi untuk menyimpan ke server.", {
          title: "Perlu masuk ulang",
          type: "warning",
          duration: 7000
        });
      } else {
        UI.showToast(
          "Progres tersimpan di perangkat, tetapi belum terkirim ke server. Akan dicoba lagi otomatis.",
          { title: "Menunggu sinkronisasi", type: "warning", duration: 6500 }
        );
      }
    }
  }

  function initAuth() {
    elements.authTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setAuthMode(tab.getAttribute("data-auth-tab"));
      });
    });

    elements.authForm.addEventListener("submit", handleAuthSubmit);

    if (elements.openAuthBtn) {
      elements.openAuthBtn.addEventListener("click", function () {
        openAuth("register");
      });
    }

    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener("click", function () {
        if (window.confirm("Keluar dari akun ini? Data di server tetap tersimpan.")) {
          logoutLocal();
        }
      });
    }

    document.querySelectorAll("[data-open-auth]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        openAuth(button.getAttribute("data-open-auth") || "register");
      });
    });

    window.addEventListener("online", function () {
      if (state.session) {
        loadRemoteData({ silent: true }).then(function () {
          flushPendingLogs();
        });
      }
    });
  }

  /* ------------------------------------------------------------------
     Habits
     ------------------------------------------------------------------ */
  function renderHabits() {
    elements.habitsGrid.innerHTML = CONFIG.habits
      .map(function (habit, index) {
        const revealDelay = index * 70;
        return (
          '<article class="habit-card" data-reveal="up" style="--reveal-delay:' +
          revealDelay +
          'ms;--habit-soft:' +
          habit.soft +
          ";--habit-ink:" +
          habit.ink +
          '" data-habit-id="' +
          habit.id +
          '" tabindex="0" role="button" aria-haspopup="dialog" aria-label="Buka panduan ' +
          UI.escapeHTML(habit.name) +
          '">' +
          '<div class="habit-card-top">' +
          '<span class="habit-number">' +
          habit.number +
          "</span>" +
          '<img class="habit-illustration" src="' +
          UI.escapeHTML(habit.image) +
          '" alt="" aria-hidden="true" loading="lazy">' +
          "</div>" +
          '<div class="habit-card-body">' +
          "<h3>" +
          UI.escapeHTML(habit.name) +
          "</h3>" +
          "<p>" +
          UI.escapeHTML(habit.short) +
          "</p>" +
          "</div>" +
          '<span class="habit-card-link">Pelajari <span aria-hidden="true">' +
          UI.icon("arrow-right", 16) +
          "</span></span>" +
          "</article>"
        );
      })
      .join("");
  }

  function openHabitModal(habitId, trigger) {
    const habit = CONFIG.habits.find(function (item) {
      return item.id === habitId;
    });
    if (!habit) return;

    elements.habitModalKicker.textContent = "Kebiasaan " + habit.number;
    elements.habitModalTitle.textContent = habit.name;
    elements.habitModalIcon.innerHTML = UI.icon(habit.icon, 26);
    elements.habitModalIcon.style.backgroundColor = habit.soft;
    elements.habitModalIcon.style.color = habit.ink;

    const examples = habit.examples
      .map(function (example) {
        return (
          '<li><span class="check-list-icon">' +
          UI.icon("check", 14) +
          "</span><span>" +
          UI.escapeHTML(example) +
          "</span></li>"
        );
      })
      .join("");

    elements.habitModalBody.innerHTML =
      '<p class="habit-detail-lead">' +
      UI.escapeHTML(habit.description) +
      "</p>" +
      '<div class="habit-detail-grid">' +
      '<section class="habit-detail-section"><h3>Mengapa penting?</h3><p>' +
      UI.escapeHTML(habit.why) +
      "</p></section>" +
      '<section class="habit-detail-section"><h3>Contoh kegiatan</h3><ul class="check-list">' +
      examples +
      "</ul></section>" +
      "</div>" +
      '<div class="habit-tip"><span class="habit-tip-icon">' +
      UI.icon("sprout", 22) +
      '</span><div><strong>Tips sederhana</strong><p>' +
      UI.escapeHTML(habit.tips) +
      "</p></div></div>" +
      '<div class="habit-modal-actions">' +
      '<button type="button" class="btn btn-yellow" data-modal-close>Baik, mulai lakukan</button>' +
      '<button type="button" class="btn btn-ghost" data-open-tracker="' +
      habit.id +
      '">Buka habit tracker' +
      UI.icon("arrow-right", 16) +
      "</button>" +
      "</div>";

    UI.openModal(elements.habitModal, trigger);
  }

  /* ------------------------------------------------------------------
     Tracker
     ------------------------------------------------------------------ */
  function getSavedLog(day) {
    return state.data.logs[dayKey(day)] || null;
  }

  function getDraft(day) {
    const safeDay = clampDay(day);

    if (!state.drafts.has(safeDay)) {
      const saved = getSavedLog(safeDay);
      state.drafts.set(safeDay, {
        habits: saved ? saved.habits.slice(0, HABIT_COUNT) : new Array(HABIT_COUNT).fill(false),
        note: saved ? saved.note : "",
        mood: saved ? saved.mood : "",
        dirty: false
      });
    }

    return state.drafts.get(safeDay);
  }

  function findNextIncompleteDay() {
    for (let day = 1; day <= TOTAL_DAYS; day += 1) {
      if (!getSavedLog(day)) return day;
    }
    return TOTAL_DAYS;
  }

  function setActiveDay(day, options) {
    const settings = Object.assign(
      {
        scrollSelector: true,
        scrollToTracker: false,
        instant: false
      },
      options || {}
    );

    state.activeDay = clampDay(day);
    renderDaySelector();
    renderDayContent();

    if (settings.scrollSelector) {
      window.requestAnimationFrame(function () {
        scrollActiveDayIntoView(settings.instant ? "auto" : "smooth");
      });
    }

    if (settings.scrollToTracker) {
      const tracker = document.getElementById("tracker");
      if (tracker) {
        tracker.scrollIntoView({
          behavior: settings.instant ? "auto" : "smooth",
          block: "start"
        });
      }
    }
  }

  function renderDaySelector() {
    if (!elements.daySelector) return;

    const output = [];

    for (let day = 1; day <= TOTAL_DAYS; day += 1) {
      const saved = Boolean(getSavedLog(day));
      const active = day === state.activeDay;
      const classes = ["day-button"];

      if (saved) classes.push("is-complete");
      if (active) classes.push("is-active");

      output.push(
        '<button type="button" class="' +
          classes.join(" ") +
          '" data-day="' +
          day +
          '" aria-pressed="' +
          String(active) +
          '" aria-label="Hari ' +
          day +
          (saved ? ", sudah diisi" : ", belum diisi") +
          '">' +
          '<span class="day-number">' +
          pad2(day) +
          "</span>" +
          '<span class="day-word">' +
          (saved ? "Terisi" : "Hari") +
          "</span>" +
          "</button>"
      );
    }

    elements.daySelector.innerHTML = output.join("");
  }

  function scrollActiveDayIntoView(behavior) {
    if (!elements.daySelector) return;
    const button = elements.daySelector.querySelector('[data-day="' + state.activeDay + '"]');
    if (!button) return;

    const left = button.offsetLeft - (elements.daySelector.clientWidth - button.offsetWidth) / 2;
    elements.daySelector.scrollTo({
      left: Math.max(0, left),
      behavior: behavior || "smooth"
    });
  }

  function renderDayContent() {
    const day = state.activeDay;
    const draft = getDraft(day);
    const saved = getSavedLog(day);

    elements.activeDayNumber.textContent = pad2(day);
    elements.activeWeekLabel.textContent = "Minggu " + Math.ceil(day / 7);
    elements.trackerDayHeading.textContent = "Aktivitas hari ke-" + day;
    elements.noteDate.textContent = "Hari " + day;
    elements.prevDayBtn.disabled = day === 1;
    elements.nextDayBtn.disabled = day === TOTAL_DAYS;

    renderChecklist(draft);
    renderMoodPicker(draft.mood);

    if (elements.dailyNote.value !== draft.note) {
      elements.dailyNote.value = draft.note;
    }

    elements.noteCount.textContent = String(draft.note.length);
    elements.noteCount.parentElement.classList.toggle("is-near-limit", draft.note.length > 450);

    updateChecklistProgress(draft);
    updateSaveState(draft, saved);
  }

  function renderChecklist(draft) {
    elements.habitChecklist.innerHTML = CONFIG.habits
      .map(function (habit, index) {
        const checked = Boolean(draft.habits[index]);
        return (
          '<label class="habit-check' +
          (checked ? " is-checked" : "") +
          '" style="--habit-soft:' +
          habit.soft +
          ";--habit-ink:" +
          habit.ink +
          '">' +
          '<input type="checkbox" data-habit-index="' +
          index +
          '"' +
          (checked ? " checked" : "") +
          ' aria-label="' +
          UI.escapeHTML(habit.name) +
          '">' +
          '<span class="habit-check-icon">' +
          UI.icon(habit.icon, 21) +
          "</span>" +
          '<span class="habit-check-copy"><strong>' +
          UI.escapeHTML(habit.name) +
          "</strong><span>" +
          UI.escapeHTML(habit.short) +
          "</span></span>" +
          '<span class="habit-checkbox-ui" aria-hidden="true">' +
          UI.icon("check", 15) +
          "</span>" +
          "</label>"
        );
      })
      .join("");
  }

  function renderMoodPicker(selectedMood) {
    elements.moodPicker.innerHTML = Object.keys(CONFIG.moods)
      .map(function (moodKey) {
        const mood = CONFIG.moods[moodKey];
        const selected = selectedMood === moodKey;
        return (
          '<button type="button" class="mood-button' +
          (selected ? " is-selected" : "") +
          '" data-mood="' +
          moodKey +
          '" aria-pressed="' +
          String(selected) +
          '">' +
          UI.icon(mood.icon, 19) +
          "<span>" +
          UI.escapeHTML(mood.label) +
          "</span></button>"
        );
      })
      .join("");
  }

  function updateChecklistProgress(draft) {
    const count = draft.habits.filter(Boolean).length;
    const percent = (count / HABIT_COUNT) * 100;

    elements.draftHabitCount.textContent = String(count);
    elements.checklistProgressText.textContent = count + " dari " + HABIT_COUNT + " selesai";
    elements.checklistProgressBar.style.width = percent + "%";
  }

  function updateSaveState(draft, saved) {
    const dirty = Boolean(draft.dirty);

    elements.saveProgress.disabled = !dirty;
    elements.saveButtonLabel.textContent = "Simpan Progres Hari Ini";
    elements.saveStatus.classList.remove("is-dirty", "is-saved", "is-idle");

    if (dirty) {
      elements.saveStatus.classList.add("is-dirty");
      elements.saveStatus.textContent = "Ada perubahan yang belum disimpan.";
      return;
    }

    if (saved && saved.updatedAt) {
      elements.saveStatus.classList.add("is-saved");
      elements.saveStatus.innerHTML =
        UI.icon("check", 14) + "<span>Tersimpan " + UI.formatDateTime(saved.updatedAt) + "</span>";
      return;
    }

    elements.saveStatus.classList.add("is-idle");
    elements.saveStatus.textContent = "Belum ada progres tersimpan untuk hari ini.";
  }

  function handleChecklistChange(event) {
    const input = event.target.closest("input[data-habit-index]");
    if (!input) return;

    const index = Number(input.getAttribute("data-habit-index"));
    const draft = getDraft(state.activeDay);

    draft.habits[index] = input.checked;
    draft.dirty = true;

    const row = input.closest(".habit-check");
    if (row) row.classList.toggle("is-checked", input.checked);

    updateChecklistProgress(draft);
    updateSaveState(draft, getSavedLog(state.activeDay));
  }

  function handleNoteInput(event) {
    const draft = getDraft(state.activeDay);
    draft.note = event.target.value.slice(0, Storage.MAX_NOTE_LENGTH);
    draft.dirty = true;

    elements.noteCount.textContent = String(draft.note.length);
    elements.noteCount.parentElement.classList.toggle("is-near-limit", draft.note.length > 450);
    updateSaveState(draft, getSavedLog(state.activeDay));
  }

  function handleMoodPick(event) {
    const button = event.target.closest("[data-mood]");
    if (!button) return;

    const mood = button.getAttribute("data-mood");
    const draft = getDraft(state.activeDay);

    if (draft.mood === mood) return;

    draft.mood = mood;
    draft.dirty = true;
    renderMoodPicker(mood);
    updateSaveState(draft, getSavedLog(state.activeDay));
  }

  function handleSaveProgress() {
    if (!state.session) {
      openAuth("register");
      return;
    }

    const day = state.activeDay;
    const draft = getDraft(day);
    const hasContent = draft.habits.some(Boolean) || draft.note.trim().length > 0 || Boolean(draft.mood);

    if (!hasContent) {
      UI.showToast("Centang minimal satu kebiasaan atau tulis catatan sebelum menyimpan.", {
        title: "Belum ada aktivitas",
        type: "warning"
      });
      const firstCheckbox = elements.habitChecklist.querySelector("input");
      if (firstCheckbox) firstCheckbox.focus();
      return;
    }

    const completed = draft.habits.filter(Boolean).length;
    const cleanedNote = draft.note.trim();
    const updatedAt = new Date().toISOString();

    state.data.logs[dayKey(day)] = {
      habits: draft.habits.slice(0, HABIT_COUNT),
      note: cleanedNote,
      mood: draft.mood,
      updatedAt: updatedAt
    };

    draft.note = cleanedNote;
    draft.dirty = false;

    const persisted = Storage.saveData(state.data);
    const storageError = Storage.consumeError();

    syncLogToServer(day, {
      habits: draft.habits.slice(0, HABIT_COUNT),
      note: cleanedNote,
      mood: draft.mood
    });

    if (elements.dailyNote.value !== cleanedNote) {
      elements.dailyNote.value = cleanedNote;
    }

    renderDaySelector();
    updateChecklistProgress(draft);
    updateSaveState(draft, state.data.logs[dayKey(day)]);
    renderRecap();

    if (NS.Buddy) {
      NS.Buddy.celebrate({
        data: state.data,
        completed,
        day
      });
    }

    if (completed === HABIT_COUNT) {
      UI.launchConfetti();
      UI.showToast("Ketujuh kebiasaan hari ini sudah kamu lakukan. Pertahankan ritmenya, ya.", {
        title: "Hari yang luar biasa!",
        type: "success",
        duration: 6200
      });
    } else if (persisted) {
      UI.showToast("Progres hari " + day + " tersimpan. " + completed + " dari 7 kebiasaan tercatat.", {
        title: "Progres tersimpan",
        type: "success"
      });
    } else {
      UI.showToast(storageError || "Progres tersimpan di tab ini, tetapi penyimpanan browser tidak tersedia.", {
        title: "Perlu diperhatikan",
        type: "warning",
        duration: 6200
      });
    }

    if (!persisted && completed === HABIT_COUNT && storageError) {
      window.setTimeout(function () {
        UI.showToast(storageError, {
          title: "Penyimpanan bermasalah",
          type: "warning",
          duration: 7000
        });
      }, 500);
    }
  }

  /* ------------------------------------------------------------------
     Media — video
     ------------------------------------------------------------------ */
  function currentVideo() {
    return CONFIG.videos[0];
  }

  function renderVideoInfo() {
    const video = currentVideo();
    if (!video) return;

    elements.videoKicker.textContent = video.tag;
    elements.videoTitle.textContent = video.title;
    elements.videoDescription.textContent = video.description;
    elements.videoMeta.innerHTML = [
      video.duration
        ? "<span>" + UI.icon("clock", 14) + UI.escapeHTML(video.duration) + "</span>"
        : "",
      video.channel
        ? "<span>" + UI.icon("user-round", 14) + UI.escapeHTML(video.channel) + "</span>"
        : ""
    ].join("");

    if (video.watchUrl) {
      elements.videoExternal.href = video.watchUrl;
      elements.videoExternal.classList.remove("is-hidden");
    } else {
      elements.videoExternal.removeAttribute("href");
      elements.videoExternal.classList.add("is-hidden");
    }
  }

  function renderVideoCover() {
    const video = currentVideo();
    if (!video) return;

    const durationLabel = video.duration
      ? '<span class="video-cover-duration">' + UI.escapeHTML(video.duration) + "</span>"
      : "";

    elements.videoStage.innerHTML =
      '<button type="button" class="video-cover" data-play-video aria-label="Putar video: ' +
      UI.escapeHTML(video.title) +
      '">' +
      '<img class="video-poster" src="' +
      UI.escapeHTML(video.poster) +
      '" alt="">' +
      '<span class="video-cover-badge">' +
      UI.escapeHTML(video.tag) +
      "</span>" +
      durationLabel +
      '<span class="video-play">' +
      UI.icon("play", 22) +
      "<span>Putar video</span></span>" +
      "</button>";
  }

  function playCurrentVideo() {
    const video = currentVideo();
    if (!video) return;

    elements.videoStage.innerHTML = "";

    if (video.type === "youtube" && video.youtubeId) {
      const iframe = document.createElement("iframe");
      iframe.className = "video-player";
      iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(video.youtubeId) +
        "?autoplay=1&rel=0&modestbranding=1";
      iframe.title = video.title;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      elements.videoStage.appendChild(iframe);
      return;
    }

    if (video.src) {
      const player = document.createElement("video");
      player.className = "video-player";
      player.controls = true;
      player.autoplay = true;
      player.playsInline = true;
      player.poster = video.poster || "";
      player.src = video.src;
      player.setAttribute("aria-label", video.title);
      elements.videoStage.appendChild(player);
      const playPromise = player.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          /* Browser may block autoplay; controls remain available. */
        });
      }
      return;
    }

    renderVideoCover();
    UI.showToast("Sumber video belum tersedia. Periksa konfigurasi video.", {
      title: "Video belum dapat diputar",
      type: "warning"
    });
  }

  /* ------------------------------------------------------------------
     Media — poster
     ------------------------------------------------------------------ */
  function renderPosterGallery() {
    elements.posterGallery.innerHTML = CONFIG.posters
      .map(function (poster, index) {
        return (
          '<article class="poster-card" data-reveal="up" style="--reveal-delay:' +
          index * 80 +
          'ms">' +
          '<button type="button" class="poster-image-button" data-poster-index="' +
          index +
          '" aria-label="Perbesar poster ' +
          UI.escapeHTML(poster.title) +
          '">' +
          '<img src="' +
          UI.escapeHTML(poster.src) +
          '" alt="Poster ' +
          UI.escapeHTML(poster.title) +
          '" loading="lazy">' +
          '<span class="poster-hover" aria-hidden="true"><span>' +
          UI.icon("maximize", 16) +
          "Perbesar</span></span>" +
          '<span class="poster-count">' +
          UI.escapeHTML(poster.number) +
          "</span>" +
          "</button>" +
          '<div class="poster-meta"><span class="poster-index">' +
          UI.escapeHTML(poster.number) +
          "</span><div><span class=\"poster-tag\">" +
          UI.escapeHTML(poster.tag) +
          "</span><h3>" +
          UI.escapeHTML(poster.title) +
          "</h3><p>" +
          UI.escapeHTML(poster.description) +
          "</p></div></div></article>"
        );
      })
      .join("");
  }

  function updateLightbox() {
    const poster = CONFIG.posters[state.activePosterIndex];
    if (!poster) return;

    elements.lightboxTitle.textContent = poster.title;
    elements.lightboxDesc.textContent = poster.description;
    elements.lightboxImage.src = poster.src;
    elements.lightboxImage.alt = "Poster " + poster.title;
  }

  function openPosterLightbox(index, trigger) {
    if (!CONFIG.posters[index]) return;
    state.activePosterIndex = index;
    updateLightbox();
    UI.openModal(elements.posterLightbox, trigger);
  }

  function downloadCurrentPoster() {
    const poster = CONFIG.posters[state.activePosterIndex];
    if (!poster) return;

    const image = new Image();
    image.src = poster.src;

    const loadingToast = UI.showToast("Menyiapkan poster untuk diunduh...", {
      title: "Sebentar, ya",
      type: "info",
      duration: 2600
    });

    const drawPromise = new Promise(function (resolve, reject) {
      if (typeof image.decode === "function") {
        image
          .decode()
          .then(resolve)
          .catch(reject);
      } else {
        image.onload = resolve;
        image.onerror = reject;
      }
    });

    drawPromise
      .then(function () {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        context.fillStyle = "#FFFDF6";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        return new Promise(function (resolve, reject) {
          canvas.toBlob(function (blob) {
            if (blob) resolve(blob);
            else reject(new Error("Canvas export failed"));
          }, "image/png");
        });
      })
      .then(function (blob) {
        UI.downloadBlob(blob, poster.downloadName + ".png");
        if (loadingToast) loadingToast.remove();
        UI.showToast("Poster berhasil diunduh sebagai PNG.", {
          title: "Unduhan siap",
          type: "success"
        });
      })
      .catch(function () {
        if (loadingToast) loadingToast.remove();
        const fallback = document.createElement("a");
        fallback.href = poster.src;
        fallback.download = poster.downloadName + ".jpg";
        document.body.appendChild(fallback);
        fallback.click();
        fallback.remove();
        UI.showToast("Poster diunduh dalam format JPG.", {
          title: "Unduhan siap",
          type: "info"
        });
      });
  }

  /* ------------------------------------------------------------------
     Recap
     ------------------------------------------------------------------ */
  function computeStats() {
    const logs = Object.keys(state.data.logs).map(function (key) {
      return state.data.logs[key];
    });

    const daysFilled = logs.length;
    const totalHabits = logs.reduce(function (total, log) {
      return total + log.habits.filter(Boolean).length;
    }, 0);
    const opportunities = daysFilled * HABIT_COUNT;
    const consistency = opportunities > 0 ? Math.round((totalHabits / opportunities) * 100) : 0;

    return {
      daysFilled,
      totalHabits,
      opportunities,
      consistency
    };
  }

  function renderStatistics(stats) {
    elements.statDays.textContent = String(stats.daysFilled);
    elements.statHabits.textContent = String(stats.totalHabits);
    elements.statConsistency.textContent = stats.consistency + "%";

    if (stats.daysFilled === 0) {
      elements.statDaysCaption.textContent = "Mulai dari hari pertamamu.";
    } else if (stats.daysFilled === TOTAL_DAYS) {
      elements.statDaysCaption.textContent = "Perjalanan 30 hari selesai.";
    } else {
      elements.statDaysCaption.textContent =
        TOTAL_DAYS - stats.daysFilled + " hari lagi menuju garis akhir.";
    }

    elements.statHabitsCaption.textContent =
      "Dari " + stats.opportunities + " kesempatan harian.";

    if (stats.consistency === 0) {
      elements.statConsistencyCaption.textContent = "Belum ada hari yang dinilai.";
    } else if (stats.consistency === 100) {
      elements.statConsistencyCaption.textContent = "Semua kesempatan terisi. Luar biasa!";
    } else if (stats.consistency >= 75) {
      elements.statConsistencyCaption.textContent = "Konsistensi yang kuat, terus jaga ritmenya.";
    } else if (stats.consistency >= 45) {
      elements.statConsistencyCaption.textContent = "Konsistensimu mulai terbentuk.";
    } else {
      elements.statConsistencyCaption.textContent = "Terus bertumbuh, sedikit demi sedikit.";
    }
  }

  function renderHabitProgress() {
    const stats = computeStats();
    const denominator = stats.daysFilled;

    elements.habitProgress.innerHTML = CONFIG.habits
      .map(function (habit, index) {
        let count = 0;
        Object.keys(state.data.logs).forEach(function (key) {
          if (state.data.logs[key].habits[index]) count += 1;
        });

        const percent = denominator > 0 ? Math.round((count / denominator) * 100) : 0;

        return (
          '<div class="habit-progress-row" style="--bar-color:' +
          habit.ink +
          '">' +
          '<span class="hp-icon" style="background:' +
          habit.soft +
          ";color:" +
          habit.ink +
          '">' +
          UI.icon(habit.icon, 18) +
          "</span>" +
          '<div class="hp-main">' +
          '<div class="hp-label"><strong>' +
          UI.escapeHTML(habit.name) +
          "</strong><span>" +
          count +
          " dari " +
          denominator +
          " hari</span></div>" +
          '<div class="hp-track" aria-hidden="true"><span style="width:' +
          percent +
          '%"></span></div>' +
          "</div>" +
          '<span class="hp-percent">' +
          percent +
          "%</span></div>"
        );
      })
      .join("");
  }

  function renderDayMap() {
    const output = [];
    let filledCount = 0;

    for (let day = 1; day <= TOTAL_DAYS; day += 1) {
      const filled = Boolean(getSavedLog(day));
      if (filled) filledCount += 1;
      output.push(
        '<button type="button" class="map-day' +
          (filled ? " is-filled" : "") +
          '" data-map-day="' +
          day +
          '" aria-label="Hari ' +
          day +
          (filled ? ", sudah diisi" : ", belum diisi") +
          '" title="Hari ' +
          day +
          (filled ? " · sudah diisi" : " · belum diisi") +
          '">' +
          day +
          "</button>"
      );
    }

    elements.dayMap.innerHTML = output.join("");
    elements.dayMapCount.textContent = filledCount + " / " + TOTAL_DAYS;

    if (filledCount === 0) {
      elements.recapEmptyNote.textContent = "Hari yang sudah disimpan akan muncul di sini.";
    } else if (filledCount === TOTAL_DAYS) {
      elements.recapEmptyNote.textContent = "Semua 30 hari sudah tersimpan. Perjalanan yang hebat.";
    } else {
      elements.recapEmptyNote.textContent =
        filledCount + " hari sudah tercatat. Ketuk salah satu hari untuk membuka catatannya.";
    }
  }

  function renderDailyProgressChart() {
    if (typeof window.Chart !== "function") {
      elements.dailyChartStatus.hidden = false;
      console.error("Chart.js is unavailable; the daily progress chart could not be rendered.");
      return;
    }

    elements.dailyChartStatus.hidden = true;

    const values = Array.from({ length: TOTAL_DAYS }, function (_, index) {
      const log = getSavedLog(index + 1);
      return log ? log.habits.filter(Boolean).length : null;
    });

    if (dailyProgressChart) {
      dailyProgressChart.data.datasets[0].data = values;
      dailyProgressChart.update();
      return;
    }

    dailyProgressChart = new window.Chart(elements.dailyProgressChart, {
      type: "line",
      data: {
        labels: Array.from({ length: TOTAL_DAYS }, function (_, index) {
          return "Hari " + (index + 1);
        }),
        datasets: [
          {
            label: "Kebiasaan selesai",
            data: values,
            borderColor: "#8056e8",
            backgroundColor: "rgba(128, 86, 232, 0.12)",
            pointBackgroundColor: "#ffd84d",
            pointBorderColor: "#8056e8",
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            spanGaps: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          intersect: false,
          mode: "index"
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function (items) {
                return "Hari " + (items[0].dataIndex + 1);
              },
              label: function (context) {
                return context.parsed.y + " dari " + HABIT_COUNT + " kebiasaan selesai";
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 0,
              autoSkip: false,
              callback: function (_, index) {
                return index === 0 || (index + 1) % 5 === 0
                  ? "Hari " + (index + 1)
                  : "";
              }
            }
          },
          y: {
            beginAtZero: true,
            max: HABIT_COUNT,
            ticks: {
              stepSize: 1,
              precision: 0
            },
            title: {
              display: true,
              text: "Jumlah kebiasaan"
            }
          }
        }
      }
    });
  }

  function renderRecap() {
    const stats = computeStats();
    const profile = state.data.profile;

    renderStatistics(stats);
    renderDailyProgressChart();
    renderHabitProgress();
    renderDayMap();

    elements.recapStudentName.textContent = profile.studentName || "Siswa KAIH";
    elements.recapSchool.textContent = profile.school || "Sekolah belum diisi";
    elements.recapDate.textContent = UI.formatDate(new Date());
  }

  /* ------------------------------------------------------------------
     Export, print, reset
     ------------------------------------------------------------------ */
  function exportJSON() {
    const profile = state.data.profile;
    const payload = {
      app: CONFIG.appName,
      exportedAt: new Date().toISOString(),
      profile: {
        school: profile.school,
        studentName: profile.studentName,
        studentClass: profile.studentClass
      },
      logs: state.data.logs
    };

    const filename =
      "kaih-30hari-" +
      (UI.slugify(profile.studentName) || "siswa") +
      "-" +
      new Date().toISOString().slice(0, 10) +
      ".json";

    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8"
      });
      UI.downloadBlob(blob, filename);
      UI.showToast("Profil dan seluruh catatan progres berhasil diunduh.", {
        title: "JSON siap",
        type: "success"
      });
    } catch (error) {
      UI.showToast("File JSON tidak dapat dibuat di browser ini.", {
        title: "Unduhan gagal",
        type: "error"
      });
    }
  }

  function buildPrintReportHTML() {
    const stats = computeStats();
    const profile = state.data.profile;
    const studentName = profile.studentName || "Belum diisi";
    const schoolName = profile.school || "Belum diisi";
    const studentClass = profile.studentClass || "Belum diisi";
    const dateLabel = UI.formatDate(new Date());

    const habitRows = CONFIG.habits
      .map(function (habit, index) {
        let count = 0;
        Object.keys(state.data.logs).forEach(function (key) {
          if (state.data.logs[key].habits[index]) count += 1;
        });
        const percent = stats.daysFilled > 0 ? Math.round((count / stats.daysFilled) * 100) : 0;
        return (
          "<tr><td>" +
          pad2(index + 1) +
          ". " +
          UI.escapeHTML(habit.name) +
          "</td><td>" +
          count +
          " dari " +
          stats.daysFilled +
          " hari</td><td>" +
          percent +
          "%</td></tr>"
        );
      })
      .join("");

    const logRows = [];
    for (let day = 1; day <= TOTAL_DAYS; day += 1) {
      const log = getSavedLog(day);
      if (!log) continue;
      const completed = log.habits.filter(Boolean).length;
      const moodLabel = log.mood && CONFIG.moods[log.mood] ? CONFIG.moods[log.mood].label : "—";
      logRows.push(
        "<tr><td class=\"print-day\">Hari " +
          day +
          "</td><td>" +
          completed +
          " / " +
          HABIT_COUNT +
          "</td><td>" +
          UI.escapeHTML(moodLabel) +
          '</td><td class="print-note">' +
          (log.note ? UI.escapeHTML(log.note) : "—") +
          "</td></tr>"
      );
    }

    if (!logRows.length) {
      logRows.push(
        '<tr><td colspan="4" class="print-empty">Belum ada catatan harian yang tersimpan.</td></tr>'
      );
    }

    return (
      '<div class="print-doc">' +
      '<header class="print-header">' +
      '<div class="print-brand"><span class="print-mark">K</span><div><strong>KAIH 30 HARI</strong><span>Kebiasaan Anak Indonesia Hebat</span></div></div>' +
      '<div class="print-header-meta"><strong>Laporan Perkembangan</strong><span>Dicetak ' +
      UI.escapeHTML(dateLabel) +
      "</span></div>" +
      "</header>" +
      '<section class="print-identity">' +
      '<div><span>Sekolah</span><strong>' +
      UI.escapeHTML(schoolName) +
      "</strong></div>" +
      '<div><span>Nama siswa</span><strong>' +
      UI.escapeHTML(studentName) +
      "</strong></div>" +
      '<div><span>Kelas</span><strong>' +
      UI.escapeHTML(studentClass) +
      "</strong></div>" +
      "<div><span>Periode program</span><strong>30 hari</strong></div>" +
      "</section>" +
      '<section class="print-section">' +
      "<h2>Ringkasan progres</h2>" +
      '<div class="print-stats">' +
      '<div><span>Hari terisi</span><strong>' +
      stats.daysFilled +
      " / 30</strong></div>" +
      '<div><span>Total kebiasaan</span><strong>' +
      stats.totalHabits +
      "</strong></div>" +
      '<div><span>Konsistensi</span><strong>' +
      stats.consistency +
      "%</strong></div>" +
      "</div>" +
      "</section>" +
      '<section class="print-section">' +
      "<h2>Rekap tujuh kebiasaan</h2>" +
      '<table class="print-table"><thead><tr><th>Kebiasaan</th><th>Frekuensi</th><th>Persentase</th></tr></thead><tbody>' +
      habitRows +
      "</tbody></table>" +
      "</section>" +
      '<section class="print-section">' +
      "<h2>Catatan harian dan mood</h2>" +
      '<table class="print-table print-log-table"><thead><tr><th>Hari</th><th>Kebiasaan</th><th>Mood</th><th>Catatan</th></tr></thead><tbody>' +
      logRows.join("") +
      "</tbody></table>" +
      "</section>" +
      '<footer class="print-footer"><span>Laporan dibuat dari aplikasi KAIH 30 Hari.</span><span>Data disimpan di perangkat siswa.</span></footer>' +
      "</div>"
    );
  }

  function printReport() {
    elements.printReport.innerHTML = buildPrintReportHTML();
    elements.printReport.setAttribute("aria-hidden", "false");
    const openModal = document.querySelector(".modal.is-open, .lightbox.is-open");
    if (openModal) UI.closeModal(openModal, { restoreFocus: false });

    window.setTimeout(function () {
      window.print();
      window.setTimeout(function () {
        elements.printReport.setAttribute("aria-hidden", "true");
      }, 800);
    }, 120);
  }

  async function resetAppData() {
    const session = state.session;

    if (session && session.token) {
      try {
        await API.resetLogs(session.token);
      } catch (error) {
        UI.showToast(error.message || "Data di server belum bisa dihapus. Coba lagi.", {
          title: "Gagal menghapus",
          type: "error",
          duration: 6200
        });
        return;
      }
    }

    Storage.resetData();
    const storageError = Storage.consumeError();
    writePendingLogs({});

    state.data = Storage.createDefaultData();
    if (session && session.student) {
      state.data.profile = {
        school: session.student.school || "",
        studentName: session.student.name || "",
        studentClass: session.student.studentClass || ""
      };
    }
    state.drafts.clear();
    state.activeDay = findNextIncompleteDay();

    renderProfile();
    renderRecap();
    renderDaySelector();
    renderDayContent();
    if (NS.Buddy) NS.Buddy.refresh(state.data, { announce: true });
    UI.closeModal(elements.resetModal);
    UI.showToast(
      "Seluruh catatan harianmu telah dihapus. Identitas tetap tersimpan, jadi kamu bisa memulai dari hari pertama.",
      {
        title: "Data dihapus",
        type: "info",
        duration: 5200
      }
    );

    if (storageError) {
      window.setTimeout(function () {
        UI.showToast(storageError, {
          title: "Penyimpanan bermasalah",
          type: "warning",
          duration: 7000
        });
      }, 500);
    }
  }

  /* ------------------------------------------------------------------
     Navigation
     ------------------------------------------------------------------ */
  function setActiveNav(sectionId) {
    document.querySelectorAll("[data-nav-link]").forEach(function (link) {
      const active = link.getAttribute("data-nav-link") === sectionId;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateActiveNavFromScroll() {
    const sectionIds = ["home", "habits", "media", "tracker", "recap"];
    const marker = window.scrollY + Math.max(120, window.innerHeight * 0.18);
    let current = sectionIds[0];

    sectionIds.forEach(function (id) {
      const section = document.getElementById(id);
      if (section && section.offsetTop <= marker) {
        current = id;
      }
    });

    setActiveNav(current);
  }

  function setMobileMenu(open) {
    if (!elements.mobileMenu || !elements.navToggle) return;

    elements.mobileMenu.hidden = !open;
    elements.mobileMenu.classList.toggle("is-open", open);
    elements.navToggle.setAttribute("aria-expanded", String(open));
    elements.navToggle.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
    elements.navToggle.innerHTML = UI.icon(open ? "x" : "menu", 22);
  }

  function handleStartTracking() {
    if (!state.session) {
      openAuth("register");
      return;
    }

    const nextDay = findNextIncompleteDay();
    setActiveDay(nextDay, { scrollSelector: true });
    setMobileMenu(false);

    if (Object.keys(state.data.logs).length >= TOTAL_DAYS) {
      UI.showToast("Semua 30 hari sudah terisi. Kamu tetap bisa membuka dan memperbarui catatan.", {
        title: "Perjalanan lengkap",
        type: "info",
        duration: 5200
      });
    }
  }

  function openTrackerFromModal() {
    UI.closeModal(elements.habitModal);
    setActiveDay(state.activeDay, { scrollSelector: true });
    const tracker = document.getElementById("tracker");
    if (tracker) {
      tracker.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* ------------------------------------------------------------------
     Event wiring
     ------------------------------------------------------------------ */
  function attachEventListeners() {
    elements.navToggle.addEventListener("click", function () {
      setMobileMenu(elements.mobileMenu.hidden);
    });

    elements.daySelector.addEventListener("click", function (event) {
      const button = event.target.closest("[data-day]");
      if (!button) return;
      setActiveDay(Number(button.getAttribute("data-day")), { scrollSelector: true });
    });

    elements.prevDayBtn.addEventListener("click", function () {
      if (state.activeDay > 1) {
        setActiveDay(state.activeDay - 1, { scrollSelector: true });
      }
    });

    elements.nextDayBtn.addEventListener("click", function () {
      if (state.activeDay < TOTAL_DAYS) {
        setActiveDay(state.activeDay + 1, { scrollSelector: true });
      }
    });

    elements.dayScrollPrev.addEventListener("click", function () {
      elements.daySelector.scrollBy({
        left: -Math.max(240, elements.daySelector.clientWidth * 0.7),
        behavior: "smooth"
      });
    });

    elements.dayScrollNext.addEventListener("click", function () {
      elements.daySelector.scrollBy({
        left: Math.max(240, elements.daySelector.clientWidth * 0.7),
        behavior: "smooth"
      });
    });

    elements.habitChecklist.addEventListener("change", handleChecklistChange);
    elements.dailyNote.addEventListener("input", handleNoteInput);
    elements.moodPicker.addEventListener("click", handleMoodPick);
    elements.saveProgress.addEventListener("click", handleSaveProgress);

    elements.habitsGrid.addEventListener("click", function (event) {
      const card = event.target.closest("[data-habit-id]");
      if (!card) return;
      openHabitModal(card.getAttribute("data-habit-id"), card);
    });

    elements.habitsGrid.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-habit-id]");
      if (!card || event.target !== card) return;
      event.preventDefault();
      openHabitModal(card.getAttribute("data-habit-id"), card);
    });

    elements.videoStage.addEventListener("click", function (event) {
      const playButton = event.target.closest("[data-play-video]");
      if (playButton) {
        playCurrentVideo();
      }
    });

    elements.posterGallery.addEventListener("click", function (event) {
      const button = event.target.closest("[data-poster-index]");
      if (!button) return;
      openPosterLightbox(Number(button.getAttribute("data-poster-index")), button);
    });

    elements.downloadPosterBtn.addEventListener("click", downloadCurrentPoster);

    elements.posterLightbox.addEventListener("click", function (event) {
      if (event.target === elements.posterLightbox || event.target === elements.lightboxStage) {
        UI.closeModal(elements.posterLightbox);
      }
    });

    elements.dayMap.addEventListener("click", function (event) {
      const button = event.target.closest("[data-map-day]");
      if (!button) return;
      setActiveDay(Number(button.getAttribute("data-map-day")), {
        scrollSelector: true,
        scrollToTracker: true
      });
    });

    elements.exportJsonBtn.addEventListener("click", exportJSON);
    elements.printReportBtn.addEventListener("click", printReport);

    elements.resetDataBtn.addEventListener("click", function () {
      UI.openModal(elements.resetModal, elements.resetDataBtn);
    });

    elements.confirmResetBtn.addEventListener("click", resetAppData);

    document.addEventListener("click", function (event) {
      const startLink = event.target.closest("[data-start-tracking]");
      if (startLink) {
        handleStartTracking();
      }

      const openTracker = event.target.closest("[data-open-tracker]");
      if (openTracker) {
        openTrackerFromModal();
        return;
      }

      const mobileLink = event.target.closest("#mobileMenu a");
      if (mobileLink) {
        setMobileMenu(false);
      }

      if (
        elements.mobileMenu.classList.contains("is-open") &&
        !event.target.closest(".site-nav")
      ) {
        setMobileMenu(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && elements.mobileMenu.classList.contains("is-open")) {
        setMobileMenu(false);
      }
    });

    let navFrame = null;
    window.addEventListener(
      "scroll",
      function () {
        if (navFrame) return;
        navFrame = window.requestAnimationFrame(function () {
          updateActiveNavFromScroll();
          navFrame = null;
        });
      },
      { passive: true }
    );

    window.addEventListener("storage", function (event) {
      if (event.key !== Storage.KEY) return;

      const preservedDirtyDrafts = new Map();
      state.drafts.forEach(function (draft, day) {
        if (draft.dirty) preservedDirtyDrafts.set(day, draft);
      });

      state.data = Storage.loadData();
      state.drafts.clear();
      preservedDirtyDrafts.forEach(function (draft, day) {
        state.drafts.set(day, draft);
      });

      renderProfile();
      renderDaySelector();
      renderDayContent();
      renderRecap();
      if (NS.Buddy) NS.Buddy.refresh(state.data);

      UI.showToast("Data diperbarui dari tab lain.", {
        title: "Sinkronisasi",
        type: "info"
      });
    });

    window.addEventListener("beforeunload", function (event) {
      const hasDirtyDraft = Array.from(state.drafts.values()).some(function (draft) {
        return draft.dirty;
      });

      if (hasDirtyDraft) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  }

  /* ------------------------------------------------------------------
     Tracker onboarding
     ------------------------------------------------------------------ */
  const ONBOARDING_KEY = "kaih_tracker_onboarding_v1";
  const onboarding = {
    step: 0,
    active: false,
    highlightTarget: null,
    observer: null
  };

  function getOnboardingSteps() {
    return [
      {
        target: elements.daySelector ? elements.daySelector.closest(".day-picker") : null,
        title: "Pilih hari",
        text: "Pilih hari ke-1 sampai ke-30. Hari yang sudah diisi akan punya tanda hijau.",
        placement: "bottom"
      },
      {
        target: elements.habitChecklist,
        title: "Centang kebiasaan",
        text: "Centang kebiasaan yang kamu lakukan hari ini. Catatan dan mood boleh diisi kalau mau.",
        placement: "top"
      },
      {
        target: elements.saveProgress
          ? elements.saveProgress.closest(".save-area") || elements.saveProgress
          : null,
        title: "Simpan progres",
        text: "Tekan Simpan Progres Hari Ini agar catatanmu tersimpan di perangkat ini.",
        placement: "top"
      }
    ];
  }

  function hasSeenTrackerOnboarding() {
    try {
      return window.localStorage.getItem(ONBOARDING_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function markTrackerOnboardingSeen() {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, "1");
    } catch (error) {
      /* Abaikan: onboarding tetap bisa ditutup untuk sesi ini. */
    }
  }

  function clearOnboardingHighlight() {
    if (onboarding.highlightTarget) {
      onboarding.highlightTarget.classList.remove("onboarding-highlight");
      onboarding.highlightTarget = null;
    }
  }

  function positionOnboardingTooltip(target, placement) {
    if (!elements.onboardingTooltip || !target) return;

    const tooltip = elements.onboardingTooltip;
    const margin = 12;
    const gap = 14;
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top =
      placement === "top"
        ? targetRect.top - tooltipRect.height - gap
        : targetRect.bottom + gap;
    let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;

    const maxLeft = window.innerWidth - tooltipRect.width - margin;
    left = Math.max(margin, Math.min(left, maxLeft));

    if (placement === "top" && top < margin) {
      top = targetRect.bottom + gap;
      placement = "bottom";
    }
    if (placement === "bottom" && top + tooltipRect.height > window.innerHeight - margin) {
      top = Math.max(margin, targetRect.top - tooltipRect.height - gap);
      placement = "top";
    }

    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));

    const arrowX = Math.max(
      20,
      Math.min(targetRect.left + targetRect.width / 2 - left - 7, tooltipRect.width - 34)
    );

    tooltip.style.top = Math.round(top) + "px";
    tooltip.style.left = Math.round(left) + "px";
    tooltip.style.setProperty("--arrow-x", Math.round(arrowX) + "px");
    tooltip.setAttribute("data-placement", placement);
  }

  function getActiveOnboardingSteps() {
    return getOnboardingSteps().filter(function (step) {
      return step.target && step.target.isConnected;
    });
  }

  function repositionOnboardingTooltip() {
    if (!onboarding.active || !onboarding.highlightTarget) return;
    const steps = getActiveOnboardingSteps();
    const step = steps[onboarding.step];
    if (!step) return;
    positionOnboardingTooltip(step.target, step.placement);
  }

  function renderOnboardingStep(shouldScroll) {
    if (!onboarding.active) return;

    const steps = getActiveOnboardingSteps();
    if (!steps.length) {
      closeTrackerOnboarding(false);
      return;
    }

    onboarding.step = Math.max(0, Math.min(onboarding.step, steps.length - 1));
    const step = steps[onboarding.step];

    clearOnboardingHighlight();
    onboarding.highlightTarget = step.target;
    step.target.classList.add("onboarding-highlight");

    elements.onboardingStep.textContent =
      "Langkah " + (onboarding.step + 1) + " dari " + steps.length;
    elements.onboardingTitle.textContent = step.title;
    elements.onboardingText.textContent = step.text;
    elements.onboardingNext.textContent =
      onboarding.step === steps.length - 1 ? "Selesai" : "Lanjut";

    if (shouldScroll !== false) {
      const rect = step.target.getBoundingClientRect();
      const outOfView = rect.top < 90 || rect.bottom > window.innerHeight - 90;
      if (outOfView) {
        step.target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    window.requestAnimationFrame(function () {
      repositionOnboardingTooltip();
      window.requestAnimationFrame(function () {
        repositionOnboardingTooltip();
      });
    });
  }

  function openTrackerOnboarding() {
    if (onboarding.active || hasSeenTrackerOnboarding()) return;
    if (!elements.trackerOnboarding || !elements.onboardingTooltip) return;

    onboarding.active = true;
    onboarding.step = 0;
    elements.trackerOnboarding.classList.add("is-open");
    elements.trackerOnboarding.setAttribute("aria-hidden", "false");
    renderOnboardingStep();
  }

  function closeTrackerOnboarding(markSeen) {
    if (!elements.trackerOnboarding) return;

    onboarding.active = false;
    clearOnboardingHighlight();
    elements.trackerOnboarding.classList.remove("is-open");
    elements.trackerOnboarding.setAttribute("aria-hidden", "true");

    if (markSeen !== false) {
      markTrackerOnboardingSeen();
    }
  }

  function initTrackerOnboarding() {
    if (!state.session) return;
    if (!elements.trackerOnboarding || hasSeenTrackerOnboarding()) return;

    elements.onboardingNext.addEventListener("click", function () {
      const steps = getOnboardingSteps().filter(function (step) {
        return step.target && step.target.isConnected;
      });
      if (onboarding.step >= steps.length - 1) {
        closeTrackerOnboarding(true);
        return;
      }
      onboarding.step += 1;
      renderOnboardingStep();
    });

    elements.onboardingSkip.addEventListener("click", function () {
      closeTrackerOnboarding(true);
    });

    elements.trackerOnboarding.addEventListener("click", function (event) {
      if (event.target && event.target.closest("[data-onboarding-skip]")) {
        closeTrackerOnboarding(true);
      }
    });

    function maybeOpenOnboardingFromScroll() {
      if (onboarding.active || hasSeenTrackerOnboarding()) return;
      const tracker = document.getElementById("tracker");
      if (!tracker) return;
      const rect = tracker.getBoundingClientRect();
      const visible = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      if (visible >= Math.min(160, rect.height * 0.2)) {
        if (onboarding.observer) {
          onboarding.observer.disconnect();
          onboarding.observer = null;
        }
        openTrackerOnboarding();
      }
    }

    window.addEventListener("resize", function () {
      if (onboarding.active) {
        repositionOnboardingTooltip();
        return;
      }
      maybeOpenOnboardingFromScroll();
    });

    window.addEventListener(
      "scroll",
      function () {
        if (onboarding.active) {
          repositionOnboardingTooltip();
          return;
        }
        maybeOpenOnboardingFromScroll();
      },
      { passive: true }
    );

    const tracker = document.getElementById("tracker");
    if (!tracker || !("IntersectionObserver" in window)) {
      openTrackerOnboarding();
      return;
    }

    onboarding.observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (onboarding.observer) {
            onboarding.observer.disconnect();
            onboarding.observer = null;
          }
          openTrackerOnboarding();
        });
      },
      { threshold: 0.2 }
    );

    onboarding.observer.observe(tracker);

    const rect = tracker.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0 && rect.height > 0;
    if (inView) {
      onboarding.observer.disconnect();
      onboarding.observer = null;
      openTrackerOnboarding();
    }
  }

  /* ------------------------------------------------------------------
     App mode & install
     ------------------------------------------------------------------ */
  function isStandaloneMode() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function detectAppMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get("app") === "1" || isStandaloneMode();
  }

  function applyAppMode() {
    state.appMode = detectAppMode();
    if (state.appMode) {
      document.documentElement.classList.add("app-mode");
    } else {
      document.documentElement.classList.remove("app-mode");
    }

    // In app mode, default to tracker when no explicit tracker/recap hash.
    if (state.appMode) {
      const hash = (window.location.hash || "").toLowerCase();
      if (hash !== "#tracker" && hash !== "#recap") {
        history.replaceState(null, "", window.location.pathname + window.location.search + "#tracker");
      }
    }

    document.querySelectorAll('a.brand[href]').forEach(function (link) {
      link.setAttribute("href", state.appMode ? "#tracker" : "#home");
    });
  }

  function updateInstallButtons() {
    const standalone = isStandaloneMode();
    elements.installButtons.forEach(function (btn) {
      btn.hidden = standalone;
    });
  }

  async function handleInstallClick() {
    if (isStandaloneMode()) {
      UI.showToast("KAIH Tracker sudah tersimpan di perangkat ini.", {
        title: "Sudah terpasang",
        type: "success"
      });
      return;
    }

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try {
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          UI.showToast("KAIH Tracker sedang dipasang di perangkatmu.", {
            title: "Memasang aplikasi",
            type: "success"
          });
        }
      } catch (error) {
        /* Abaikan: prompt install bisa dibatalkan atau tidak didukung. */
      }
      deferredInstallPrompt = null;
      updateInstallButtons();
      return;
    }

    if (elements.installModal) {
      UI.openModal(elements.installModal, elements.installButtons[0] || null);
    }
  }

  function initInstall() {
    updateInstallButtons();

    elements.installButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        handleInstallClick();
      });
    });

    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      updateInstallButtons();
    });

    window.addEventListener("appinstalled", function () {
      deferredInstallPrompt = null;
      updateInstallButtons();
      document.documentElement.classList.add("app-mode");
      state.appMode = true;
      UI.showToast("KAIH Tracker sudah tersimpan. Buka dari layar utama untuk mode tracker + riwayat.", {
        title: "Berhasil dipasang",
        type: "success",
        duration: 5200
      });
    });

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = function () {
      updateInstallButtons();
      if (isStandaloneMode()) {
        document.documentElement.classList.add("app-mode");
        state.appMode = true;
      }
    };
    if (displayModeQuery.addEventListener) {
      displayModeQuery.addEventListener("change", onDisplayModeChange);
    } else if (displayModeQuery.addListener) {
      displayModeQuery.addListener(onDisplayModeChange);
    }
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  function init() {
    state.data = Storage.loadData();
    state.session = API.getSession();
    cacheElements();
    applyAppMode();
    UI.initModalSystem();
    UI.hydrateIcons(document);
    initInstall();
    initAuth();

    state.activeDay = findNextIncompleteDay();

    renderHabits();
    renderProfile();
    renderDaySelector();
    renderDayContent();
    renderRecap();
    renderVideoInfo();
    renderVideoCover();
    renderPosterGallery();
    applySessionUI();
    UI.initReveal(document);

    elements.footerYear.textContent = String(new Date().getFullYear());
    elements.recapDate.textContent = UI.formatDate(new Date());

    attachEventListeners();
    setActiveNav("home");
    updateActiveNavFromScroll();
    if (state.appMode) {
      const appHash = (window.location.hash || "").replace("#", "");
      setActiveNav(appHash === "recap" ? "recap" : "tracker");
    }

    window.requestAnimationFrame(function () {
      scrollActiveDayIntoView("auto");
      if (state.appMode) {
        const hash = window.location.hash || "#tracker";
        const target = document.querySelector(hash);
        if (target && (hash === "#tracker" || hash === "#recap")) {
          target.scrollIntoView({ behavior: "auto", block: "start" });
        }
      }
    });

    const storageError = Storage.consumeError();
    if (storageError) {
      window.setTimeout(function () {
        UI.showToast(storageError, {
          title: "Penyimpanan browser",
          type: "warning",
          duration: 7200
        });
      }, 500);
    }

    if (state.session) {
      loadRemoteData({ silent: true }).then(function () {
        flushPendingLogs();
      });
    }

    initTrackerOnboarding();
    document.body.classList.add("is-ready");

    if (window.location.protocol === "file:") {
      window.setTimeout(function () {
        UI.showToast(
          "Buka halaman ini di http://localhost:3000 supaya data bisa tersimpan ke MongoDB. Jangan buka file index.html langsung.",
          { title: "Perlu dibuka lewat server", type: "warning", duration: 12000 }
        );
      }, 900);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
