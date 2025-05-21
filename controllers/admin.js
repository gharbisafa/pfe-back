// controllers/admin.js

const adminService = require("../services/adminService");
const DataValidationError   = require("../errors/dataValidationError");
const RecordNotFoundError   = require("../errors/recordNotFoundError");
const { get } = require("mongoose");

/**
 * Welcome endpoint for admins
 */
const welcomeAdmin = async (req, res) => {
  try {
    res.json({ message: "Welcome Admin!" });
  } catch (error) {
    console.error("welcomeAdmin error:", error);
    res.sendStatus(500);
  }
};

/**
 * Fetch all users (with optional ?role=&status= filters)
 */
const fetchUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const users = await adminService.getUsers({ role, status });
    res.status(200).json(users);
  } catch (error) {
    console.error("fetchUsers error:", error);
    res.sendStatus(500);
  }
};

/**
 * Update a user’s role
 */
const updateUserRole = async (req, res) => {
  try {
    const updatedUser = await adminService.updateUserRole(req.params.id, req.body.role);
    res.status(200).json({ message: "User role updated successfully", user: updatedUser });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof DataValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      console.error("updateUserRole error:", error);
      res.sendStatus(500);
    }
  }
};

/**
 * Soft‐delete a user
 */
const softDeleteUser = async (req, res) => {
  try {
    await adminService.softDeleteUser(req.params.id);
    res.status(200).json({ message: "User soft-deleted successfully" });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error("softDeleteUser error:", error);
      res.sendStatus(500);
    }
  }
};

/**
 * Ban an event (example stub)
 */
const banEvent = async (req, res) => {
  try {
    await adminService.banEvent(req.params.id);
    res.status(200).json({ message: "Event banned successfully" });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error("banEvent error:", error);
      res.sendStatus(500);
    }
  }
};

/**
 * Fetch deleted events
 */
const getDeletedEvents = async (req, res) => {
  try {
    const events = await adminService.getDeletedEvents();
    res.status(200).json(events);
  } catch (error) {
    console.error("getDeletedEvents error:", error);
    res.sendStatus(500);
  }
};

/**
 * Restore a deleted event
 */
const restoreEvent = async (req, res) => {
  try {
    const evt = await adminService.restoreEvent(req.params.id);
    res.status(200).json({ message: "Event restored successfully", event: evt });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error("restoreEvent error:", error);
      res.sendStatus(500);
    }
  }
};

/**
 * Hard delete an event
 */
const hardDeleteEvent = async (req, res) => {
  try {
    await adminService.hardDeleteEvent(req.params.id);
    res.status(200).json({ message: "Event permanently deleted" });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error("hardDeleteEvent error:", error);
      res.sendStatus(500);
    }
  }
};

// … media handlers from before (unchanged) …

/**
 * Fetch deleted media
 */
const getDeletedMedia = async (req, res) => {
  try {
    const media = await adminService.getDeletedMedia();
    res.status(200).json(media);
  } catch (error) {
    console.error("getDeletedMedia error:", error);
    res.sendStatus(500);
  }
};

/**
 * Restore media
 */
const restoreMedia = async (req, res) => {
  try {
    const media = await adminService.restoreMedia(req.params.id);
    res.status(200).json({ message: "Media restored successfully", media });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error("restoreMedia error:", error);
      res.sendStatus(500);
    }
  }
};

/**
 * Hard‐delete media
 */
const hardDeleteMedia = async (req, res) => {
  try {
    await adminService.hardDeleteMedia(req.params.id);
    res.status(200).json({ message: "Media permanently deleted" });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error("hardDeleteMedia error:", error);
      res.sendStatus(500);
    }
  }
};

/**
 * Get platform‐wide analytics
 */
const getPlatformAnalytics = async (req, res) => {
  try {
    const analytics = await adminService.getPlatformAnalytics();
    res.status(200).json(analytics);
  } catch (error) {
    console.error("getPlatformAnalytics error:", error);
    res.sendStatus(500);
  }
};
getPlatformAnalytics
// ————————————————————————————————————————————————————————————————————————
module.exports = {
  welcomeAdmin,
  fetchUsers,
  updateUserRole,
  softDeleteUser,
  banEvent,
  getDeletedEvents,
  restoreEvent,
  hardDeleteEvent,
  getDeletedMedia,
  restoreMedia,
  hardDeleteMedia,
  getPlatformAnalytics,
};
