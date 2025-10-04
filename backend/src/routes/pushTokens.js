const express = require("express");
const PushToken = require("../models/PushToken");
const router = express.Router();

// Register a new push token
router.post("/register", async (req, res) => {
  try {
    const { pushToken, deviceId } = req.body;

    // Validate required fields
    if (!pushToken || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: pushToken, deviceId, or platform",
      });
    }

    // Check if this exact token already exists and is active
    const existingToken = await PushToken.findOne({
      pushToken,
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
