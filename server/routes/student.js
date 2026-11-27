"use strict";

const express = require("express");
const DailyLog = require("../models/DailyLog");
const Student = require("../models/Student");
const { requireStudent } = require("../middleware/auth");
const {
  publicStudent,
  toPublicLog,
  logsToObject,
  computeStats
} = require("../utils/serialize");

const router = express.Router();

// Semua route di bawah ini wajib login sebagai siswa.
router.use(requireStudent);

function normalizeHabits(value) {
  if (!Array.isArray(value) || value.length !== 7) return null;
  return value.map(function (item) {
    return Boolean(item);
  });
}

function normalizeMood(value) {
  return ["happy", "okay", "tired"].includes(value) ? value : "";
}

router.get("/me", async function (req, res, next) {
  try {
    const logs = await DailyLog.find({ studentId: req.student._id })
      .sort({ day: 1 })
      .lean();

    return res.json({
      ok: true,
      data: {
        student: publicStudent(req.student),
        logs: logsToObject(logs),
        stats: computeStats(logs)
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/me/logs/:day", async function (req, res, next) {
  try {
    const day = Number(req.params.day);
    if (!Number.isInteger(day) || day < 1 || day > 30) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_DAY", message: "Hari harus antara 1 sampai 30." }
      });
    }

    const habits = normalizeHabits(req.body.habits);
    if (!habits) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "INVALID_HABITS",
          message: "Data kebiasaan harus berisi 7 nilai benar/salah."
        }
      });
    }

    const note = String(req.body.note || "").slice(0, 500);
    const mood = normalizeMood(req.body.mood);
    const now = new Date();

    const log = await DailyLog.findOneAndUpdate(
      { studentId: req.student._id, day },
      {
        $set: { habits, note, mood, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await Student.updateOne({ _id: req.student._id }, { $set: { updatedAt: now } });

    const logs = await DailyLog.find({ studentId: req.student._id }).lean();

    return res.json({
      ok: true,
      data: {
        log: toPublicLog(log),
        stats: computeStats(logs)
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/me/logs", async function (req, res, next) {
  try {
    const result = await DailyLog.deleteMany({ studentId: req.student._id });
    return res.json({ ok: true, data: { deleted: result.deletedCount } });
  } catch (error) {
    return next(error);
  }
});

router.patch("/me", async function (req, res, next) {
  try {
    const updates = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name || "").trim();
      if (name.length < 2 || name.length > 60) {
        return res.status(400).json({
          ok: false,
          error: { code: "INVALID_NAME", message: "Nama siswa harus 2–60 karakter." }
        });
      }
      updates.name = name;
    }

    if (req.body.studentClass !== undefined) {
      updates.studentClass = String(req.body.studentClass || "").trim().slice(0, 30);
    }

    if (req.body.school !== undefined) {
      updates.school = String(req.body.school || "").trim().slice(0, 80);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        ok: false,
        error: { code: "NO_CHANGES", message: "Tidak ada data yang diubah." }
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.student._id,
      { $set: Object.assign({ updatedAt: new Date() }, updates) },
      { new: true, runValidators: true }
    );

    return res.json({ ok: true, data: { student: publicStudent(student) } });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
