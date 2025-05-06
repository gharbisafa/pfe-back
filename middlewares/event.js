const Event = require("../models/event");
const multer = require("multer");
const path = require("path");


// Middleware to validate basic event data
const validateEventData = (req, res, next) => {
  const { title, startDate, endDate, startTime, endTime, location, bookingLink } = req.body;

  if (!title || !/^[\p{L}0-9\s\-!?:,.()']+$/u.test(title)) {
    return res.status(400).json({ error: "Invalid event title" });
  }

  if (!startDate || !endDate || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required date/time fields" });
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return res.status(400).json({ error: "Invalid time format. Use HH:MM (24-hour)" });
  }

  if (bookingLink && !/^https?:\/\/.+$/.test(bookingLink)) {
    return res.status(400).json({ error: "Invalid booking link URL" });
  }

  next();
};

// Middleware to check if the user is the event owner
const isEventOwner = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized: not the event owner" });
    }
    req.event = event; 
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to check for duplicate RSVP
const checkGuestUniqueness = async (req, res, next) => {
  const { eventId, userId } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const alreadyRSVPed = event.guests.some(g => g.user.toString() === userId);
    if (alreadyRSVPed) {
      return res.status(400).json({ error: "User has already RSVP'd" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const setData = async (req, res, next) => {
  try {
    req.data = {
      ...req.body,
      createdBy: req.user._id,
      photos: req.files?.map(file => file.filename),
      files: req.files
     };
  } catch (error) {
    return res.status(500).json({ error: "Error processing event data" });
  } finally {
    next();
  }
};

const setUserId = (req, res, next) => {
  if (!req.user?._id) {
    return res.status(401).json({ error: "Unauthorized: User ID missing" });
  }
  req.body.userId = req.user._id; // Attach userId to the request body
  next();
};

// Set up multer for file uploads
// Supported image MIME types
const MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/jpg": "jpg",
};

// Multer storage config for event photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/eventPhotos")); // Store in eventPhotos folder
  },
  filename: (req, file, cb) => {
    const extension = MIME_TYPES[file.mimetype] || path.extname(file.originalname).slice(1);
    const uniqueName = `${file.fieldname}_${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

// Filter only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

// Multer middleware for multiple images
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
}).array("photos", 3); // Accept up to 10 images under 'photos' field

// Export other middlewares too


module.exports = {
  setData,
  validateEventData,
  isEventOwner,
  checkGuestUniqueness,
  setUserId,
  upload
};