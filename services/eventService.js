const Event = require("../models/event");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");
const { getPaginatedEvents } = require("./eventPaginationService");

const ObjectId = mongoose.Types.ObjectId;
const rsvpEnum = ["yes", "no", "maybe"];


async function getFilteredEventsWithCount({ filters, sort = {}, page = 1, limit = 10 }) {
  return await getPaginatedEvents(filters, {}, page, limit, sort);
}
function validateGuests(guests, userIds = []) {
  if (!Array.isArray(guests)) {
    throw new Error("Guests must be an array");
  }
  const seenUsers = new Set();
  return guests.map(guest => {
    // Basic validation
    if (typeof guest !== "object" || guest === null) {
      throw new Error("Each guest must be an object");
    }
    // Validate user reference
    if (!guest.user || !ObjectId.isValid(guest.user)) {
      throw new Error("Invalid user ID in guest list");
    }

    const guestUserId = guest.user.toString();

    // Check for duplicates in this guest list
    if (seenUsers.has(guestUserId)) {
      throw new Error(`Duplicate guest user: ${guestUserId}`);
    }
    seenUsers.add(guestUserId);

    // Check against additional user IDs (like creator)
    if (userIds.includes(guestUserId)) {
      throw new Error(`User ${guestUserId} cannot be both creator and guest`);
    }

    // Validate RSVP
    if (guest.rsvp && !rsvpEnum.includes(guest.rsvp)) {
      throw new Error(`Invalid RSVP status. Must be one of: ${rsvpEnum.join(", ")}`);
    }

    return {
      user: new ObjectId(guest.user),
      rsvp: guest.rsvp || "maybe"
    };
  });
}
// function validateGallery(gallery, currentUserId) {
//   if (!Array.isArray(gallery)) {
//     throw new Error("Gallery must be an array");
//   }

//   return gallery.map(item => {
//     // Basic validation
//     if (typeof item !== "object" || item === null) {
//       throw new Error("Each gallery item must be an object");
//     }

//     // Validate uploader matches current user
//     if (!item.uploadedBy || !ObjectId.isValid(item.uploadedBy)) {
//       throw new Error("Gallery item requires valid uploadedBy ID");
//     }

//     if (item.uploadedBy.toString() !== currentUserId.toString()) {
//       throw new Error("Cannot add gallery items for other users");
//     }

//     // Validate media
//     if (!item.mediaUrl || typeof item.mediaUrl !== "string") {
//       throw new Error("Gallery item requires mediaUrl string");
//     }

//     if (!item.mediaType || !["photo", "video"].includes(item.mediaType)) {
//       throw new Error("Gallery mediaType must be 'photo' or 'video'");
//     }

//     return {
//       uploadedBy: new ObjectId(item.uploadedBy),
//       mediaUrl: item.mediaUrl,
//       mediaType: item.mediaType,
//       uploadedAt: item.uploadedAt || new Date()
//     };
//   });
// }


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
  try {
    // Cast simple fields
    const castedData = castData(data, [
      "title", "description", "location",
      "startDate", "endDate", "startTime", "endTime",
      "price", "bookingLink", "type", "visibility", "createdBy"
    ]);
    if (!castedData) {
      throw new DataValidationError(Event, [{
        path: "root",
        message: "Invalid event data structure"
      }]);
    }
    // Parse guests if it's a JSON string
    if (typeof data.guests === "string") {
      try {
        data.guests = JSON.parse(data.guests);
      } catch {
        throw new DataValidationError(Event, [{
          path: "guests",
          message: "Invalid guests format. Must be a JSON array."
        }]);
      }
    }

    // Handle guests with creator validation
    if (data.guests) {
      castedData.guests = validateGuests(data.guests, [data.createdBy.toString()]);
    }
    // Handle photos (basic validation if needed)
    if (data.photos && Array.isArray(data.photos)) {
      castedData.photos = data.photos;
    }

    const event = new Event(castedData);
    await event.save();
    console.log("Event saved successfully:", event);
    return event;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(Event, Object.values(error.errors));
    }
    throw error;
  }
};

const updateById = async (eventId, updateData, currentUserId) => {
  try {
    // Cast simple fields
    const castedData = castData(updateData, [
      "title", "description", "location",
      "startDate", "endDate", "startTime", "endTime",
      "price", "bookingLink", "type", "visibility"
    ]);

    if (!castedData) {
      throw new DataValidationError(Event, [{
        path: "root",
        message: "Invalid update data structure"
      }]);
    }

    // Parse guests from string if needed
    if (updateData.guests) {
      if (typeof updateData.guests === "string") {
        try {
          updateData.guests = JSON.parse(updateData.guests);
        } catch {
          throw new DataValidationError(Event, [{
            path: "guests",
            message: "Invalid guests format. Must be a JSON array."
          }]);
        }
      }

      const event = await Event.findById(eventId).lean();
      if (!event) throw new RecordNotFoundError(Event, eventId);

      castedData.guests = validateGuests(updateData.guests, [
        event.createdBy.toString(),
        currentUserId.toString()
      ]);
    }

    // Add support for updating photos
    if (updateData.photos) {
      castedData.photos = updateData.photos;
    }

    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, deleted: { $ne: true } },
      castedData,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) throw new RecordNotFoundError(Event, eventId);
    return updatedEvent;
    
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(Event, Object.values(error.errors));
    }
    throw error;
  }
};


const deleteById = async (_id) => {
  let event = await Event.findById(_id).exec();
  if (!event) throw new RecordNotFoundError(Event, _id);
  if (event.deleted) return false;

  event.deleted = true;
  console.log("event.deleted", event);
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

