/**
 * KAIH 30 Hari — dashboard admin
 * Menampilkan daftar siswa, statistik, dan detail catatan harian dari MongoDB.
 */
(function () {
  "use strict";

  const NS = window.KAIH || {};
  const API = NS.API;
  const UI = NS.UI;

  const SESSION_KEY = "kaih_admin_session_v1";

  const state = {
    token: "",
    admin: null,
    page: 1,
    limit: 20,
    search: "",
    total: 0,
    pages: 1,
    students: [],
    stats: null,
    currentDetailId: null
  };

  const el = {};

  function cache() {
    el.loginView = document.getElementById("loginView");
    el.dashboardView = document.getElementById("dashboardView");
    el.loginForm = document.getElementById("adminLoginForm");
    el.loginError = document.getElementById("adminLoginError");
    el.adminName = document.getElementById("adminName");
    el.logoutBtn = document.getElementById("logoutBtn");
    el.statsGrid = document.getElementById("statsGrid");
    el.searchInput = document.getElementById("searchInput");
    el.tableBody = document.getElementById("studentsTableBody");
    el.tableEmpty = document.getElementById("tableEmpty");
    el.studentCountLabel = document.getElementById("studentCountLabel");
    el.paginationLabel = document.getElementById("paginationLabel");
    el.prevPageBtn = document.getElementById("prevPageBtn");
    el.nextPageBtn = document.getElementById("nextPageBtn");
    el.refreshBtn = document.getElementById("refreshBtn");
    el.exportBtn = document.getElementById("exportBtn");
    el.detailModal = document.getElementById("detailModal");
    el.detailName = document.getElementById("detailName");
    el.detailMeta = document.getElementById("detailMeta");
    el.detailBody = document.getElementById("detailBody");
  }

  function readSession() {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.token ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function saveSession(session) {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      /* Abaikan. */
    }
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      /* Abaikan. */
    }
  }

  function escapeHTML(value) {
    return UI.escapeHTML(value);
  }

  function formatDate(value) {
    if (!value) return "—";
    return UI.formatDateTime(value);
  }

  function formatShortDate(value) {
    if (!value) return "—";
    return UI.formatDate(value);
  }

  function notify(message, type) {
    const titles = {
      success: "Berhasil",
      error: "Gagal",
      warning: "Perhatian",
      info: "Informasi"
    };
    UI.showToast(message, {
      type: type || "info",
      title: titles[type] || "Informasi"
    });
  }

  function showLogin() {
    el.loginView.classList.remove("hidden");
    el.dashboardView.classList.add("hidden");
    if (el.loginForm.username) el.loginForm.username.focus();
  }

  function showDashboard() {
    el.loginView.classList.add("hidden");
    el.dashboardView.classList.remove("hidden");
    el.adminName.textContent =
      (state.admin && (state.admin.name || state.admin.username)) || "Admin";
    loadAll();
  }

  async function handleLogin(event) {
    event.preventDefault();
    el.loginError.classList.add("hidden");
    el.loginError.textContent = "";

    const username = el.loginForm.username.value.trim();
    const password = el.loginForm.password.value;
    const button = el.loginForm.querySelector('button[type="submit"]');
    const label = button.textContent;

    button.disabled = true;
    button.textContent = "Memeriksa...";

    try {
      const data = await API.adminLogin({ username, password });
      state.token = data.token;
      state.admin = data.admin;
      saveSession({ token: data.token, admin: data.admin });
      el.loginForm.reset();
      showDashboard();
    } catch (error) {
      el.loginError.textContent = error.message || "Gagal masuk.";
      el.loginError.classList.remove("hidden");
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  }

  function logout() {
    clearSession();
    state.token = "";
    state.admin = null;
    state.students = [];
    state.stats = null;
    showLogin();
  }

  async function loadAll() {
    if (!state.token) return;

    try {
      const results = await Promise.all([
        API.adminStats(state.token),
        API.adminStudents(state.token, {
          page: state.page,
          limit: state.limit,
          search: state.search
        })
      ]);

      state.stats = results[0];
      state.students = results[1].items || [];
      state.total = results[1].total || 0;
      state.pages = results[1].pages || 1;
      state.page = results[1].page || 1;

      renderStats();
      renderTable();
      renderPagination();
    } catch (error) {
      if (error.status === 401) {
        logout();
        notify("Sesi admin berakhir. Silakan masuk lagi.", "error");
        return;
      }
      notify(error.message || "Data gagal dimuat.", "error");
    }
  }

  function renderStats() {
    const stats = state.stats || {};
    const cards = [
      {
        label: "Total siswa",
        value: stats.totalStudents || 0,
        hint: (stats.activeStudents || 0) + " akun aktif",
        badge: "bg-sky/10 text-sky"
      },
      {
        label: "Aktif hari ini",
        value: stats.activeToday || 0,
        hint: "siswa mengisi hari ini",
        badge: "bg-emerald-50 text-emerald-600"
      },
      {
        label: "Rata-rata konsistensi",
        value: (stats.averageConsistency || 0) + "%",
        hint: "dari seluruh catatan",
        badge: "bg-amber-50 text-amber-600"
      },
      {
        label: "Total catatan harian",
        value: stats.totalLogs || 0,
        hint: "dokumen daily_logs",
        badge: "bg-violet-50 text-violet-600"
      }
    ];

    el.statsGrid.innerHTML = cards
      .map(function (card) {
        return (
          '<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">' +
          '<div class="flex items-start justify-between gap-2">' +
          '<span class="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">' +
          escapeHTML(card.label) +
          "</span>" +
          '<span class="rounded-lg px-2 py-1 text-[10px] font-extrabold ' +
          card.badge +
          '">KAIH</span>' +
          "</div>" +
          '<strong class="mt-2 block text-3xl font-extrabold tracking-tight">' +
          escapeHTML(card.value) +
          "</strong>" +
          '<span class="mt-1 block text-[11px] text-slate-400">' +
          escapeHTML(card.hint) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderTable() {
    const students = state.students;
    el.studentCountLabel.textContent = state.total + " siswa ditemukan";
    el.tableEmpty.classList.toggle("hidden", students.length > 0);

    el.tableBody.innerHTML = students
      .map(function (student) {
        const name = student.name || student.username;
        const initial = name.trim().charAt(0).toUpperCase() || "?";
        const active = student.isActive !== false;
        const consistency = Number(student.consistency) || 0;
        const barColor =
          consistency >= 75
            ? "bg-emerald-500"
            : consistency >= 45
              ? "bg-amber-500"
              : "bg-sky";

        return (
          '<tr class="align-middle transition hover:bg-slate-50/70">' +
          '<td class="px-4 py-3">' +
          '<div class="flex items-center gap-3">' +
          '<span class="grid h-9 w-9 flex-none place-items-center rounded-full bg-navy text-xs font-extrabold text-white">' +
          escapeHTML(initial) +
          "</span>" +
          '<div class="min-w-0">' +
          '<strong class="block truncate text-sm font-bold">' +
          escapeHTML(name) +
          "</strong>" +
          '<span class="block truncate text-[11px] text-slate-400">@' +
          escapeHTML(student.username) +
          (active ? "" : " · nonaktif") +
          "</span>" +
          "</div>" +
          "</div>" +
          "</td>" +
          '<td class="px-4 py-3">' +
          '<span class="block text-xs font-semibold">' +
          escapeHTML(student.studentClass || "—") +
          "</span>" +
          '<span class="block text-[11px] text-slate-400">' +
          escapeHTML(student.school || "—") +
          "</span>" +
          "</td>" +
          '<td class="px-4 py-3">' +
          '<span class="text-sm font-extrabold">' +
          (student.daysFilled || 0) +
          '</span><span class="text-[11px] text-slate-400">/30</span>' +
          "</td>" +
          '<td class="px-4 py-3">' +
          '<div class="flex items-center gap-2">' +
          '<div class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">' +
          '<span class="block h-full rounded-full ' +
          barColor +
          '" style="width:' +
          Math.min(100, consistency) +
          '%"></span>' +
          "</div>" +
          '<span class="text-xs font-bold">' +
          consistency +
          "%</span>" +
          "</div>" +
          "</td>" +
          '<td class="px-4 py-3 text-xs text-slate-500">' +
          escapeHTML(formatDate(student.lastActivityAt)) +
          "</td>" +
          '<td class="px-4 py-3">' +
          '<div class="flex justify-end gap-1.5">' +
          '<button type="button" data-view="' +
          escapeHTML(student._id) +
          '" class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-sky hover:text-sky">Lihat</button>' +
          '<button type="button" data-toggle="' +
          escapeHTML(student._id) +
          '" data-active="' +
          String(active) +
          '" class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold transition ' +
          (active
            ? "text-amber-600 hover:border-amber-300 hover:bg-amber-50"
            : "text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50") +
          '">' +
          (active ? "Nonaktifkan" : "Aktifkan") +
          "</button>" +
          "</div>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderPagination() {
    const from = state.total === 0 ? 0 : (state.page - 1) * state.limit + 1;
    const to = Math.min(state.total, state.page * state.limit);

    el.paginationLabel.textContent =
      "Menampilkan " + from + "–" + to + " dari " + state.total + " siswa";
    el.prevPageBtn.disabled = state.page <= 1;
    el.nextPageBtn.disabled = state.page >= state.pages;
  }

  async function openDetail(id) {
    state.currentDetailId = id;
    el.detailModal.classList.remove("hidden");
    el.detailName.textContent = "Memuat...";
    el.detailMeta.textContent = "";
    el.detailBody.innerHTML =
      '<div class="py-10 text-center text-sm text-slate-500">Memuat data siswa...</div>';

    try {
      const data = await API.adminStudent(state.token, id);
      renderDetail(data);
    } catch (error) {
      el.detailBody.innerHTML =
        '<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">' +
        escapeHTML(error.message || "Gagal memuat detail.") +
        "</div>";
    }
  }

  function renderDetail(data) {
    const student = data.student || {};
    const stats = data.stats || {};
    const logs = data.logs || [];
    const byDay = {};

    logs.forEach(function (log) {
      byDay[log.day] = log;
    });

    el.detailName.textContent = student.name || student.username || "Siswa";
    el.detailMeta.textContent =
      "@" +
      (student.username || "-") +
      " · " +
      (student.studentClass || "Kelas belum diisi") +
      " · " +
      (student.school || "Sekolah belum diisi");

    const habitNames = [
      "Bangun Pagi",
      "Beribadah",
      "Berolahraga",
      "Makan Sehat",
      "Gemar Belajar",
      "Bermasyarakat",
      "Tidur Cepat"
    ];
    const habitCounts = new Array(7).fill(0);

    logs.forEach(function (log) {
      (log.habits || []).forEach(function (done, index) {
        if (done) habitCounts[index] += 1;
      });
    });

    const daysFilled = stats.daysFilled || logs.length;
    const palette = ["#eef0f4", "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1"];
    const heatCells = [];

    for (let day = 1; day <= 30; day += 1) {
      const log = byDay[day];
      const count = log ? (log.habits || []).filter(Boolean).length : -1;
      const bg = count < 0 ? palette[0] : palette[count];
      const color = count >= 5 ? "#ffffff" : "#0f2942";
      const label =
        "Hari " + day + (count < 0 ? " · belum diisi" : " · " + count + "/7 kebiasaan");

      heatCells.push(
        '<span class="heat-cell" style="background:' +
          bg +
          ";color:" +
          color +
          '" title="' +
          label +
          '">' +
          day +
          "</span>"
      );
    }

    const habitBars = habitNames
      .map(function (name, index) {
        const percent =
          daysFilled > 0 ? Math.round((habitCounts[index] / daysFilled) * 100) : 0;
        return (
          '<div class="mb-3">' +
          '<div class="mb-1 flex items-center justify-between gap-2 text-xs">' +
          '<strong class="font-bold">' +
          escapeHTML(name) +
          "</strong>" +
          '<span class="text-slate-400">' +
          habitCounts[index] +
          "/" +
          daysFilled +
          " hari · " +
          percent +
          "%</span>" +
          "</div>" +
          '<div class="h-2 overflow-hidden rounded-full bg-slate-100">' +
          '<span class="block h-full rounded-full bg-sky" style="width:' +
          percent +
          '%"></span>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    const moodMap = { happy: "Senang", okay: "Biasa saja", tired: "Lelah" };
    const noteRows = logs
      .filter(function (log) {
        return log.note || log.mood;
      })
      .sort(function (a, b) {
        return b.day - a.day;
      })
      .map(function (log) {
        return (
          '<div class="rounded-xl border border-slate-200 p-3">' +
          '<div class="mb-1 flex items-center justify-between gap-2">' +
          '<strong class="text-xs font-extrabold">Hari ' +
          log.day +
          "</strong>" +
          '<span class="text-[11px] text-slate-400">' +
          escapeHTML(moodMap[log.mood] || "—") +
          " · " +
          escapeHTML(formatDate(log.updatedAt)) +
          "</span>" +
          "</div>" +
          '<p class="whitespace-pre-line text-xs leading-relaxed text-slate-600">' +
          escapeHTML(log.note || "Tanpa catatan.") +
          "</p>" +
          "</div>"
        );
      })
      .join("");

    el.detailBody.innerHTML =
      '<div class="grid gap-3 sm:grid-cols-3">' +
      '<div class="rounded-xl bg-slate-50 p-4"><span class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Hari terisi</span><strong class="mt-1 block text-2xl font-extrabold">' +
      (stats.daysFilled || 0) +
      '<span class="text-sm text-slate-400">/30</span></strong></div>' +
      '<div class="rounded-xl bg-slate-50 p-4"><span class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Total kebiasaan</span><strong class="mt-1 block text-2xl font-extrabold">' +
      (stats.totalHabits || 0) +
      "</strong></div>" +
      '<div class="rounded-xl bg-slate-50 p-4"><span class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Konsistensi</span><strong class="mt-1 block text-2xl font-extrabold">' +
      (stats.consistency || 0) +
      "%</strong></div>" +
      "</div>" +
      '<div class="mt-5 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">' +
      "<section>" +
      '<h3 class="mb-2 text-sm font-extrabold">Peta 30 hari</h3>' +
      '<div class="heatmap">' +
      heatCells.join("") +
      "</div>" +
      '<div class="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">' +
      '<span class="flex items-center gap-1"><i class="heat-dot" style="background:#eef0f4"></i>Kosong</span>' +
      '<span class="flex items-center gap-1"><i class="heat-dot" style="background:#bae6fd"></i>1–3</span>' +
      '<span class="flex items-center gap-1"><i class="heat-dot" style="background:#38bdf8"></i>4–6</span>' +
      '<span class="flex items-center gap-1"><i class="heat-dot" style="background:#0369a1"></i>7</span>' +
      "</div>" +
      '<h3 class="mb-2 mt-5 text-sm font-extrabold">Progres per kebiasaan</h3>' +
      habitBars +
      "</section>" +
      "<section>" +
      '<h3 class="mb-2 text-sm font-extrabold">Catatan harian</h3>' +
      '<div class="max-h-[420px] space-y-2 overflow-y-auto pr-1">' +
      (noteRows ||
        '<p class="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">Belum ada catatan.</p>') +
      "</div>" +
      "</section>" +
      "</div>" +
      '<div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">' +
      '<span class="text-[11px] text-slate-400">Dibuat ' +
      escapeHTML(formatShortDate(student.createdAt)) +
      " · Login terakhir " +
      escapeHTML(formatDate(student.lastLoginAt)) +
      "</span>" +
      '<div class="flex gap-2">' +
      '<button type="button" data-detail-toggle="' +
      escapeHTML(student.id) +
      '" data-active="' +
      String(student.isActive !== false) +
      '" class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">' +
      (student.isActive !== false ? "Nonaktifkan akun" : "Aktifkan akun") +
      "</button>" +
      '<button type="button" data-detail-delete="' +
      escapeHTML(student.id) +
      '" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100">Hapus siswa</button>' +
      "</div>" +
      "</div>";
  }

  async function toggleStudent(id, active) {
    try {
      await API.adminUpdateStudent(state.token, id, { isActive: !active });
      notify(!active ? "Akun siswa diaktifkan." : "Akun siswa dinonaktifkan.", "success");
      await loadAll();
      if (state.currentDetailId === id && !el.detailModal.classList.contains("hidden")) {
        openDetail(id);
      }
    } catch (error) {
      notify(error.message || "Gagal mengubah status siswa.", "error");
    }
  }

  async function deleteStudent(id, name) {
    const label = name || "siswa ini";
    if (
      !window.confirm(
        'Hapus "' + label + '" beserta seluruh catatan hariannya? Tindakan ini tidak bisa dibatalkan.'
      )
    ) {
      return;
    }

    try {
      await API.adminDeleteStudent(state.token, id);
      closeDetail();
      notify("Siswa dan seluruh catatannya dihapus.", "success");
      await loadAll();
    } catch (error) {
      notify(error.message || "Gagal menghapus siswa.", "error");
    }
  }

  async function exportCsv() {
    try {
      const response = await fetch("/api/admin/export.csv", {
        headers: { Authorization: "Bearer " + state.token }
      });

      if (!response.ok) {
        throw new Error("Unduhan gagal (" + response.status + ").");
      }

      const blob = await response.blob();
      UI.downloadBlob(blob, "kaih-siswa-" + new Date().toISOString().slice(0, 10) + ".csv");
      notify("Data siswa diunduh sebagai CSV.", "success");
    } catch (error) {
      notify(error.message || "Gagal mengunduh CSV.", "error");
    }
  }

  function closeDetail() {
    el.detailModal.classList.add("hidden");
    state.currentDetailId = null;
  }

  function bind() {
    el.loginForm.addEventListener("submit", handleLogin);

    el.logoutBtn.addEventListener("click", function () {
      if (window.confirm("Keluar dari dashboard admin?")) logout();
    });

    el.refreshBtn.addEventListener("click", loadAll);
    el.exportBtn.addEventListener("click", exportCsv);

    el.prevPageBtn.addEventListener("click", function () {
      if (state.page > 1) {
        state.page -= 1;
        loadAll();
      }
    });

    el.nextPageBtn.addEventListener("click", function () {
      if (state.page < state.pages) {
        state.page += 1;
        loadAll();
      }
    });

    let searchTimer = null;
    el.searchInput.addEventListener("input", function () {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(function () {
        state.search = el.searchInput.value.trim();
        state.page = 1;
        loadAll();
      }, 320);
    });

    el.tableBody.addEventListener("click", function (event) {
      const view = event.target.closest("[data-view]");
      if (view) {
        openDetail(view.getAttribute("data-view"));
        return;
      }

      const toggle = event.target.closest("[data-toggle]");
      if (toggle) {
        toggleStudent(
          toggle.getAttribute("data-toggle"),
          toggle.getAttribute("data-active") === "true"
        );
      }
    });

    el.detailBody.addEventListener("click", function (event) {
      const toggle = event.target.closest("[data-detail-toggle]");
      if (toggle) {
        toggleStudent(
          toggle.getAttribute("data-detail-toggle"),
          toggle.getAttribute("data-active") === "true"
        );
        return;
      }

      const remove = event.target.closest("[data-detail-delete]");
      if (remove) {
        deleteStudent(remove.getAttribute("data-detail-delete"), el.detailName.textContent);
      }
    });

    el.detailModal.addEventListener("click", function (event) {
      if (event.target.closest("[data-detail-close]")) closeDetail();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !el.detailModal.classList.contains("hidden")) {
        closeDetail();
      }
    });
  }

  function init() {
    cache();
    UI.hydrateIcons(document);
    bind();

    const session = readSession();
    if (session) {
      state.token = session.token;
      state.admin = session.admin;
      showDashboard();
    } else {
      showLogin();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
