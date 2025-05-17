const Event = require("../models/event");
const EventMedia = require("../models/eventMedia");
const User = require("../models/user");
// Fetch deleted events
const getDeletedEvents = async (req, res) => {
  try {
    const events = await Event.find({ deleted: true }).lean();
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching deleted events:", error);
    res.status(500).json({ error: "FETCH_DELETED_EVENTS_FAILED" });
  }
};

// Restore a deleted event
const restoreEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { deleted: false }, { new: true });
    if (!event) return res.status(404).json({ error: "EVENT_NOT_FOUND" });
    res.status(200).json({ message: "Event restored successfully", event });
  } catch (error) {
    console.error("Error restoring event:", error);
    res.status(500).json({ error: "RESTORE_EVENT_FAILED" });
  }
};

// Hard delete an event
const hardDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: "EVENT_NOT_FOUND" });
    res.status(200).json({ message: "Event permanently deleted" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "DELETE_EVENT_FAILED" });
  }
};

// Fetch deleted media
const getDeletedMedia = async (req, res) => {
  try {
    const media = await EventMedia.find({ deleted: true }).lean();
    res.status(200).json(media);
  } catch (error) {
    console.error("Error fetching deleted media:", error);
    res.status(500).json({ error: "FETCH_DELETED_MEDIA_FAILED" });
  }
};

// Restore a deleted media
const restoreMedia = async (req, res) => {
  try {
    const media = await EventMedia.findByIdAndUpdate(req.params.id, { deleted: false }, { new: true });
    if (!media) return res.status(404).json({ error: "MEDIA_NOT_FOUND" });
    res.status(200).json({ message: "Media restored successfully", media });
  } catch (error) {
    console.error("Error restoring media:", error);
    res.status(500).json({ error: "RESTORE_MEDIA_FAILED" });
  }
};

// Hard delete media
const hardDeleteMedia = async (req, res) => {
  try {
    const media = await EventMedia.findByIdAndDelete(req.params.id);
    if (!media) return res.status(404).json({ error: "MEDIA_NOT_FOUND" });
    res.status(200).json({ message: "Media permanently deleted" });
  } catch (error) {
    console.error("Error deleting media:", error);
    res.status(500).json({ error: "DELETE_MEDIA_FAILED" });
  }
};

// Get platform analytics
const getPlatformAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalEvents = await Event.countDocuments({});
    const totalMedia = await EventMedia.countDocuments({});
    const deletedEvents = await Event.countDocuments({ deleted: true });
    const deletedMedia = await EventMedia.countDocuments({ deleted: true });

    res.status(200).json({
      totalUsers,
      totalEvents,
      totalMedia,
      deletedEvents,
      deletedMedia,
    });
  } catch (error) {
    console.error("Error fetching platform analytics:", error);
    res.status(500).json({ error: "FETCH_ANALYTICS_FAILED" });
  }
};

module.exports = {
  getDeletedEvents,
  restoreEvent,
  hardDeleteEvent,
  getDeletedMedia,
  restoreMedia,
  hardDeleteMedia,
  getPlatformAnalytics,
};