const mongoose = require("mongoose");

const typingSchema = new mongoose.Schema(
  {
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    isTyping: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } },
);

typingSchema.index({ channelId: 1, userId: 1 }, { unique: false });

module.exports = mongoose.model("Typing", typingSchema);
