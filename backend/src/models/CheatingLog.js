import mongoose from "mongoose";

const cheatingLogSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
      index: true
    },
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
    event: {
      type: String,
      enum: ["TAB_SWITCH", "WINDOW_BLUR", "WINDOW_FOCUS", "FULLSCREEN_EXIT", "COPY", "PASTE"],
      required: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

cheatingLogSchema.index({ attemptId: 1, timestamp: -1 });

export const CheatingLog = mongoose.model("CheatingLog", cheatingLogSchema);
