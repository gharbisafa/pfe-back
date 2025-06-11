// Replace validateMediaData with:
const validateMediaData = (req, res, next) => {
  const { event } = req.body;
  if (!event) {
    return res.status(400).json({ error: "Event ID is required" });
  }
  next();
};

// And modify setData to auto-detect type
const setData = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No media files provided" });
    }

    req.data = req.files.map((file) => ({
      event: req.body.event,
      user: req.user._id,
      type: file.mimetype.startsWith("video/") ? "video" : "photo",
      url: `${req.protocol}://${req.get("host")}/uploads/eventMedia/${file.filename}`, // better than file.path
    }));

    next();
  } catch (error) {
    console.error("Error processing event media data:", error);
    res.status(500).json({ error: "Error processing media data" });
  }
};

module.exports = {
  setData,
  validateMediaData,
};