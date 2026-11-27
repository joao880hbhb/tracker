"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const DailyLog = require("../models/DailyLog");
const Admin = require("../models/Admin");
const { signToken, requireAdmin } = require("../middleware/auth");
const { publicStudent, toPublicLog, computeStats } = require("../utils/serialize");
const { studentListPipeline } = require("../utils/aggregations");
const { createRateLimiter } = require("../utils/rateLimit");

const router = express.Router();
const loginLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 8 });

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.post("/login", loginLimiter, async function (req, res, next) {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Username dan password wajib diisi." }
      });
    }

    const admin = await Admin.findOne({ username }).select("+passwordHash");
    if (!admin) {
      return res.status(401).json({
        ok: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Username atau password admin salah."
        }
      });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({
        ok: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Username atau password admin salah."
        }
      });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    loginLimiter.reset(req);
    const token = signToken(
      { sub: admin._id.toString(), role: "admin", username: admin.username },
      process.env.ADMIN_TOKEN_TTL || "12h"
    );

    return res.json({
      ok: true,
      data: {
        token,
        admin: { id: admin._id.toString(), username: admin.username, name: admin.name }
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Semua route di bawah ini wajib login sebagai admin.
router.use(requireAdmin);

router.get("/stats", async function (req, res, next) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const results = await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ isActive: true }),
      DailyLog.countDocuments({}),
      DailyLog.distinct("studentId", { updatedAt: { $gte: startOfToday } }),
      DailyLog.aggregate([
        {
          $group: {
            _id: "$studentId",
            days: { $sum: 1 },
            habits: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$habits",
                    as: "habit",
                    cond: "$$habit"
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            percent: {
              $cond: [
                { $gt: ["$days", 0] },
                {
                  $multiply: [
                    { $divide: ["$habits", { $multiply: ["$days", 7] }] },
                    100
                  ]
                },
                0
              ]
            }
          }
        },
        { $group: { _id: null, average: { $avg: "$percent" } } }
      ])
    ]);

    return res.json({
      ok: true,
      data: {
        totalStudents: results[0],
        activeStudents: results[1],
        totalLogs: results[2],
        activeToday: results[3].length,
        averageConsistency: results[4].length ? Math.round(results[4][0].average) : 0
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/students", async function (req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = String(req.query.search || "").trim();
    const match = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      match.$or = [
        { name: regex },
        { username: regex },
        { studentClass: regex },
        { school: regex }
      ];
    }

    const pipeline = studentListPipeline(match);
    const [items, countRows] = await Promise.all([
      Student.aggregate(
        pipeline.concat([{ $skip: (page - 1) * limit }, { $limit: limit }])
      ),
      Student.aggregate([{ $match: match }, { $count: "total" }])
    ]);

    const total = countRows.length ? countRows[0].total : 0;

    return res.json({
      ok: true,
      data: {
        items,
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/export.csv", async function (req, res, next) {
  try {
    const rows = await Student.aggregate(studentListPipeline({}));
    const header = [
      "username",
      "nama",
      "kelas",
      "sekolah",
      "hari_terisi",
      "total_kebiasaan",
      "konsistensi_persen",
      "terakhir_aktif",
      "dibuat"
    ];
    const lines = [header.map(csvCell).join(",")];

    rows.forEach(function (row) {
      lines.push(
        [
          row.username,
          row.name,
          row.studentClass || "",
          row.school || "",
          row.daysFilled || 0,
          row.totalHabits || 0,
          row.consistency || 0,
          row.lastActivityAt ? new Date(row.lastActivityAt).toISOString() : "",
          row.createdAt ? new Date(row.createdAt).toISOString() : ""
        ]
          .map(csvCell)
          .join(",")
      );
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="kaih-siswa-' + new Date().toISOString().slice(0, 10) + '.csv"'
    );
    return res.send("\uFEFF" + lines.join("\r\n"));
  } catch (error) {
    return next(error);
  }
});

router.get("/students/:id", async function (req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_ID", message: "ID siswa tidak valid." }
      });
    }

    const student = await Student.findById(req.params.id).lean();
    if (!student) {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Siswa tidak ditemukan." }
      });
    }

    delete student.pinHash;

    const logs = await DailyLog.find({ studentId: student._id })
      .sort({ day: 1 })
      .lean();

    return res.json({
      ok: true,
      data: {
        student: publicStudent(student),
        logs: logs.map(toPublicLog),
        stats: computeStats(logs)
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/students/:id", async function (req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_ID", message: "ID siswa tidak valid." }
      });
    }

    if (typeof req.body.isActive !== "boolean") {
      return res.status(400).json({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Field isActive harus bernilai true atau false."
        }
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: req.body.isActive } },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Siswa tidak ditemukan." }
      });
    }

    return res.json({ ok: true, data: { student: publicStudent(student) } });
  } catch (error) {
    return next(error);
  }
});

router.delete("/students/:id", async function (req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_ID", message: "ID siswa tidak valid." }
      });
    }

    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Siswa tidak ditemukan." }
      });
    }

    const logs = await DailyLog.deleteMany({ studentId: student._id });

    return res.json({
      ok: true,
      data: { deletedStudent: true, deletedLogs: logs.deletedCount }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
