const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  serverId: { type: String, required: true },
  status: { type: String, enum: ["online", "offline"], default: "online" },
  lastSeen: { type: Date, default: Date.now },
});

presenceSchema.index({ userId: 1, serverId: 1 }, { unique: false });

module.exports = mongoose.model("Presence", presenceSchema);
