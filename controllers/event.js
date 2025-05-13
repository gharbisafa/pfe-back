// controllers/event.js
const Event = require("../models/event");
const eventService = require("../services/eventService");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");


const get = async (req, res) => {
  try {
    // 1) Parse & normalize pagination params
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // 2) Destructure the rest of the filters
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

    const filters = { visibility: "public" , deleted: false };

    if (type) filters.type = type;
    if (location) filters.location = { $regex: location, $options: "i" };
    if (search) {
      filters.$or = [
        { title:       { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location:    { $regex: search, $options: "i" } },
      ];
    }
    if (startDate && endDate) {
      filters.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 4) Build sort object
    const sort = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const { events, totalCount } = await eventService.getFilteredEventsWithCount({
      filters,
      sort,
      page,
      limit,
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;

    // 7) Send response
    res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      totalCount,
      totalPages,
      hasNextPage,
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

const getDeleted = async (req, res) => {
  try {
    const result = await eventService.getDeleted({}, {});
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};

const add = async (req, res) => {
  try {
    const result = await eventService.add(req.data);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof DataValidationError) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        details: error.issues.map(issue => ({
          field: issue.path,
          message: issue.message
        }))
      });
    }
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
  const { userId, rsvp } = req.body;
  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const existing = event.guests.find(g => g.user.toString() === userId);
    if (existing) existing.rsvp = rsvp;
    else event.guests.push({ user: userId, rsvp });
    await event.save();
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

// likes, going, interested
const toggleField = async (req, res) => {
  const { eventId } = req.params;
  const { field } = req.body;
  console.log("Toggling field:", { eventId, userId: req.user?._id, field });
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

module.exports = {
  getMyEvents,
  get,
  getById,
  getDeleted,
  add,
  updateById,
  deleteById,
  addRSVP,
  addComment,
  addFeedback,
  toggleField,
};
