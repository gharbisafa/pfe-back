const setData = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No media files provided" });
    }

    req.data = req.files.map((file) => ({
      event: req.body.event,
      user: req.user._id,
      type: req.body.type,
      url: file.path,
    }));

    next();
  } catch (error) {
    console.error("Error processing event media data:", error);
    res.status(500).json({ error: "Error processing media data" });
  }
};

const validateMediaData = (req, res, next) => {
  const { type, event } = req.body;

  if (!type || !["photo", "video"].includes(type)) {
    return res.status(400).json({ error: "Invalid media type. Allowed types are 'photo' or 'video'" });
  }

  if (!event) {
    return res.status(400).json({ error: "Event ID is required" });
  }

  next();
};

module.exports = {
  setData,
  validateMediaData,
};