import { Attempt } from "../models/Attempt.js";
import { CheatingLog } from "../models/CheatingLog.js";
import { Test } from "../models/Test.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveAdminScope = async (requestUser) => {
  if (requestUser.role === "admin") {
    return { adminIds: [requestUser._id] };
  }

  if (requestUser.role === "super-admin") {
    const managedAdmins = await User.find({ role: "admin", linkedSuperAdmin: requestUser._id }).select("_id");
    return { adminIds: managedAdmins.map((admin) => admin._id) };
  }

  return { adminIds: [] };
};

export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const { adminIds } = await resolveAdminScope(req.user);
  const tests = await Test.find({ createdBy: { $in: adminIds } }).select("_id title");
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
  const { adminIds } = await resolveAdminScope(req.user);
  const tests = await Test.find({ createdBy: { $in: adminIds } }).select("_id title");
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

export const getStudentDetail = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { adminIds } = await resolveAdminScope(req.user);

  const student = await User.findOne({
    _id: studentId,
    role: "candidate",
    linkedAdmin: { $in: adminIds }
  }).populate("linkedAdmin", "_id name email");

  if (!student) {
    return res.status(404).json({ message: "Student not found in your scope" });
  }

  const attempts = await Attempt.find({ userId: student._id })
    .populate("testId", "title")
    .sort({ startedAt: -1 });

  const attemptIds = attempts.map((attempt) => attempt._id);
  const logs = await CheatingLog.find({ attemptId: { $in: attemptIds } })
    .select("attemptId event metadata timestamp")
    .sort({ timestamp: -1 });

  const scoreTrend = attempts
    .filter((attempt) => attempt.status !== "IN_PROGRESS")
    .map((attempt) => ({
      attemptId: attempt._id,
      date: attempt.submittedAt || attempt.updatedAt,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.maxScore ? Number(((attempt.score / attempt.maxScore) * 100).toFixed(2)) : 0,
      testTitle: attempt.testId?.title || "Unknown"
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return res.json({
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
      linkedAdmin: student.linkedAdmin
    },
    attemptsTimeline: attempts.map((attempt) => ({
      attemptId: attempt._id,
      testTitle: attempt.testId?.title || "Unknown",
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      violationCount: attempt.violationCount,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      updatedAt: attempt.updatedAt
    })),
    cheatingLogs: logs.map((log) => ({
      attemptId: log.attemptId,
      event: log.event,
      metadata: log.metadata,
      timestamp: log.timestamp
    })),
    scoreTrend
  });
});
