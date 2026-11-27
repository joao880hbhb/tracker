"use strict";

const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true,
      default: "Administrator KAIH"
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Admin", adminSchema);
