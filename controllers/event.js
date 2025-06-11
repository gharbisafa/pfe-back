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
      search,
    } = req.query;

    const filters = { deleted: false };

    if (req.query.visibility === "public") {
      filters.visibility = "public";
    }
    if (type) filters.type = type;
    if (location) filters.location = { $regex: location, $options: "i" };
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filters.$or = [
        { startDate: { $lte: end }, endDate: { $gte: start } },
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
      ];
    }

    const sort = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const { events, pagination } = await eventService.getFilteredEventsWithCount({
      filters,
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
    const event = await eventService.getById(req.params.id, req.user?._id);
    if (!event) return res.status(404).json({ error: "NOT_FOUND_OR_ACCESS_DENIED" });
    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching the event" });
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

const updateRSVP = async (req, res) => {
  const { eventId } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  try {
    if (!["going", "interested", "notgoing"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const updatedRSVP = await eventService.updateRSVP(eventId, userId, status);
    await notificationService.notifyNewRSVP(eventId, event.createdBy, status);
    res.status(200).json(updatedRSVP);
  } catch (error) {
    console.error("Error updating RSVP:", error);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
};

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
};
