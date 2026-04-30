import { Attempt } from "../models/Attempt.js";
import { CheatingLog } from "../models/CheatingLog.js";
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

export const getAdminActivity = asyncHandler(async (req, res) => {
  const tests = await Test.find({ createdBy: req.user._id }).select("_id title");
  const testIds = tests.map((test) => test._id);
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const skip = (page - 1) * limit;

  const filter = {
    testId: { $in: testIds },
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(req.query.testId ? { testId: req.query.testId } : {})
  };

  const [items, total] = await Promise.all([
    Attempt.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .populate("testId", "title"),
    Attempt.countDocuments(filter)
  ]);

  const attemptIds = items.map((item) => item._id);
  const logs = await CheatingLog.find({ attemptId: { $in: attemptIds } })
    .sort({ timestamp: -1 })
    .select("attemptId event timestamp");

  const logMap = new Map();
  logs.forEach((log) => {
    const key = String(log.attemptId);
    if (!logMap.has(key)) {
      logMap.set(key, { event: log.event, timestamp: log.timestamp });
    }
  });

  return res.json({
    items: items.map((item) => ({
      attemptId: item._id,
      student: item.userId,
      test: item.testId,
      status: item.status,
      score: item.score,
      maxScore: item.maxScore,
      violationCount: item.violationCount,
      startedAt: item.startedAt,
      submittedAt: item.submittedAt,
      updatedAt: item.updatedAt,
      latestCheatingEvent: logMap.get(String(item._id)) || null
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});
