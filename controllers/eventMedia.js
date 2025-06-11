const eventMediaService = require("../services/eventMediaService");

// GET: Fetch all media for a specific event
const getByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if the current user is an admin
    const isAdmin = req.user && req.user.role === "admin";
    const userId = req.user._id;

    const media = await eventMediaService.getByEventId(
      eventId,
      userId,
      isAdmin
    );
    if (!media || media.length === 0) {
      return res.status(404).json({ error: "No media found for the event" });
    }
    res.status(200).json(media);
  } catch (error) {
    console.error("Error fetching media for event:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

// POST: Add media to an event
const addMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No media files provided" });
    }

    const userId = req.user._id;
    const { event } = req.body;

    if (!event) {
      return res.status(400).json({ error: "Missing eventId" }); // optional: change message to "Missing event"
    }

    const mediaEntries = req.files.map((file) => ({
      event: event, // ✅ correct now
      user: userId,
      url: `${req.protocol}://${req.get("host")}/uploads/eventMedia/${file.filename}`,
      type: file.mimetype.startsWith("video/") ? "video" : "photo",
    }));

    const result = await eventMediaService.add(mediaEntries);
    res.status(201).json(result);
  } catch (error) {
    console.error("Media addition failed:", error);
    res.status(500).json({ error: "MEDIA_CREATION_FAILED" });
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

    // Check if the current user is an admin
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
};
