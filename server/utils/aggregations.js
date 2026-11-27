"use strict";

/**
 * Pipeline agregasi daftar siswa.
 * Menggabungkan koleksi `students` dengan `dailylogs` lalu menghitung
 * hari terisi, total kebiasaan, konsistensi, dan aktivitas terakhir.
 */
function studentListPipeline(match) {
  return [
    { $match: match || {} },
    {
      $lookup: {
        from: "dailylogs",
        localField: "_id",
        foreignField: "studentId",
        as: "logs"
      }
    },
    {
      $addFields: {
        daysFilled: { $size: "$logs" },
        totalHabits: {
          $sum: {
            $map: {
              input: "$logs",
              as: "log",
              in: {
                $size: {
                  $filter: {
                    input: "$$log.habits",
                    as: "habit",
                    cond: "$$habit"
                  }
                }
              }
            }
          }
        },
        lastActivityAt: { $max: "$logs.updatedAt" }
      }
    },
    {
      $addFields: {
        consistency: {
          $cond: [
            { $gt: ["$daysFilled", 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$totalHabits", { $multiply: ["$daysFilled", 7] }] },
                    100
                  ]
                },
                0
              ]
            },
            0
          ]
        }
      }
    },
    { $project: { pinHash: 0, logs: 0, __v: 0 } },
    { $sort: { createdAt: -1 } }
  ];
}

module.exports = { studentListPipeline };
