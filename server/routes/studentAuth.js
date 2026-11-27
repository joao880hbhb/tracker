"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const { signToken } = require("../middleware/auth");
const { publicStudent } = require("../utils/serialize");
const { createRateLimiter } = require("../utils/rateLimit");

const router = express.Router();
const loginLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 12 });

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
const PIN_RE = /^\d{4,6}$/;

function badRequest(res, message) {
  return res.status(400).json({
    ok: false,
    error: { code: "VALIDATION_ERROR", message }
  });
}

router.post("/register", loginLimiter, async function (req, res, next) {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const name = String(req.body.name || "").trim();
    const studentClass = String(req.body.studentClass || "").trim().slice(0, 30);
    const school = String(req.body.school || "").trim().slice(0, 80);
    const pin = String(req.body.pin || "").trim();

    if (!USERNAME_RE.test(username)) {
      return badRequest(
        res,
        "Username 3–30 karakter. Gunakan huruf kecil, angka, titik, garis bawah, atau strip."
      );
    }
    if (name.length < 2 || name.length > 60) {
      return badRequest(res, "Nama siswa harus 2–60 karakter.");
    }
    if (!PIN_RE.test(pin)) {
      return badRequest(res, "PIN harus 4–6 angka.");
    }

    const existing = await Student.findOne({ username });
    if (existing) {
      return res.status(409).json({
        ok: false,
        error: {
          code: "USERNAME_TAKEN",
          message: "Username sudah dipakai. Coba username lain."
        }
      });
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const student = await Student.create({
      username,
      name,
      studentClass,
      school,
      pinHash,
      lastLoginAt: new Date()
    });

    loginLimiter.reset(req);
    const token = signToken(
      { sub: student._id.toString(), role: "student", username: student.username },
      process.env.STUDENT_TOKEN_TTL || "30d"
    );

    return res.status(201).json({
      ok: true,
      data: { token, student: publicStudent(student) }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        ok: false,
        error: {
          code: "USERNAME_TAKEN",
          message: "Username sudah dipakai. Coba username lain."
        }
      });
    }
    return next(error);
  }
});

router.post("/login", loginLimiter, async function (req, res, next) {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const pin = String(req.body.pin || "").trim();

    if (!username || !pin) {
      return badRequest(res, "Username dan PIN wajib diisi.");
    }

    const student = await Student.findOne({ username }).select("+pinHash");
    if (!student) {
      return res.status(401).json({
        ok: false,
        error: { code: "INVALID_CREDENTIALS", message: "Username atau PIN salah." }
      });
    }

    if (student.isActive === false) {
      return res.status(403).json({
        ok: false,
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Akun ini dinonaktifkan oleh admin."
        }
      });
    }

    const valid = await bcrypt.compare(pin, student.pinHash);
    if (!valid) {
      return res.status(401).json({
        ok: false,
        error: { code: "INVALID_CREDENTIALS", message: "Username atau PIN salah." }
      });
    }

    student.lastLoginAt = new Date();
    await student.save();

    loginLimiter.reset(req);
    const token = signToken(
      { sub: student._id.toString(), role: "student", username: student.username },
      process.env.STUDENT_TOKEN_TTL || "30d"
    );

    return res.json({
      ok: true,
      data: { token, student: publicStudent(student) }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
