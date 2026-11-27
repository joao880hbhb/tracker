"use strict";

const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { connectDatabase } = require("../db");
const Admin = require("../models/Admin");

(async function () {
  try {
    await connectDatabase();

    const username = String(process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || "");
    const name = String(process.env.ADMIN_NAME || "Administrator KAIH").trim();

    if (!password) {
      throw new Error("ADMIN_PASSWORD kosong di file .env");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.findOneAndUpdate(
      { username },
      {
        $set: { passwordHash, name },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, new: true }
    );

    console.log("Admin siap. Username:", admin.username);
  } catch (error) {
    console.error("Gagal reset admin:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
