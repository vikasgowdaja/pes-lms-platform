import mongoose from "mongoose";

const antiCheatSchema = new mongoose.Schema(
  {
    violationThreshold: { type: Number, default: 5, min: 1 },
    requireFullscreen: { type: Boolean, default: true },
    disableCopyPaste: { type: Boolean, default: false }
  },
  { _id: false }
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    durationMinutes: { type: Number, required: true, min: 1 },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
      }
    ],
    randomizeQuestions: { type: Boolean, default: false },
    randomizeOptions: { type: Boolean, default: false },
    negativeMarkingEnabled: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false, index: true },
    antiCheat: { type: antiCheatSchema, default: () => ({}) },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

testSchema.index({ isPublished: 1, createdAt: -1 });

export const Test = mongoose.model("Test", testSchema);
