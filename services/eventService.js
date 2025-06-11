const Event = require("../models/event");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData } = require("../utils/general");
const { getPaginatedEvents } = require("./eventPaginationService");
const axios = require("axios");
const EventMedia = require("../models/eventMedia");
const RSVP = require("../models/rsvp");
// Add this line:
const Reservation = require("../models/reservation"); // Import the Reservation model
const path = require("path");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000"; // Adjust as needed

const ObjectId = mongoose.Types.ObjectId;
const rsvpEnum = ["yes", "no", "maybe"];

function formatEventWithBanner(event) {
  const firstPhoto = event.photos?.[0];
  return {
    ...event,
    bannerUrl: firstPhoto ? `${BASE_URL}/uploads/eventPhotos/${path.basename(firstPhoto)}` : null,
  };
}



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

// Get events by specific field ("likes", "going", "interested")
const getUserEventsByField = async (userId, field, publicOnly = false) => {
  if (!["likes", "going", "interested"].includes(field)) {
    throw new Error("Invalid field for user events");
  }

  const query = {
    [field]: userId,
    deleted: false,
  };

  if (publicOnly) {
    query.visibility = "public";
  }

  const events = await Event.find(query)
    .select("title startDate photos visibility") // 👈 is this present now?
    .lean()
    .exec();

  return events;
};



// Get media the user posted in the event media
const getUserEventMedia = async (userId) => {
  const media = await EventMedia.find({
    user: userId,
    deleted: false, // Ensure the media is not deleted
  })
    .lean()
    .exec();

  return media;
};
async function getEventsByRSVP(userId, status) {
  // Find all RSVPs for this user+status, populate the event
  const rsvps = await RSVP.find({ user: userId, status })
    .populate({
      path: 'event',
      match: { deleted: false, visibility: 'public' }
    })
    .lean();

  // Extract the event objects (filtering out any nulls)
  return rsvps
    .map(r => r.event)
    .filter(evt => evt);
}

const getById = async (eventId, viewerId) => {
  const event = await Event.findById(eventId)
    .populate({
      path: "createdBy",
      populate: {
        path: "userInfo",
        model: "User",
        select: "name email profileImage",
      },
    })
    .populate({
      path: "guests.user",
      model: "UserAccount",
      populate: {
        path: "userInfo",
        model: "User",
        select: "name",
      },
    })
    .lean();
  if (!event) throw new RecordNotFoundError(Event, eventId);

  // Populate guests based on reservations
  const reservations = await Reservation.find({ event: eventId, status: "confirmed" }).select("user");
  event.guests = reservations.map((r) => ({ user: r.user, rsvp: "yes" }));

  const isLiked = event.likes && event.likes.some((like) => like.toString() === viewerId);
  return { ...formatEventWithBanner(event), isLiked, likesCount: event.likes.length };
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

  return events.map(formatEventWithBanner);
};


// ─── Helper: forward-geocode via Nominatim ───────────────────────
async function geocodeLocation(location) {
  const url = 'https://nominatim.openstreetmap.org/search';
  const resp = await axios.get(url, {
    params: { q: location, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'YourAppName/1.0' },
    timeout: 5000,
  });
  if (Array.isArray(resp.data) && resp.data.length > 0) {
    const { lat, lon } = resp.data[0];
    return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
  }
  return null;
}

// ─── Updated add() ───────────────────────────────────────────────
const add = async (data) => {
  try {
    // 1) Cast simple fields
    const castedData = castData(data, [
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
      "createdBy"
    ]);
    if (!castedData) {
      throw new DataValidationError(Event, [{
        path: "root",
        message: "Invalid event data structure"
      }]);
    }

    // 2) Parse & validate guests
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
    if (data.guests) {
      castedData.guests = validateGuests(data.guests, [
        castedData.createdBy.toString()
      ]);
    }

    // 3) Handle photos array
    if (data.photos && Array.isArray(data.photos)) {
      castedData.photos = data.photos;
    }

    // ─── 4) GEOCODE the location ────────────────────────────────
    try {
      const coords = await geocodeLocation(castedData.location);
      if (coords) {
        castedData.latitude = coords.latitude;
        castedData.longitude = coords.longitude;
      }
    } catch (geoErr) {
      console.error("Geocoding failed for", castedData.location, geoErr);
      // we continue even if geocode fails; event still saves
    }

    // 5) Create & save the event
    const event = new Event(castedData);
    await event.save();

    // // 6) Notify admins (existing logic)
    // await notificationService.createSharedNotification({
    //   type: "add_event",
    //   message: `A new event "${event.title}" has been created.`,
    //   event: event._id,
    // });

    return event;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(Event, Object.values(error.errors));
    }
    throw error;
  }
};
// const add = async (data) => {
//   try {
//     // Cast simple fields
//     const castedData = castData(data, [
//       "title", "description", "location",
//       "startDate", "endDate", "startTime", "endTime",
//       "price", "bookingLink", "type", "visibility", "createdBy"
//     ]);
//     if (!castedData) {
//       throw new DataValidationError(Event, [{
//         path: "root",
//         message: "Invalid event data structure"
//       }]);
//     }
//     // Parse guests if it's a JSON string
//     if (typeof data.guests === "string") {
//       try {
//         data.guests = JSON.parse(data.guests);
//       } catch {
//         throw new DataValidationError(Event, [{
//           path: "guests",
//           message: "Invalid guests format. Must be a JSON array."
//         }]);
//       }
//     }

