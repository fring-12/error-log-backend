import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, "Error message is required"],
    },
    stackTrace: String,
    source: String,
    level: {
      type: String,
      enum: ["error", "warning", "info"],
      default: "error",
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
    },
    browserInfo: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["new", "acknowledged", "resolved", "ignored"],
      default: "new",
    },
    serverTimestamp: {
      type: Date,
      default: Date.now,
    },
    clientTimestamp: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ErrorLog", errorLogSchema);
