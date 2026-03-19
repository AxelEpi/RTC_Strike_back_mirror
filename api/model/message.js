const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    channelId: { type: String, required: true },
    serverId: { type: String, required: true },
    userId: { type: String, required: true },
    content: { type: String, required: true },
    deleted: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
