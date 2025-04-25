const Event = require("../models/event");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");
const { getPaginatedEvents } = require("./eventPaginationService");

const getById = async (_id) => {
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return false;
  }
  const event = await Event.findById(_id).lean().exec();
  if (!event || event.deleted) {
    return false;
  }
  return event;
};

const get = async (filter = {}, projection = {}) => {
  const events = await Event.find(
    {
      $or: [
        { deleted: { $exists: false } },
        { deleted: { $exists: true, $eq: false } },
      ],
      ...filter,
    },
    projection
  ).lean().exec();
  return events;
};

const getDeleted = async (filter = {}, projection = {}) => {
  const events = await Event.find({ ...filter, deleted: true }, projection)
    .lean()
    .exec();
  return events;
};

const add = async (data, session) => {
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
    "organizer",
    "photos",
    "guests",
    "gallery",
  ]);
  if (!data) {
    return false;
  }
  try {
    const event = new Event(data);
    await event.save({ session });
    return event;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(Event, error.errors);
    } else {
      throw error;
    }
  }
};

const updateById = async (_id, data, session) => {
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new RecordNotFoundError(Event, _id);
  }

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
  if (!data) {
    return false;
  }
  try {
    const event = await Event.findOneAndUpdate({ _id }, data, {
      new: true,
      runValidators: true,
      session,
    }).exec();
    if (!event || event.deleted) {
      throw new RecordNotFoundError(Event, _id);
    }
    return event;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(Event, error.errors);
    } else {
      throw error;
    }
  }
};

const deleteById = async (_id, session) => {
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new RecordNotFoundError(Event, _id);
  }

  const event = await Event.findById(_id).session(session).exec();
  if (!event || event.deleted) {
    return false;
  }

  event.deleted = true;
  await event.save({ session });
  return event;
};

const getFilteredEventsWithCount = async ({
  filters,
  sort = {},
  page = 1,
  limit = 10,
}) => {
  return await getPaginatedEvents(filters, {}, page, limit, sort);
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
