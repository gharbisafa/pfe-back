const multer = require("multer");
const path = require("path");

// MIME types to enforce image and video extensions
const MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/jpg": "jpg",
  "video/mp4": "mp4",
  "video/avi": "avi",
  // Add more types as needed
};

// Common file filter to allow only images and videos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"), false);
  }
};

// Storage for profile images
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/profileImages/"));
  },
  filename: function (req, file, cb) {
    const extension = MIME_TYPES[file.mimetype] || path.extname(file.originalname).slice(1);
    const uniqueName = `profile_${Date.now()}.${extension}`;
    cb(null, uniqueName);
  },
});

// Storage for event front photos
const eventStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/eventPhotos/"));
  },
  filename: function (req, file, cb) {
    const extension = MIME_TYPES[file.mimetype] || path.extname(file.originalname).slice(1);
    const uniqueName = `event_${Date.now()}.${extension}`;
    cb(null, uniqueName);
  },
});

// Storage for event media (photos/videos)
const eventMediaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/eventMedia/"));
  },
  filename: function (req, file, cb) {
    const extension = MIME_TYPES[file.mimetype] || path.extname(file.originalname).slice(1);
    const uniqueName = `media_${Date.now()}.${extension}`;
    cb(null, uniqueName);
  },
});

// Middleware
const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("profileImage");

const uploadEventPhotos = multer({
  storage: eventStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).array("photos", 3); // Up to 3 images for front photos

const uploadEventMedia = multer({
  storage: eventMediaStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for larger media files
}).array("media"); // No limit on the number of media files

module.exports = {
  uploadProfileImage,
  uploadEventPhotos,
  uploadEventMedia,
};