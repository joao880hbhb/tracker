"use strict";

const mongoose = require("mongoose");

const dailyLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 30
    },
    habits: {
      type: [Boolean],
      default: function () {
        return [false, false, false, false, false, false, false];
      },
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length === 7;
        },
        message: "Habits harus berisi 7 nilai."
      }
    },
    note: {
      type: String,
      default: "",
      maxlength: 500
    },
    mood: {
      type: String,
      enum: ["", "happy", "okay", "tired"],
      default: ""
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

// Satu siswa hanya boleh punya satu dokumen per hari.
dailyLogSchema.index({ studentId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model("DailyLog", dailyLogSchema);