//     // Handle guests with creator validation
//     if (data.guests) {
//       castedData.guests = validateGuests(data.guests, [data.createdBy.toString()]);
//     }
//     // Handle photos (basic validation if needed)
//     if (data.photos && Array.isArray(data.photos)) {
//       castedData.photos = data.photos;
//     }
//     // Notify admins
//     await notificationService.createSharedNotification({
//       type: "add_event",
//       message: `A new event "${event.title}" has been created.`,
//       event: event._id,
//     });

//     const event = new Event(castedData);
//     await event.save();
//     return event;
//   } catch (error) {
//     if (error instanceof mongoose.Error.ValidationError) {
//       throw new DataValidationError(Event, Object.values(error.errors));
//     }
//     throw error;
//   }
// };
const updateById = async (eventId, updateData, currentUserId) => {
  try {
    // Event update logic remains the same
    const castedData = castData(updateData, [
      "title", "description", "location",
      "startDate", "endDate", "startTime", "endTime",
      "price", "bookingLink", "type", "visibility"
    ]);

    let newGuests = [];
    if (updateData.guests) {
      if (typeof updateData.guests === "string") {
        updateData.guests = JSON.parse(updateData.guests);
      }

      const event = await Event.findById(eventId).lean();
      if (!event) throw new RecordNotFoundError(Event, eventId);

      castedData.guests = validateGuests(updateData.guests, [
        event.createdBy.toString(),
        currentUserId.toString()
      ]);

      const existingGuestIds = event.guests.map((g) => g.user.toString());
      newGuests = updateData.guests.filter(
        (g) => !existingGuestIds.includes(g.user.toString())
      );
    }

    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, deleted: { $ne: true } },
      castedData,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) throw new RecordNotFoundError(Event, eventId);

    // Notify users
    // const event = await Event.findById(eventId).lean();
    // const guestsToNotify = event.guests.map((g) => g.user.toString());
    // const goingToNotify = event.going.map((g) => g.toString());
    // const usersToNotify = [...new Set([...guestsToNotify, ...goingToNotify])];

    // await notificationService.notifyUsers(updatedEvent, usersToNotify);

    // if (newGuests.length > 0) {
    //   await notificationService.notifyGuests(updatedEvent, newGuests);
    // }

    return updatedEvent;
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(Event, Object.values(error.errors));
    }
    throw error;
  }
};

//     // Update the event in the database
//     const updatedEvent = await Event.findOneAndUpdate(
//       { _id: eventId, deleted: { $ne: true } },
//       castedData,
//       { new: true, runValidators: true }
//     );

//     if (!updatedEvent) throw new RecordNotFoundError(Event, eventId);

//     // Notify all relevant users
//     const event = await Event.findById(eventId).lean();
//     const guestsToNotify = event.guests.map((g) => g.user.toString());
//     const goingToNotify = event.going.map((g) => g.toString());

//     // Combine and remove duplicates
//     const usersToNotify = [...new Set([...guestsToNotify, ...goingToNotify])];

//     // Send notifications
//     await notificationService.notifyUsers(updatedEvent, usersToNotify);

//     return updatedEvent;

//   } catch (error) {
//     if (error instanceof mongoose.Error.ValidationError) {
//       throw new DataValidationError(Event, Object.values(error.errors));
//     }
//     throw error;
//   }
// };
// const deleteById = async (_id) => {
//   let event = await Event.findById(_id).exec();
//   if (!event) throw new RecordNotFoundError(Event, _id);
//   if (event.deleted) return false;

