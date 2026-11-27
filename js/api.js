/**
 * KAIH 30 Hari — klien API
 * Menghubungkan aplikasi siswa dan dashboard admin ke server MongoDB.
 */
(function () {
  "use strict";

  const NS = (window.KAIH = window.KAIH || {});
  const BASE = "/api";
  const SESSION_KEY = "kaih_session_v1";

  function readSession() {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.token || !parsed.student) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function writeSession(session) {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      /* Abaikan: sesi tetap aktif selama tab terbuka. */
    }
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      /* Abaikan. */
    }
  }

  async function request(path, options) {
    if (window.location.protocol === "file:") {
      const fileError = new Error(
        "Aplikasi harus dibuka lewat server di http://localhost:3000. Jangan buka file index.html langsung."
      );
      fileError.code = "FILE_PROTOCOL";
      fileError.status = 0;
      throw fileError;
    }

    const settings = options || {};
    const headers = { Accept: "application/json" };

    if (settings.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (settings.token) {
      headers.Authorization = "Bearer " + settings.token;
    }

    let response;
    try {
      response = await fetch(BASE + path, {
        method: settings.method || "GET",
        headers,
        body: settings.body !== undefined ? JSON.stringify(settings.body) : undefined
      });
    } catch (error) {
      const networkError = new Error(
        "Server tidak dapat dihubungi. Periksa koneksi internet atau pastikan server KAIH sedang berjalan."
      );
      networkError.code = "NETWORK";
      networkError.status = 0;
      throw networkError;
    }

    let payload = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = null;
      }
    }

    if (!response.ok || (payload && payload.ok === false)) {
      const apiError = new Error(
        (payload && payload.error && payload.error.message) ||
          "Permintaan gagal (" + response.status + ")."
      );
      apiError.code = (payload && payload.error && payload.error.code) || "HTTP_" + response.status;
      apiError.status = response.status;
      throw apiError;
    }

    return payload ? payload.data : null;
  }

  NS.API = {
    getSession: readSession,
    setSession: writeSession,
    clearSession,
    request,

    register: function (payload) {
      return request("/students/register", { method: "POST", body: payload });
    },
    login: function (payload) {
      return request("/students/login", { method: "POST", body: payload });
    },
    me: function (token) {
      return request("/students/me", { token });
    },
    saveLog: function (token, day, payload) {
      return request("/students/me/logs/" + encodeURIComponent(day), {
        method: "PUT",
        body: payload,
        token
      });
    },
    resetLogs: function (token) {
      return request("/students/me/logs", { method: "DELETE", token });
    },
    updateProfile: function (token, payload) {
      return request("/students/me", { method: "PATCH", body: payload, token });
    },

    adminLogin: function (payload) {
      return request("/admin/login", { method: "POST", body: payload });
    },
    adminStats: function (token) {
      return request("/admin/stats", { token });
    },
    adminStudents: function (token, params) {
      const settings = params || {};
      const query = new URLSearchParams();
      if (settings.page) query.set("page", String(settings.page));
      if (settings.limit) query.set("limit", String(settings.limit));
      if (settings.search) query.set("search", String(settings.search));
      const suffix = query.toString() ? "?" + query.toString() : "";
      return request("/admin/students" + suffix, { token });
    },
    adminStudent: function (token, id) {
      return request("/admin/students/" + encodeURIComponent(id), { token });
    },
    adminUpdateStudent: function (token, id, payload) {
      return request("/admin/students/" + encodeURIComponent(id), {
        method: "PATCH",
        body: payload,
        token
      });
    },
    adminDeleteStudent: function (token, id) {
      return request("/admin/students/" + encodeURIComponent(id), {
        method: "DELETE",
        token
      });
    }
  };
})();
