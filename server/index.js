"use strict";

const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const mongoose = require("mongoose");

const { connectDatabase, seedAdmin } = require("./db");
const { getJwtSecret } = require("./middleware/auth");
const studentAuthRoutes = require("./routes/studentAuth");
const studentRoutes = require("./routes/student");
const adminRoutes = require("./routes/admin");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));

// CORS untuk API. Auth memakai Bearer token, bukan cookie, jadi aman.
app.use("/api", function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

app.get("/api/health", function (req, res) {
  res.json({
    ok: true,
    data: {
      status: "ok",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      time: new Date().toISOString()
    }
  });
});

// Tolak request API jika database belum siap.
app.use("/api", function (req, res, next) {
  if (req.path === "/health") return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      ok: false,
      error: {
        code: "DATABASE_OFFLINE",
        message:
          "Database belum terhubung. Periksa MONGODB_URI dan Network Access di MongoDB Atlas."
      }
    });
  }
  return next();
});

app.use("/api/students", studentAuthRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);

// Jangan pernah menyajikan file konfigurasi/server lewat static.
const blocked =
  /^\/(?:server|node_modules|\.git|docs)(?:\/|$)|^\/\.env(?:[./]|$)|^\/package(?:-lock)?\.json$|^\/README(?:\.md)?$/i;

app.use(function (req, res, next) {
  if (blocked.test(req.path)) {
    return res.status(404).json({
      ok: false,
      error: { code: "NOT_FOUND", message: "Tidak ditemukan." }
    });
  }
  return next();
});

app.use(
  express.static(ROOT, {
    extensions: ["html"],
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
  })
);

app.use(function (req, res) {
  if (req.path.indexOf("/api/") === 0) {
    return res.status(404).json({
      ok: false,
      error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan." }
    });
  }
  return res
    .status(404)
    .send('Halaman tidak ditemukan. <a href="/">Kembali ke KAIH</a>');
});

app.use(function (error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error && error.type === "entity.parse.failed") {
    return res.status(400).json({
      ok: false,
      error: { code: "INVALID_JSON", message: "Format JSON tidak valid." }
    });
  }

  if (error && error.name === "ValidationError") {
    return res.status(400).json({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data tidak valid: " + Object.keys(error.errors || {}).join(", ")
      }
    });
  }

  console.error("[KAIH] Unhandled error:", error);
  return res.status(500).json({
    ok: false,
    error: { code: "SERVER_ERROR", message: "Terjadi kesalahan pada server." }
  });
});

async function start() {
  getJwtSecret();

  try {
    await connectDatabase();
    await seedAdmin();
  } catch (error) {
    console.error("");
    console.error("[KAIH] Gagal terhubung ke MongoDB:", error.message);
    console.error("[KAIH] Server tetap dijalankan, tetapi API database akan mengembalikan 503.");
    console.error("[KAIH] Periksa: 1) password di MONGODB_URI, 2) Network Access Atlas (IP allowlist),");
    console.error("[KAIH]          3) user database punya akses readWrite ke database kaih_tracker.");
    console.error("");
  }

  app.listen(PORT, function () {
    console.log("[KAIH] Server berjalan di http://localhost:" + PORT);
    console.log("[KAIH] Dashboard admin: http://localhost:" + PORT + "/admin");
  });
}

module.exports = app;

if (require.main === module) {
  start();
}
