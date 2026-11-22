/**
 * KAIH 30 Hari — lapisan penyimpanan
 * Menjaga seluruh akses localStorage tetap aman dan konsisten.
 */
(function () {
  "use strict";

  const NS = (window.KAIH = window.KAIH || {});
  const CONFIG = NS.CONFIG;
  const KEY = CONFIG.storageKey;
  const MAX_NOTE_LENGTH = 500;

  let storageAvailable = detectStorage();
  let lastError = "";

  function detectStorage() {
    try {
      const probe = "__kaih_storage_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  function setError(message) {
    lastError = message || "";
  }

  function clearError() {
    lastError = "";
  }

  function safeString(value) {
    return typeof value === "string" ? value : "";
  }

  function createDefaultData() {
    return {
      profile: {
        school: "",
        studentName: "",
        studentClass: ""
      },
      logs: {}
    };
  }

  function normalizeLog(rawLog) {
    if (!rawLog || typeof rawLog !== "object" || !Array.isArray(rawLog.habits)) {
      return null;
    }

    const habits = Array.from({ length: CONFIG.habits.length }, function (_, index) {
      return Boolean(rawLog.habits[index]);
    });

    const mood = Object.prototype.hasOwnProperty.call(CONFIG.moods, rawLog.mood) ? rawLog.mood : "";

    return {
      habits,
      note: safeString(rawLog.note).slice(0, MAX_NOTE_LENGTH),
      mood,
      updatedAt: safeString(rawLog.updatedAt)
    };
  }

  function normalizeData(rawData) {
    const clean = createDefaultData();

    if (!rawData || typeof rawData !== "object") {
      return clean;
    }

    if (rawData.profile && typeof rawData.profile === "object") {
      clean.profile.school = safeString(rawData.profile.school).slice(0, 80);
      clean.profile.studentName = safeString(rawData.profile.studentName).slice(0, 60);
      clean.profile.studentClass = safeString(rawData.profile.studentClass).slice(0, 30);
    }

    if (rawData.logs && typeof rawData.logs === "object") {
      for (let day = 1; day <= CONFIG.totalDays; day += 1) {
        const key = "day_" + day;
        const normalized = normalizeLog(rawData.logs[key]);
        if (normalized) {
          clean.logs[key] = normalized;
        }
      }
    }

    return clean;
  }

  function loadData() {
    clearError();

    if (!storageAvailable) {
      setError("Penyimpanan browser tidak tersedia. Data hanya akan bertahan selama tab ini terbuka.");
      return createDefaultData();
    }

    let serialized = null;
    try {
      serialized = window.localStorage.getItem(KEY);
    } catch (error) {
      storageAvailable = false;
      setError("Penyimpanan browser tidak dapat dibaca. Data hanya akan bertahan selama tab ini terbuka.");
      return createDefaultData();
    }

    if (!serialized) {
      return createDefaultData();
    }

    try {
      return normalizeData(JSON.parse(serialized));
    } catch (error) {
      setError("Data lama tidak dapat dibaca dan telah diganti dengan data baru. Kamu bisa mulai mengisi kembali.");
      return createDefaultData();
    }
  }

  function saveData(data) {
    clearError();

    if (!storageAvailable) {
      setError("Perubahan tersimpan di tab ini, tetapi penyimpanan browser tidak tersedia.");
      return false;
    }

    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      setError("Data gagal disimpan. Penyimpanan mungkin penuh atau diblokir oleh browser.");
      return false;
    }
  }

  function resetData() {
    clearError();

    if (!storageAvailable) {
      return false;
    }

    try {
      window.localStorage.removeItem(KEY);
      return true;
    } catch (error) {
      setError("Data tidak dapat dihapus dari penyimpanan browser.");
      return false;
    }
  }

  function hasSavedData(data) {
    if (!data || !data.logs) return false;
    return Object.keys(data.logs).length > 0;
  }

  NS.Storage = {
    KEY,
    MAX_NOTE_LENGTH,
    loadData,
    saveData,
    resetData,
    normalizeData,
    normalizeLog,
    createDefaultData,
    hasSavedData,
    isAvailable: function () {
      return storageAvailable;
    },
    consumeError: function () {
      const message = lastError;
      clearError();
      return message;
    }
  };
})();
