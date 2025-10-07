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

    // Check if a token already exists for this user and device
    const existingToken = await PushToken.findOne({ userId, deviceId });

    if (existingToken) {
      // Fully update the existing token record
      existingToken.pushToken = pushToken;
      existingToken.deviceId = deviceId;

      await existingToken.save();

      return res.status(200).json({
        success: true,
        message: "Existing push token updated successfully",
        tokenId: existingToken._id,
      });
    }

    // Otherwise, create a new push token entry
    const newPushToken = new PushToken({
      pushToken,
      deviceId,
      userId,
    });

    const savedToken = await newPushToken.save();

    return res.status(201).json({
      success: true,
      message: "Push token registered successfully",
      tokenId: savedToken._id,
      created: true,
    });
  } catch (error) {
    console.error("Error registering push token:", error);

    // Handle duplicate key error (e.g., race condition)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Push token already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error while registering push token",
    });
  }
});

// Delete push tokens (single or multiple)
router.delete("/delete", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Provide userId to delete push tokens",
      });
    }

    // Build the deletion query dynamically
    const query = {};

    if (userId) query.userId = userId;

    // Otherwise, userId alone removes all their tokens
    const deletedResult = await PushToken.deleteMany(query);

    if (deletedResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No push tokens found for the given criteria",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Deleted ${deletedResult.deletedCount} push token(s) successfully`,
      deletedCount: deletedResult.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting push token:", error);
    return res.status(500).json({
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
