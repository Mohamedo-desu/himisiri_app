const mongoose = require("mongoose");

const pushTokenSchema = new mongoose.Schema({
  pushToken: {
    type: String,
    required: true,
    unique: true, // Ensure no duplicate tokens
  },
  deviceId: {
    type: String,
    required: true,
    index: true, // Index for faster queries
  },
});

const PushToken = mongoose.model("PushToken", pushTokenSchema);

module.exports = PushToken;
