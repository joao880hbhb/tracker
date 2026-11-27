"use strict";

/**
 * Entry point untuk Vercel Serverless Functions.
 * File statis (index.html, admin.html, css/, js/, sw.js) dilayani langsung oleh Vercel.
 * Hanya /api/* yang diteruskan ke Express app.
 */
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = require("../server/index");
const { connectDatabase, seedAdmin } = require("../server/db");

let readyPromise = null;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = connectDatabase()
      .then(function () {
        return seedAdmin();
      })
      .catch(function (error) {
        console.error("[KAIH] MongoDB tidak tersedia:", error.message);
      });
  }
  return readyPromise;
}

module.exports = async function handler(req, res) {
  await ensureReady();
  return app(req, res);
};
