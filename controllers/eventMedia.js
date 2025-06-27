const eventMediaService = require("../services/eventMediaService");
const Event = require("../models/event"); // Ensure this import is present
const EventMedia = require("../models/eventMedia"); // Ensure this import is present

// GET: Fetch all media for a specific event
const getByEventId = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user?._id;
    const isAdmin = req.user?.role === "admin";
    const media = await eventMediaService.getByEventId(eventId, userId, isAdmin);
    res.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ message: "Server error while fetching media" });
  }
};

// POST: Add media to an event (post-event media, stored in EventMedia)
async function addMedia(req, res) {
  try {
    const mediaData = req.data; // From setData middleware
    const eventId = req.body.event;

    // Optional: Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Use eventMediaService to add media to EventMedia model
    const media = await eventMediaService.add(mediaData);

    res.status(201).json(media);
  } catch (error) {
    console.error("Error adding media:", error);
    res.status(500).json({ error: "Error adding media" });
  }
}

// POST: Add event photos (pre-event, stored in Event model)
const addEventPhotos = async (req, res) => {
  try {
    const { eventId } = req.body;
    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ error: "Event not found" });

    const files = req.files.media;
    if (!files?.length) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    ev.bannerUrl = files[0].filename;
    const extraPhotos = files.slice(1).map(f => f.filename);
    ev.photos = ev.photos ? ev.photos.concat(extraPhotos) : extraPhotos;

    await ev.save();
    return res.json(ev);
  } catch (err) {
    console.error("addEventPhotos error", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// DELETE: Soft delete media by ID
const deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eventMediaService.deleteById(id, req.user._id);
    if (!result) return res.status(400).json({ error: "ALREADY_DELETED" });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting media:", error);
    res.status(500).json({ error: "MEDIA_DELETE_FAILED" });
  }
};

// PUT: Archive media by ID
const archiveById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user && req.user.role === "admin";
    const userId = req.user._id;
    const result = await eventMediaService.archiveById(id, userId, isAdmin);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error toggling archive state:", error);
    res.status(500).json({ error: error.message || "MEDIA_ARCHIVE_FAILED" });
  }
};

// PUT: Toggle likes for media
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eventMediaService.toggleLike(id, req.user._id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "LIKE_TOGGLE_FAILED" });
  }
};

module.exports = {
  getByEventId,
  addMedia,
  deleteById,
  archiveById,
  toggleLike,
  addEventPhotos,
};