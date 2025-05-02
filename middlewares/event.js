const Event = require("../models/event");

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
    req.data = { ...req.body, createdBy: req.user._id };
  } catch (error) {
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


module.exports = {
  setData,
  validateEventData,
  isEventOwner,
  checkGuestUniqueness,
  setUserId 
};