//   event.deleted = true;
//   console.log("event.deleted", event);
//   await event.save();
//   return event;

// };
const deleteById = async (_id) => {
  const event = await Event.findById(_id).exec();
  if (!event) throw new RecordNotFoundError(Event, _id);
  if (event.deleted) return false;

  event.deleted = true;
  await event.save();

  // // Notify attendees
  // const userIdsToNotify = [
  //   ...event.guests.map((g) => g.user.toString()),
  //   ...event.going.map((g) => g.toString())
  // ];

  // await notificationService.notifyEventDeletion(event, userIdsToNotify);

  // // Notify admins
  // await notificationService.createSharedNotification({
  //   type: "delete_event",
  //   message: `The event "${event.title}" has been deleted.`,
  //   event: event._id,
  // });

  return event;
};


//likes
const toggleEventField = async (eventId, userId, field) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  const userIdStr = userId.toString();
  const index = event[field].map((id) => id.toString()).indexOf(userIdStr);

  if (index > -1) {
    event[field].splice(index, 1);
  } else {
    event[field].push(userId);

    // if (field === "likes" && event.createdBy.toString() !== userIdStr) {
    //   await notificationService.notifyEventLike(eventId, event.createdBy);
    // }
  }

  await event.save();
  return event;
};
// const toggleEventField = async (eventId, userId, field) => {

//   const validFields = ["likes"];
//   if (!validFields.includes(field)) {
//     throw new Error(`Invalid field: ${field}`);
//   }

//   // Ensure eventId is a valid ObjectId
//   if (!ObjectId.isValid(eventId)) {
//     throw new Error("Invalid event ID");
//   }

//   const event = await Event.findById(new ObjectId(eventId));
//   if (!event) throw new Error("Event not found");

//   const userIdStr = userId.toString();

//   // Ensure userId comparison is consistent
//   const index = event[field].map(id => id.toString()).indexOf(userIdStr);
//   if (index > -1) {
//     event[field].splice(index, 1); // Remove if exists
//   } else {
//     event[field].push(userId); // Add if new
//   }

//   await event.save();
//   return event;
// };
const toggleEventArchive = async (eventId, userId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  // Ensure the user is the event creator
  if (event.createdBy.toString() !== userId.toString()) {
    throw new Error("You are not authorized to archive or unarchive this event.");
  }

  // Toggle the archive status
  event.isArchived = !event.isArchived;
  await event.save();

  return event;
};

// const updateRSVP = async (eventId, userId, status) => {
//   try {
//     // Validate event exists
//     const event = await Event.findById(eventId);
//     if (!event) throw new Error("Event not found");

//     // Find or update RSVP
//     const existingRSVP = await RSVP.findOne({ event: eventId, user: userId });
//     if (existingRSVP) {
//       existingRSVP.status = status;
//       await existingRSVP.save();
//       return existingRSVP;
//     }

//     const newRSVP = await RSVP.create({ event: eventId, user: userId, status });
//     return newRSVP;
//   } catch (error) {
//     console.error("Error updating RSVP:", error);
//     throw error;
//   }
// };
const updateRSVP = async (eventId, userId, status) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    const existingRSVP = await RSVP.findOne({ event: eventId, user: userId });
    if (existingRSVP) {
      existingRSVP.status = status;
      await existingRSVP.save();
    } else {
      await RSVP.create({ event: eventId, user: userId, status });
    }

    // Notify event creator
    // await notificationService.notifyNewRSVP(eventId, event.createdBy, status);

    return existingRSVP || { event: eventId, user: userId, status };
  } catch (error) {
    console.error("Error updating RSVP:", error);
    throw error;
  }
};


async function getEventsByRSVP(userId, status, publicOnly = false) {
  const rsvps = await RSVP.find({ user: userId, status }).select("event");
  const eventIds = rsvps.map(r => r.event);
  const query = { _id: { $in: eventIds } };
  if (publicOnly) {
    query.visibility = 'public';
    query.deleted = false;
  }
  return await Event.find(query);
};


module.exports = {
  getEventsByRSVP,
  getUserEventsByField,
  getUserEventMedia,
  getById,
  get,
  add,
  updateById,
  deleteById,
  getFilteredEventsWithCount,
  toggleEventField,
  toggleEventArchive,
  updateRSVP,
  getEventsByRSVP,
  geocodeLocation,
};

