import { Attempt } from "../models/Attempt.js";
import { Test } from "../models/Test.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const tests = await Test.find({ createdBy: req.user._id }).select("_id title");
  const testIds = tests.map((test) => test._id);

  const [attemptStats, scoreStats, topTests] = await Promise.all([
    Attempt.aggregate([
      { $match: { testId: { $in: testIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    Attempt.aggregate([
      { $match: { testId: { $in: testIds }, status: { $ne: "IN_PROGRESS" } } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          maxScore: { $max: "$score" },
          minScore: { $min: "$score" }
        }
      }
    ]),
    Attempt.aggregate([
      { $match: { testId: { $in: testIds }, status: { $ne: "IN_PROGRESS" } } },
      {
        $group: {
          _id: "$testId",
          attempts: { $sum: 1 },
          avgScore: { $avg: "$score" }
        }
      },
      { $sort: { attempts: -1 } },
      { $limit: 5 }
    ])
  ]);

  const testTitleMap = new Map(tests.map((t) => [String(t._id), t.title]));

  return res.json({
    statusBreakdown: attemptStats,
    scoreSummary: scoreStats[0] || { avgScore: 0, maxScore: 0, minScore: 0 },
    topTests: topTests.map((entry) => ({
      testId: entry._id,
      title: testTitleMap.get(String(entry._id)) || "Unknown",
      attempts: entry.attempts,
      avgScore: entry.avgScore
    }))
  });
});
