import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    selectedOptions: [{ type: String }],
    code: { type: String, default: "" },
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      default: "javascript"
    },
    isMarkedForReview: { type: Boolean, default: false },
    lastSavedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const codeSubmissionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      required: true
    },
    sourceCode: { type: String, required: true },
    output: { type: String, default: "" },
    executionTimeMs: { type: Number, default: 0 },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PASSED", "FAILED", "ERROR"],
      default: "FAILED"
    },
    executedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true
    },
    answers: [answerSchema],
    codeSubmissions: [codeSubmissionSchema],
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    optionOrders: {
      type: Map,
      of: [String],
      default: () => ({})
    },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    submittedAt: { type: Date },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    breakdown: {
      mcqCorrect: { type: Number, default: 0 },
      mcqIncorrect: { type: Number, default: 0 },
      codePassed: { type: Number, default: 0 },
      codeFailed: { type: Number, default: 0 }
    },
    violationCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED", "EXPIRED"],
      default: "IN_PROGRESS",
      index: true
    }
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, testId: 1, createdAt: -1 });

export const Attempt = mongoose.model("Attempt", attemptSchema);
