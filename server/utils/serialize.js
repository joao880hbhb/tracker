"use strict";

function publicStudent(student) {
  if (!student) return null;
  return {
    id: String(student._id || student.id),
    username: student.username,
    name: student.name,
    studentClass: student.studentClass || "",
    school: student.school || "",
    isActive: student.isActive !== false,
    createdAt: student.createdAt || null,
    updatedAt: student.updatedAt || null,
    lastLoginAt: student.lastLoginAt || null
  };
}

function toPublicLog(log) {
  return {
    day: log.day,
    habits: Array.isArray(log.habits) ? log.habits.map(Boolean) : [],
    note: log.note || "",
    mood: log.mood || "",
    updatedAt: log.updatedAt || log.createdAt || null
  };
}

function logsToObject(logs) {
  const output = {};
  (logs || []).forEach(function (log) {
    output["day_" + log.day] = {
      habits: Array.isArray(log.habits) ? log.habits.map(Boolean) : [],
      note: log.note || "",
      mood: log.mood || "",
      updatedAt: log.updatedAt || log.createdAt || null
    };
  });
  return output;
}

function computeStats(logs) {
  const list = logs || [];
  const daysFilled = list.length;
  const totalHabits = list.reduce(function (total, log) {
    return total + (Array.isArray(log.habits) ? log.habits.filter(Boolean).length : 0);
  }, 0);
  const opportunities = daysFilled * 7;
  const consistency = opportunities > 0 ? Math.round((totalHabits / opportunities) * 100) : 0;

  return { daysFilled, totalHabits, opportunities, consistency };
}

module.exports = { publicStudent, toPublicLog, logsToObject, computeStats };
