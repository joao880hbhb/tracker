/**
 * KAIH 30 Hari — Teman Pengawal (Habit Buddy)
 * ------------------------------------------------------------------
 * Karakter kecil di sudut layar yang ekspresinya mengikuti streak.
 * Semua data dibaca dari Storage; app.js hanya perlu memanggil
 * KAIH.Buddy.refresh() atau KAIH.Buddy.celebrate() setelah menyimpan.
 */
(function () {
  "use strict";

  const NS = (window.KAIH = window.KAIH || {});
  const CONFIG = NS.CONFIG;
  const Storage = NS.Storage;

  if (!CONFIG || !Storage) return;

  const TOTAL_DAYS = CONFIG.totalDays;
  const HABIT_COUNT = CONFIG.habits.length;
  const HIDDEN_KEY = "kaih_buddy_hidden";
  const GREETED_KEY = "kaih_buddy_greeted";
  const DAY_MS = 24 * 60 * 60 * 1000;

  const TIPS = [
    {
      title: "Mulai dari yang kecil",
      text: "Pilih satu kebiasaan yang paling mudah, lalu centang. Langkah kecil tetap berarti."
    },
    {
      title: "Aku di sini, lho",
      text: "Streak tidak harus sempurna. Yang penting kamu kembali lagi besok."
    },
    {
      title: "Ajak temanmu",
      text: "Ceritakan targetmu ke teman atau keluarga. Semangatnya jadi dua kali lipat."
    },
    {
      title: "Jangan lupa minum",
      text: "Minum air putih dan tarik napas sebentar. Tubuh segar, pikiran lebih fokus."
    },
    {
      title: "Istirahat itu penting",
      text: "Kalau lelah, pilih satu kebiasaan saja hari ini. Besok bisa lebih banyak."
    }
  ];

  const el = {};
  let initialized = false;
  let current = null;
  let bubbleTimer = 0;
  let celebrateToken = 0;
  let pokeCount = 0;
  let tipIndex = 0;

  /* ------------------------------------------------------------------
     Hitung streak dan suasana hati
     ------------------------------------------------------------------ */
  function evaluate(data) {
    const logs = (data && data.logs) || {};
    const days = Object.keys(logs)
      .map(function (key) {
        return Number(String(key).replace("day_", ""));
      })
      .filter(function (day) {
        return Number.isFinite(day) && day > 0;
      })
      .sort(function (a, b) {
        return a - b;
      });

    if (!days.length) {
      return {
        mood: "idle",
        streak: 0,
        daysFilled: 0,
        lastDay: 0,
        habitsDone: 0,
        gap: false,
        stale: false,
        staleDays: 0,
        complete: false
      };
    }

    const lastDay = days[days.length - 1];
    const firstDay = days[0];

    let streak = 0;
    for (let day = lastDay; day >= 1; day -= 1) {
      if (logs["day_" + day]) {
        streak += 1;
      } else {
        break;
      }
    }

    const latestLog = logs["day_" + lastDay] || {};
    const habitsDone = Array.isArray(latestLog.habits)
      ? latestLog.habits.filter(Boolean).length
      : 0;

    let gap = false;
    for (let day = firstDay; day < lastDay; day += 1) {
      if (!logs["day_" + day]) {
        gap = true;
        break;
      }
    }

    // Aktivitas terakhir dipakai untuk mendeteksi "lupa check-in".
    let lastActivity = 0;
    Object.keys(logs).forEach(function (key) {
      const stamp = Date.parse(logs[key] && logs[key].updatedAt);
      if (!Number.isNaN(stamp) && stamp > lastActivity) lastActivity = stamp;
    });
    const staleDays = lastActivity ? Math.floor((Date.now() - lastActivity) / DAY_MS) : 0;
    const stale = staleDays >= 2;
    const complete = days.length >= TOTAL_DAYS;

    let mood;
    if (complete) {
      mood = "cheer";
    } else if (stale || (gap && streak < 2)) {
      mood = "sad";
    } else if (streak >= 3 || habitsDone === HABIT_COUNT) {
      mood = "cheer";
    } else {
      mood = "happy";
    }

    return {
      mood,
      streak,
      daysFilled: days.length,
      lastDay,
      habitsDone,
      gap,
      stale,
      staleDays,
      complete
    };
  }

  function messageFor(stats) {
    if (stats.complete) {
      return {
        title: "30 hari selesai!",
        text: "Perjalananmu lengkap. Aku bangga sekali sama kamu. Lihat rekapnya, yuk!",
        link: "Lihat rekap",
        href: "#recap"
      };
    }

    if (stats.mood === "sad") {
      if (stats.stale) {
        return {
          title: "Aku kangen kamu",
          text:
            "Sudah " +
            stats.staleDays +
            " hari sejak check-in terakhir. Yuk, isi lagi hari ini—mulai dari satu kebiasaan saja.",
          link: "Check-in sekarang",
          href: "#tracker"
        };
      }
      return {
        title: "Ada hari yang terlewat",
        text: "Tidak apa-apa. Yang penting kamu kembali lagi. Aku tetap di sini menemanimu.",
        link: "Isi hari ini",
        href: "#tracker"
      };
    }

    if (stats.mood === "cheer") {
      return {
        title: "Wah, hebat!",
        text:
          "Streak " +
          stats.streak +
          " hari berturut-turut. Pertahankan ritmenya, ya!",
        link: "Lanjut isi hari ini",
        href: "#tracker"
      };
    }

    if (stats.mood === "happy") {
      return {
        title: "Streak " + stats.streak + " hari!",
        text: "Kamu sedang on track. Aku ikut senang melihat progresmu!",
        link: "Lanjut isi hari ini",
        href: "#tracker"
      };
    }

    return {
      title: "Hai, aku Oren!",
      text: "Aku menemani perjalanan 30 harimu. Mulai dari satu kebiasaan kecil hari ini, ya.",
      link: "Mulai sekarang",
      href: "#tracker"
    };
  }

  /* ------------------------------------------------------------------
     Balon percakapan
     ------------------------------------------------------------------ */
  function hideBubble() {
    if (bubbleTimer) {
      window.clearTimeout(bubbleTimer);
      bubbleTimer = 0;
    }
    if (!el.bubble) return;
    el.bubble.classList.remove("is-visible");
    el.bubble.setAttribute("aria-hidden", "true");
  }

  function showBubble(title, text, options) {
    if (!el.bubble) return;

    const settings = Object.assign({ autoHide: 9000, link: null }, options || {});

    el.bubbleTitle.textContent = title;
    el.bubbleText.textContent = text;

    if (settings.link) {
      el.bubbleLink.hidden = false;
      el.bubbleLinkText.textContent = settings.link;
      el.bubbleLink.href = settings.href || "#tracker";
      el.bubbleLink.setAttribute("data-start-tracking", "");
    } else {
      el.bubbleLink.hidden = true;
      el.bubbleLink.removeAttribute("data-start-tracking");
    }

    el.bubble.classList.add("is-visible");
    el.bubble.setAttribute("aria-hidden", "false");

    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = 0;

    if (settings.autoHide > 0) {
      bubbleTimer = window.setTimeout(function () {
        hideBubble();
      }, settings.autoHide);
    }
  }

  /* ------------------------------------------------------------------
     Terapkan suasana hati ke tampilan
     ------------------------------------------------------------------ */
  function updateStreakBadge(stats) {
    if (!el.streak) return;
    const show = stats.streak > 0;
    el.streak.hidden = !show;
    if (show) el.streakValue.textContent = String(stats.streak);
  }

  function updateFigureLabel(stats) {
    if (!el.figure) return;
    const streakText =
      stats.streak > 0
        ? "Streak " + stats.streak + " hari."
        : "Belum ada streak.";
    el.figure.setAttribute(
      "aria-label",
      "Oren, teman pengawalmu. " + streakText + " Klik untuk menyapa."
    );
  }

  function applyStats(stats, options) {
    const settings = Object.assign({ silent: false, announce: false }, options || {});
    current = stats;

    el.root.setAttribute("data-mood", stats.mood);
    updateStreakBadge(stats);
    updateFigureLabel(stats);

    if (settings.announce && !el.root.classList.contains("is-hidden")) {
      const message = messageFor(stats);
      showBubble(message.title, message.text, {
        link: message.link,
        href: message.href
      });
    }

    return stats;
  }

  function refresh(data, options) {
    // Batalkan timer perayaan yang masih berjalan agar tidak mengembalikan
    // suasana hati dari data lama (misalnya setelah reset atau sinkronisasi tab).
    celebrateToken += 1;
    el.root.classList.remove("is-celebrating");
    return applyStats(evaluate(data || Storage.loadData()), options);
  }

  function celebrate(info) {
    const details = info || {};
    const data = details.data || Storage.loadData();
    const stats = evaluate(data);
    current = stats;

    el.root.setAttribute("data-mood", "cheer");
    updateStreakBadge(stats);
    updateFigureLabel(stats);

    el.root.classList.remove("is-celebrating");
    // Paksa browser memulai ulang animasi lompatan.
    void el.root.offsetWidth;
    el.root.classList.add("is-celebrating");

    const completed =
      typeof details.completed === "number" ? details.completed : stats.habitsDone;
    const day = details.day || stats.lastDay;
    const perfect = completed >= HABIT_COUNT;

    showBubble(
      perfect ? "Sempurna hari ini!" : "Progres tersimpan!",
      perfect
        ? "Ketujuh kebiasaan hari ini selesai. Aku ikut bangga sama kamu!"
        : "Hari " +
          day +
          " tersimpan. " +
          completed +
          " dari " +
          HABIT_COUNT +
          " kebiasaan tercatat. Sedikit demi sedikit, kamu hebat!",
      { autoHide: 9000, link: null }
    );

    celebrateToken += 1;
    const token = celebrateToken;

    window.setTimeout(function () {
      if (token !== celebrateToken) return;
      el.root.classList.remove("is-celebrating");
      applyStats(evaluate(data));
    }, 9500);
  }

  /* ------------------------------------------------------------------
     Sembunyikan / panggil kembali
     ------------------------------------------------------------------ */
  function setHidden(hidden) {
    el.root.classList.toggle("is-hidden", hidden);
    document.body.classList.toggle("has-buddy", !hidden);
    if (el.restore) el.restore.hidden = !hidden;
    if (hidden) hideBubble();

    try {
      window.sessionStorage.setItem(HIDDEN_KEY, hidden ? "1" : "0");
    } catch (error) {
      /* sessionStorage bisa diblokir; sembunyikan tetap berfungsi di tab ini. */
    }
  }

  function isHidden() {
    try {
      return window.sessionStorage.getItem(HIDDEN_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  /* ------------------------------------------------------------------
     Interaksi
     ------------------------------------------------------------------ */
  function handlePoke() {
    if (!current) return;

    el.root.classList.remove("is-poked");
    void el.root.offsetWidth;
    el.root.classList.add("is-poked");
    window.setTimeout(function () {
      el.root.classList.remove("is-poked");
    }, 700);

    if (pokeCount === 0) {
      const message = messageFor(current);
      showBubble(message.title, message.text, {
        link: message.link,
        href: message.href
      });
    } else {
      const tip = TIPS[tipIndex % TIPS.length];
      tipIndex += 1;
      showBubble(tip.title, tip.text, { autoHide: 8000, link: null });
    }

    pokeCount += 1;
  }

  function bindEvents() {
    el.figure.addEventListener("click", handlePoke);

    el.bubbleClose.addEventListener("click", hideBubble);

    el.hide.addEventListener("click", function () {
      setHidden(true);
    });

    el.restore.addEventListener("click", function () {
      setHidden(false);
      window.setTimeout(function () {
        if (!current) return;
        const message = messageFor(current);
        showBubble(message.title, message.text, {
          link: message.link,
          href: message.href
        });
      }, 260);
    });

    el.bubble.addEventListener("mouseenter", function () {
      if (bubbleTimer) {
        window.clearTimeout(bubbleTimer);
        bubbleTimer = 0;
      }
    });
  }

  function maybeGreet() {
    let greeted = false;
    try {
      greeted = window.sessionStorage.getItem(GREETED_KEY) === "1";
    } catch (error) {
      greeted = false;
    }
    if (greeted) return;

    try {
      window.sessionStorage.setItem(GREETED_KEY, "1");
    } catch (error) {
      /* abaikan */
    }

    window.setTimeout(function () {
      if (el.root.classList.contains("is-hidden") || !current) return;
      // Jangan menimpa balon yang sedang tampil (misalnya setelah menyimpan).
      if (el.bubble.classList.contains("is-visible")) return;
      const message = messageFor(current);
      showBubble(message.title, message.text, {
        autoHide: 11000,
        link: message.link,
        href: message.href
      });
    }, 1400);
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  function init() {
    if (initialized) return;
    initialized = true;

    el.root = document.getElementById("habitBuddy");
    if (!el.root) return;

    el.bubble = document.getElementById("buddyBubble");
    el.bubbleClose = document.getElementById("buddyBubbleClose");
    el.bubbleTitle = document.getElementById("buddyBubbleTitle");
    el.bubbleText = document.getElementById("buddyBubbleText");
    el.bubbleLink = document.getElementById("buddyBubbleLink");
    el.bubbleLinkText = document.getElementById("buddyBubbleLinkText");
    el.streak = document.getElementById("buddyStreak");
    el.streakValue = document.getElementById("buddyStreakValue");
    el.figure = document.getElementById("buddyFigure");
    el.hide = document.getElementById("buddyHide");
    el.restore = document.getElementById("buddyRestore");

    if (
      !el.bubble ||
      !el.figure ||
      !el.hide ||
      !el.restore ||
      !el.bubbleClose ||
      !el.streak
    ) {
      return;
    }

    bindEvents();
    setHidden(isHidden());
    refresh(Storage.loadData());
    maybeGreet();
  }

  NS.Buddy = {
    init: init,
    refresh: refresh,
    celebrate: celebrate,
    evaluate: evaluate,
    hide: hideBubble
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
