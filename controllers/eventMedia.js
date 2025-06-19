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
async function addMedia(req, res) {
  try {
    const mediaData = req.data; // From setData middleware
    const eventId = req.body.event;

    // Update the event document with the new media
    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        $push: { photos: { $each: mediaData.map(m => m.url) } }, // Add to photos array
        $set: { bannerUrl: mediaData.find(m => m.type === 'photo')?.url || event.bannerUrl }, // Set banner if photo
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(201).json(mediaData); // Return the media data
  } catch (error) {
    console.error('Error adding media:', error);
    res.status(500).json({ error: 'Error adding media' });
  }
}
const addEventPhotos = async (req, res) => {
  try {
    const { eventId } = req.body;
    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ error: "Event not found" });

    // Multer saved files under req.files.media (array)
    const files = req.files.media;
    if (!files?.length) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // First file → new banner
    ev.bannerUrl = files[0].filename;

    // Any additional files → push into photos[]
    const extraPhotos = files.slice(1).map(f => f.filename);
    ev.photos = Array.isArray(ev.photos)
      ? ev.photos.concat(extraPhotos)
      : extraPhotos;

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
  addEventPhotos,
};
