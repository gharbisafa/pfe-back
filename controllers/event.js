const Event = require("../models/event");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const notificationService = require("../services/notificationService");
const RSVP = require("../models/rsvp");
const eventService = require("../services/eventService");

const get = async (req, res) => {
  try {
    const {
      type,
      location,
      startDate,
      endDate,
      sortBy,
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const search = req.query.search || req.query.searchTerm;

    const filters = [{ deleted: false }];

    if (req.query.visibility === "public") filters.push({ visibility: "public" });
    if (type) filters.push({ type });
    if (location) filters.push({ location: { $regex: location, $options: "i" } });

    if (search) {
      filters.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filters.push({
        $or: [
          { startDate: { $lte: end }, endDate: { $gte: start } },
          { startDate: { $gte: start, $lte: end } },
          { endDate: { $gte: start, $lte: end } },
        ],
      });
    }

    const sort = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const { events, pagination } = await eventService.getFilteredEventsWithCount({
      filters: filters.length > 1 ? { $and: filters } : filters[0],
      sort,
      page,
      limit,
    });

    res.status(200).json({
      page: pagination.currentPage,
      limit: pagination.limit,
      totalCount: pagination.totalCount,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.hasNextPage,
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

const getById = async (req, res) => {
  try {
    const doc = await Event.findById(req.params.id)
      .populate({
        path: "guests.user",
        populate: {
          path: "userInfo",
          select: "name profileImage"
        }
      })
      .populate({
        path: "createdBy",
        populate: {
          path: "userInfo",
          select: "name profileImage"
        }
      });
    // Turn the mongoose document into a plain object
    const event = doc.toObject();
    // Inject a bannerUrl (first photo or fallback)
    event.bannerUrl =
      Array.isArray(event.photos) && event.photos.length > 0
        ? event.photos[0]
        : `${req.protocol}://${req.get("host")}/uploads/default-banner.jpg`;

    res.json(event);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ error: "FETCH_EVENT_FAILED" });
  }
};

const add = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id; // ✅ From passport-jwt

    const data = {
      ...req.data,
      startDate: new Date(req.data.startDate),
      endDate: new Date(req.data.endDate),
      createdBy: userId, // ✅ Auto-assigned host/creator
    };

    const result = await eventService.add(data);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Event creation failed:", error);
    res.status(500).json({ error: "EVENT_CREATION_FAILED" });
  }
};



const updateById = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      files: req.files,
    };

    if (req.body.startDate) updateData.startDate = new Date(req.body.startDate);
    if (req.body.endDate) updateData.endDate = new Date(req.body.endDate);

    const result = await eventService.updateById(
      req.params.id,
      updateData,
      req.user._id
    );
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      return res.status(404).json({ error: "EVENT_NOT_FOUND" });
    }
    if (error instanceof DataValidationError) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        details: error.issues.map(issue => ({
          field: issue.path,
          message: issue.message
        }))
      });
    }
    console.error("Event update failed:", error);
    res.status(500).json({ error: "EVENT_UPDATE_FAILED" });
  }
};

const deleteById = async (req, res) => {
  try {
    const result = await eventService.deleteById(req.params.id);
    if (!result) return res.status(400).json({ error: "ALREADY_DELETED" });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    console.error(error);
    res.sendStatus(500);
  }
};

const softDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ message: "Event soft deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error soft deleting event" });
  }
};

const toggleLike = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id || req.user._id;

  try {
    const event = await eventService.toggleEventField(eventId, userId, "likes");

    // Explicitly include visibility field in the response
    const formatted = {
      _id: event._id,
      title: event.title,
      visibility: event.visibility,
      photos: event.photos,
      startDate: event.startDate,
      createdBy: event.createdBy,
      likes: event.likes
    };

    res.status(200).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "LIKE_TOGGLE_FAILED", message: err.message });
  }
};


