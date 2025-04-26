const Event = require("../models/event");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");
const { getPaginatedEvents } = require("./eventPaginationService");

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
    console.log(data)
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
  if (!data) return false;

  try {
    const event = new Event(data);
    await event.save();
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

module.exports = {
  getById,
  get,
  getDeleted,
  add,
  updateById,
  deleteById,
  getFilteredEventsWithCount,
};
