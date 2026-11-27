"use strict";

const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9._-]+$/
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    studentClass: {
      type: String,
      trim: true,
      maxlength: 30,
      default: ""
    },
    school: {
      type: String,
      trim: true,
      maxlength: 80,
      default: ""
    },
    pinHash: {
      type: String,
      required: true,
      select: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastLoginAt: {
      type: Date,
      default: null
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

studentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Student", studentSchema);
