const express = require("express");
const PushToken = require("../models/PushToken");
const router = express.Router();

// Register a new push token
router.post("/register", async (req, res) => {
  try {
    const { pushToken, deviceId, userId } = req.body;

    // Validate required fields
    if (!pushToken || !deviceId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: pushToken, deviceId, or userId",
      });
    }

    // Check if this exact token already exists and is active
    const existingToken = await PushToken.findOne({
      pushToken,
      userId,
      isActive: true,
    });

    if (existingToken) {
      // Update last used timestamp
      existingToken.lastUsed = new Date();
      await existingToken.save();

      return res.json({
        success: true,
        message: "Push token already registered and active",
        tokenId: existingToken._id,
        alreadyExists: true,
      });
    }

    // Create new push token entry
    const newPushToken = new PushToken({
      pushToken,
      deviceId,
      userId, // <-- store the userId
    });

    const savedToken = await newPushToken.save();

    res.status(201).json({
      success: true,
      message: "Push token registered successfully",
      tokenId: savedToken._id,
    });
  } catch (error) {
    console.error("Error registering push token:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Push token already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while registering push token",
    });
  }
});

// Delete a push token
router.delete("/delete", async (req, res) => {
  try {
    const { tokenId, pushToken, deviceId, userId } = req.body;

    if (!tokenId && !pushToken && !deviceId && !userId) {
      return res.status(400).json({
        success: false,
        message: "Provide tokenId, pushToken, deviceId, or userId to delete",
      });
    }

    let query = {};
    if (tokenId) query._id = tokenId;
    if (pushToken) query.pushToken = pushToken;
    if (deviceId) query.deviceId = deviceId;
    if (userId) query.userId = userId;

    const deleted = await PushToken.deleteMany(query); // use deleteMany for userId cleanup

    if (deleted.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No push tokens found for given criteria",
      });
    }

    res.json({
      success: true,
      message: "Push token(s) deleted successfully",
      deletedCount: deleted.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting push token:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting push token",
    });
  }
});

// Cleanup old inactive tokens
router.post("/cleanup", async (req, res) => {
  try {
    const result = await PushToken.cleanupOldTokens();

    res.json({
      success: true,
      message: "Cleanup completed successfully",
      deletedCount: result?.deletedCount || 0,
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during cleanup",
    });
  }
});

module.exports = router;
