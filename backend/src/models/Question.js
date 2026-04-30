import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    text: { type: String, required: true }
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    output: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["MCQ", "CODE"],
      required: true,
      index: true
    },
    marks: { type: Number, default: 1, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },
    mcq: {
      options: [optionSchema],
      correctAnswers: [{ type: String }],
      allowMultiple: { type: Boolean, default: false }
    },
    coding: {
      defaultLanguage: {
        type: String,
        enum: ["javascript", "python", "java", "cpp"],
        default: "javascript"
      },
      starterCode: {
        javascript: { type: String, default: "" },
        python: { type: String, default: "" },
        java: { type: String, default: "" },
        cpp: { type: String, default: "" }
      },
      testCases: [testCaseSchema]
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

questionSchema.index({ type: 1, createdAt: -1 });

export const Question = mongoose.model("Question", questionSchema);
