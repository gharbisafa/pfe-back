const multer = require("multer");
const path = require("path");

// MIME types to enforce image extensions
const MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/jpg": "jpg",
  // Add more types as needed
};

// Common file filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
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

// Storage for event photos
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
}).array("photos",3 ); // up to 3 images

module.exports = {
  uploadProfileImage,
  uploadEventPhotos
};
