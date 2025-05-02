const Event = require("../models/event");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");
const { getPaginatedEvents } = require("./eventPaginationService");

const ObjectId = mongoose.Types.ObjectId;

async function getFilteredEventsWithCount({ filters, sort = {}, page = 1, limit = 10 }) {
  return await getPaginatedEvents(filters, {}, page, limit, sort);
}

const getById = async (_id) => {
  let event = await Event.findById(_id).lean().exec();
  if (!event || event.deleted) return false;
  return event;
};

const get = async (filter = {}, projection = {}) => {
  let events = await Event.find(
    {
      $or: [
        { deleted: { $exists: false } },
        { deleted: { $exists: true, $eq: false } },
      ],
      ...filter,
    },
    projection
  )
    .lean()
    .exec();
  return events;
};

const getDeleted = async (filter = {}, projection = {}) => {
  let events = await Event.find({ ...filter, deleted: true }, projection)
    .lean()
    .exec();
  return events;
};

const add = async (data) => {
  console.log(data);
  data = castData(data, [
    "title",
    "description",
    "location",
    "startDate",
    "endDate",
    "startTime",      
    "endTime", 
    "price",
    "bookingLink",
    "type",
    "visibility",
    "createdBy",
    "photos",      // <-- Optional
    "guests",      // <-- Optional
    "gallery",     // <-- Optional
  ]);
  if (!data) {
    console.error("Invalid data after casting.");
    return false;
  }

  try {
    const event = new Event(data);
    console.log("Event created successfully:", event);
    await event.save();
    console.log("Event saved successfully:", event);
    return event;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(Event, error.errors);
    } else {
      throw error;
    }
  }
};

const updateById = async (_id, data) => {
  data = castData(data, [
    "title",
    "description",
    "location",
    "startDate",
    "endDate",
    "startTime",     
    "endTime",  
    "price",
    "bookingLink",
    "type",
    "visibility",
  ]);
  if (!data) return false;

  try {
    const event = await Event.findOneAndUpdate({ _id }, data, {
      new: true,
      runValidators: true,
    }).exec();
    if (!event || event.deleted) throw new RecordNotFoundError(Event, _id);
    return event;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(Event, error.errors);
    } else {
      throw error;
    }
  }
};

const deleteById = async (_id) => {
  let event = await Event.findById(_id).exec();
  if (!event) throw new RecordNotFoundError(Event, _id);
  if (event.deleted) return false;
  
  event.deleted = true;
  console.log("event.deleted",event);
  await event.save();
  return event;
  
};

//likes,going,interested

const toggleEventField = async (eventId, userId, field) => {
  console.log("Raw eventId:", eventId);
console.log("Type of eventId:", typeof eventId);
console.log("Is valid ObjectId:", ObjectId.isValid(eventId));

  const validFields = ["likes", "going", "interested"];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid field: ${field}`);
  }

  // Ensure eventId is a valid ObjectId
  if (!ObjectId.isValid(eventId)) {
    throw new Error("Invalid event ID");
  }

  const event = await Event.findById(new ObjectId(eventId));
  if (!event) throw new Error("Event not found");

  const userIdStr = userId.toString();

  // Ensure userId comparison is consistent
  const index = event[field].map(id => id.toString()).indexOf(userIdStr);
  if (index > -1) {
    event[field].splice(index, 1); // Remove if exists
  } else {
    event[field].push(userId); // Add if new
  }

  await event.save();
  return event;
};


module.exports = {
  getById,
  get,
  getDeleted,
  add,
  updateById,
  deleteById,
  getFilteredEventsWithCount,
  toggleEventField
};
