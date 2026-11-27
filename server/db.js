"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

mongoose.set("strictQuery", true);
// Jangan antrekan perintah saat database mati; lebih baik gagal cepat.
mongoose.set("bufferCommands", false);

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI belum diatur di file .env");
  }

  mongoose.connection.on("connected", function () {
    console.log("[KAIH] MongoDB terhubung ke database:", mongoose.connection.name);
  });

  mongoose.connection.on("error", function (error) {
    console.error("[KAIH] MongoDB error:", error.message);
  });

  mongoose.connection.on("disconnected", function () {
    console.warn("[KAIH] MongoDB terputus.");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10
  });

  return mongoose.connection;
}

async function seedAdmin() {
  const username = String(process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "kaih-admin-2026");
  const name = String(process.env.ADMIN_NAME || "Administrator KAIH").trim();

  if (!username || !password) {
    console.warn("[KAIH] ADMIN_USERNAME/ADMIN_PASSWORD kosong; admin tidak dibuat.");
    return null;
  }

  const existing = await Admin.findOne({ username });
  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await Admin.create({ username, name, passwordHash });
  console.log("[KAIH] Admin awal dibuat. Username:", username);
  return admin;
}

module.exports = { connectDatabase, seedAdmin };
