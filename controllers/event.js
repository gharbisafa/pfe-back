const Event = require("../models/event");
const eventService = require("../services/eventService");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");
const mongoose = require("mongoose");

const notificationService = require("../services/notificationService");
const Reservation = require("../models/reservation");



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
      limit = 12,
      search,
    } = req.query;

    const filters = { visibility: "public", deleted: false };

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
      filters.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sort = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Fetch paginated events and pagination info
    const { events, pagination } = await eventService.getFilteredEventsWithCount({
      filters,
      sort,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      page: pagination.currentPage,
      limit: parseInt(limit),
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

// Add Event
const add = async (req, res) => {
  try {
    const event = await eventService.add(req.data);

    if (event.guests?.length) {
      await notifyGuests(event, event.guests);
    }

    res.status(201).json(event);
  } catch (error) {
    console.error("Event creation failed:", error);
    res.status(500).json({ error: "EVENT_CREATION_FAILED" });
  }
};

const updateById = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      files: req.files
    };

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
// Update Event
// const updateById = async (req, res) => {
//   try {
//     const event = await eventService.updateById(req.params.id, req.body, req.user._id);

//     // Notify new guests only
//     const existingEvent = await Event.findById(req.params.id).lean();
//     const existingGuestIds = existingEvent.guests.map((g) => g.user.toString());
//     const newGuests = req.body.guests.filter(
//       (g) => !existingGuestIds.includes(g.user.toString())
//     );

//     if (newGuests.length) {
//       await notifyGuests(event, newGuests);
//     }

//     res.status(200).json(event);
//   } catch (error) {
//     console.error("Event update failed:", error);
//     res.status(500).json({ error: "EVENT_UPDATE_FAILED" });
//   }
// };


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

const addRSVP = async (req, res) => {
  const { eventId } = req.params;
  const { rsvp } = req.body;
  try {
    const event = await Event.findById(eventId).populate("createdBy guests.user");
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Update RSVP for the guest
    const existingGuest = event.guests.find((g) => g.user._id.equals(req.user._id));
    if (existingGuest) {
      existingGuest.rsvp = rsvp;
    } else {
      return res.status(400).json({ error: "You are not a guest for this event" });
    }
    await event.save();

    // Notify the event creator
    const message = `${req.user.name} responded to the invitation with "${rsvp}"`;
    await notificationService.createNotification(
      event.createdBy._id,
      "guest_response",
      message,
      event._id
    );

    res.status(200).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "RSVP_FAILED" });
  }
};

const addComment = async (req, res) => {
  const { eventId } = req.params;
  const { userId, text } = req.body;
  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    event.comments.push({ author: userId, message: text });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "COMMENT_FAILED" });
  }
};

const addFeedback = async (req, res) => {
  const { eventId } = req.params;
  const { userId, rating, text } = req.body;
  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    event.feedbacks.push({ user: userId, rating, message: text });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "FEEDBACK_FAILED" });
  }
};
//likes,going,interested
const toggleField = async (req, res) => {
  const { eventId } = req.params; // Changed from `id` to match route
  const { field } = req.body;

  console.log("Toggling field:", { eventId, userId: req.user?._id, field }); // Debug

  try {
    const updatedEvent = await eventService.toggleEventField(
      eventId,
      req.user._id,
      field
    );
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error toggling field:", error);
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

// Get all events the user marked as "interested"
const getInterestedEvents = async (req, res) => {
  try {
    const events = await eventService.getUserEventsByField(req.user._id, "interested");
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching interested events:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

// Get all events the user marked as "going"
const getGoingEvents = async (req, res) => {
  try {
    const events = await eventService.getUserEventsByField(req.user._id, "going");
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching going events:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

// Get all events the user marked as "liked"
const getLikedEvents = async (req, res) => {
  try {
    const events = await eventService.getUserEventsByField(req.user._id, "likes");
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching liked events:", error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

// Get all media the user posted in the event media
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

      if (!guest.user) {
        throw new Error("Guest user is missing");
      }

      const message = `You've been invited to the event "${event.title}"`;


      return notificationService.createNotification({
        user: guest.user, // Ensure this is populated
        type: "guest_invitation",
        message,
        event: event._id, // Ensure this is the event ID
      });
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error("Error notifying guests:", error);
    throw new Error("NOTIFICATION_CREATION_FAILED");
  }
};
// Event Creation/Update Function to Notify Guests
// const notifyGuests = async (event, newGuests) => {
//   const notifications = newGuests.map((guest) => {
//     const message = `You've been invited to the event "${event.title}"`;
//     return notificationService.createNotification(guest.user, "guest_invitation", message, event._id);
//   });
//   await Promise.all(notifications);
// };

module.exports = {
  getInterestedEvents,
  getGoingEvents,
  getLikedEvents,
  getUserEventMedia,
  getMyEvents,
  get,
  getById,
  add,
  updateById,
  deleteById,
  addRSVP,
  addComment,
  addFeedback,
  toggleField, 
};