const toggleField = async (req, res) => {
  const { eventId } = req.params;
  const { field } = req.body;

  try {
    const updatedEvent = await eventService.toggleEventField(
      eventId,
      req.user._id,
      "interested"
    );
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error toggling interested:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      createdBy: req.user._id,
      deleted: false
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
};

const getLikedEvents = async (req, res) => {
  try {
    const events = await eventService.getUserEventsByField(req.user._id, "likes");
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching liked events:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

const getUserEventMedia = async (req, res) => {
  try {
    const media = await eventService.getUserEventMedia(req.user._id);
    res.status(200).json(media);
  } catch (error) {
    console.error("Error fetching media posted in events:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

const notifyGuests = async (event, guests) => {
  try {
    const notifications = guests.map((guest) => {
      if (!guest.user) throw new Error("Guest user is missing");
      return notificationService.createNotification({
        user: guest.user,
        type: "guest_invitation",
        message: `You've been invited to the event "${event.title}"`,
        event: event._id,
      });
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error("Error notifying guests:", error);
    throw new Error("NOTIFICATION_CREATION_FAILED");
  }
};

const toggleArchive = async (req, res) => {
  const { eventId } = req.params;

  try {
    const updatedEvent = await eventService.toggleEventArchive(eventId, req.user._id);
    res.status(200).json({
      message: `Event ${updatedEvent.isArchived ? "archived" : "unarchived"} successfully.`,
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error toggling archive status:", error);
    res.status(500).json({ message: error.message });
  }
};

const getEventRSVPs = async (req, res) => {
  const { eventId } = req.params;

  try {
    const rsvps = await RSVP.find({ event: eventId }).populate("user", "name email");
    res.status(200).json({
      count: rsvps.length,
      rsvps,
    });
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

async function updateRSVP(req, res) {
  const { eventId } = req.params;
  const { status } = req.body;       // expecting "yes" | "no" | "maybe"
  const userId = req.user._id;

  // 1) Validate incoming status
  if (!["yes", "no", "maybe"].includes(status)) {
    return res.status(400).json({ error: "Invalid RSVP value" });
  }

  // 2) Load the event
  const ev = await Event.findById(eventId);
  if (!ev) return res.status(404).json({ error: "Event not found" });

  // 3) Find existing guest subdoc or push a new one
  const idx = ev.guests.findIndex(g => g.user.equals(userId));
  if (idx >= 0) {
    ev.guests[idx].rsvp = status;
  } else {
    ev.guests.push({ user: userId, rsvp: status });
  }

  // 4) Save, then populate
  await ev.save();
  await ev.populate("guests.user", "userInfo email");

  // 5) Return the updated guest list
  return res.json({ guests: ev.guests });
}


const getInterestedEvents = async (req, res) => {
  try {
    const events = await eventService.getEventsByRSVP(req.user._id, 'interested');
    res.status(200).json(events);
  } catch (err) {
    console.error('Error fetching interested events:', err);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
};

const getGoingEvents = async (req, res) => {
  try {
    const events = await eventService.getEventsByRSVP(req.user._id, 'going');
    res.status(200).json(events);
  } catch (err) {
    console.error('Error fetching going events:', err);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
};
const getPublicEventsByUser = async (req, res) => {
  try {
    const events = await Event.find({
      createdBy: req.params.id,
      visibility: 'public',
      deleted: false,
    }).select('title startDate location type photos');

    res.status(200).json(events);
  } catch (err) {
    console.error('Error fetching public events:', err);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
};
const getUserLikedEventsById = async (req, res) => {
  try {
    const userId = req.params.id;
    const events = await eventService.getUserEventsByField(userId, "likes", true); // only public
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching liked events by user ID:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};


const getUserGoingEventsById = async (req, res) => {
  try {
    const userId = req.params.id;
    const events = await eventService.getEventsByRSVP(userId, "going", true); // true = only public
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching going events by user ID:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};



const uploadEventPhotos = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No photos provided" });
    }

    if (!eventId) {
      return res.status(400).json({ error: "Missing eventId" });
    }

    const photoUrls = req.files.map((file) => {
      return `${req.protocol}://${req.get("host")}/uploads/eventPhotos/${file.filename}`;
    });

    // ✅ Overwrite 'photos' field
    const updatedEvent = await eventService.setEventPhotos(eventId, photoUrls);

    res.status(200).json({
      message: "Photos uploaded successfully",
      photos: updatedEvent.photos,
    });
  } catch (error) {
    console.error("Error uploading photos:", error);
    res.status(500).json({ error: "PHOTO_UPLOAD_FAILED" });
  }
};

const getSoftDeletedEvents = async (req, res) => {
  try {
    const events = await Event.find({ deleted: true }).lean();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching soft deleted events" });
  }
};

module.exports = {
  getPublicEventsByUser,
  getGoingEvents,
  getInterestedEvents,
  getUserGoingEventsById,
  getUserLikedEventsById,
  getLikedEvents,
  getUserEventMedia,
  getMyEvents,
  get,
  toggleLike,
  toggleArchive,
  getById,
  add,
  updateById,
  deleteById,
  toggleField,
  getEventRSVPs,
  updateRSVP,
  notifyGuests,
  getEventRSVPs,
  uploadEventPhotos,
  softDeleteEvent,
  getSoftDeletedEvents,
};
