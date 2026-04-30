import { Attempt } from "../models/Attempt.js";
import { Question } from "../models/Question.js";
import { executeCodeAgainstCases } from "../services/judge0Service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ensureAttemptWritable = (attempt, reqUser) => {
  if (!attempt) {
    return { status: 404, message: "Attempt not found" };
  }

  if (reqUser.role === "candidate" && String(attempt.userId) !== String(reqUser._id)) {
    return { status: 403, message: "Forbidden" };
  }

  if (attempt.status !== "IN_PROGRESS") {
    return { status: 400, message: "Attempt is not active" };
  }

  if (new Date() > attempt.expiresAt) {
    return { status: 409, message: "Attempt expired" };
  }

  return null;
};

export const runCode = asyncHandler(async (req, res) => {
  const { sourceCode, language, testCases } = req.body;

  if (!sourceCode || !language || !Array.isArray(testCases) || !testCases.length) {
    return res.status(400).json({ message: "sourceCode, language and testCases are required" });
  }

  const result = await executeCodeAgainstCases({ sourceCode, language, testCases });
  return res.json({ result });
});

export const submitCode = asyncHandler(async (req, res) => {
  const { attemptId, questionId } = req.params;
  const { sourceCode, language } = req.body;

  if (!sourceCode || !language) {
    return res.status(400).json({ message: "sourceCode and language are required" });
  }

  const attempt = await Attempt.findById(attemptId);
  const validationError = ensureAttemptWritable(attempt, req.user);
  if (validationError) {
    return res.status(validationError.status).json({ message: validationError.message });
  }

  const question = await Question.findById(questionId);
  if (!question || question.type !== "CODE") {
    return res.status(404).json({ message: "Coding question not found" });
  }

  const result = await executeCodeAgainstCases({
    sourceCode,
    language,
    testCases: question.coding?.testCases || []
  });

  const existingAnswer = attempt.answers.find((entry) => String(entry.questionId) === String(questionId));
  if (existingAnswer) {
    existingAnswer.code = sourceCode;
    existingAnswer.language = language;
    existingAnswer.lastSavedAt = new Date();
  }

  attempt.codeSubmissions.push({
    questionId,
    language,
    sourceCode,
    output: result.output,
    executionTimeMs: result.executionTimeMs,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    status: result.status
  });

  await attempt.save();

  return res.json({ result });
});
