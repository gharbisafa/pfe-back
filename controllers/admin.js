const adminService = require("../services/adminService");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");

const welcomeAdmin = async (req, res) => {
  try {
    res.json({ message: "Welcome Admin!" });
  } catch (error) {
    res.sendStatus(500);
  }
};

const fetchUsers = async (req, res) => {
  try {
    const { role, status } = req.query; // Filters
    const users = await adminService.getUsers({ role, status });
    res.status(200).json(users);
  } catch (error) {
    res.sendStatus(500);
  }
};

const updateUserRole = async (req, res) => {
  try {
    const updatedUser = await adminService.updateUserRole(req.params.id, req.body.role);
    res.status(200).json({ message: "User role updated successfully", user: updatedUser });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.sendStatus(500);
    }
  }
};

const softDeleteUser = async (req, res) => {
  try {
    await adminService.softDeleteUser(req.params.id);
    res.status(200).json({ message: "User soft-deleted successfully" });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.sendStatus(500);
    }
  }
};

const banEvent = async (req, res) => {
  try {
    await adminService.banEvent(req.params.id);
    res.status(200).json({ message: "Event banned successfully" });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.sendStatus(500);
    }
  }
};

const getDeletedMedia = async (req, res) => {
  try {
    const media = await adminService.getDeletedMedia();
    res.status(200).json(media);
  } catch (error) {
    res.sendStatus(500);
  }
};

const restoreMedia = async (req, res) => {
  try {
    const restoredMedia = await adminService.restoreMedia(req.params.id);
    res.status(200).json({ message: "Media restored successfully", media: restoredMedia });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.sendStatus(500);
    }
  }
};

const hardDeleteMedia = async (req, res) => {
  try {
    await adminService.hardDeleteMedia(req.params.id);
    res.status(200).json({ message: "Media permanently deleted" });
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.sendStatus(500);
    }
  }
};

const getPlatformAnalytics = async (req, res) => {
  try {
    const analytics = await adminService.getPlatformAnalytics();
    res.status(200).json(analytics);
  } catch (error) {
    res.sendStatus(500);
  }
};

module.exports = {
  welcomeAdmin,
  fetchUsers,
  updateUserRole,
  softDeleteUser,
  banEvent,
  getDeletedMedia,
  restoreMedia,
  hardDeleteMedia,
  getPlatformAnalytics,
};