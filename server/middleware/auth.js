"use strict";

const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET wajib diisi minimal 16 karakter di file .env");
  }
  return secret;
}

function signToken(payload, ttl) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ttl || "30d" });
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

function unauthorized(res, message) {
  return res.status(401).json({
    ok: false,
    error: {
      code: "UNAUTHORIZED",
      message: message || "Sesi tidak valid. Silakan masuk lagi."
    }
  });
}

async function requireStudent(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return unauthorized(res);

    const payload = jwt.verify(token, getJwtSecret());
    if (payload.role !== "student") return unauthorized(res);

    const student = await Student.findById(payload.sub);
    if (!student) return unauthorized(res, "Akun siswa tidak ditemukan.");
    if (student.isActive === false) {
      return unauthorized(res, "Akun siswa dinonaktifkan oleh admin.");
    }

    req.student = student;
    return next();
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      return unauthorized(res, "Sesi sudah berakhir. Silakan masuk lagi.");
    }
    return unauthorized(res);
  }
}

async function requireAdmin(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return unauthorized(res);

    const payload = jwt.verify(token, getJwtSecret());
    if (payload.role !== "admin") return unauthorized(res);

    const admin = await Admin.findById(payload.sub);
    if (!admin) return unauthorized(res, "Akun admin tidak ditemukan.");

    req.admin = admin;
    return next();
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      return unauthorized(res, "Sesi admin sudah berakhir. Silakan masuk lagi.");
    }
    return unauthorized(res);
  }
}

module.exports = { signToken, requireStudent, requireAdmin, getJwtSecret };
