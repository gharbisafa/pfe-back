const Event = require("../models/event");
const EventMedia = require("../models/eventMedia");
const User = require("../models/user");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { ObjectId } = require("mongoose").Types;

const getUsers = async (filters) => {
  return await User.find(filters).lean();
};

const updateUserRole = async (userId, role) => {
  const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true });
  if (!updatedUser) throw new RecordNotFoundError("User not found");
  return updatedUser;
};

const softDeleteUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { deleted: true });
  if (!user) throw new RecordNotFoundError("User not found");
};

const banEvent = async (eventId) => {
  try {
    // Validate ObjectId
    if (!ObjectId.isValid(eventId)) {
      throw new DataValidationError("Invalid Event ID");
    }

    const event = await Event.findByIdAndUpdate(eventId, { banned: true });
    if (!event) throw new RecordNotFoundError("Event not found");
  } catch (error) {
    console.error("Error banning event:", error.message);
    throw error; // Propagate the error
  }
};

const getDeletedMedia = async () => {
  return await EventMedia.find({ deleted: true }).lean();
};

const restoreMedia = async (mediaId) => {
  const media = await EventMedia.findByIdAndUpdate(mediaId, { deleted: false }, { new: true });
  if (!media) throw new RecordNotFoundError("Media not found");
  return media;
};

const hardDeleteMedia = async (mediaId) => {
  const media = await EventMedia.findByIdAndDelete(mediaId);
  if (!media) throw new RecordNotFoundError("Media not found");
};

const getPlatformAnalytics = async () => {
  const totalUsers = await User.countDocuments({});
  const totalEvents = await Event.countDocuments({});
  const totalMedia = await EventMedia.countDocuments({});
  const deletedEvents = await Event.countDocuments({ deleted: true });
  const deletedMedia = await EventMedia.countDocuments({ deleted: true });

  return {
    totalUsers,
    totalEvents,
    totalMedia,
    deletedEvents,
    deletedMedia,
  };
};

module.exports = {
  getUsers,
  updateUserRole,
  softDeleteUser,
  banEvent,
  getDeletedMedia,
  restoreMedia,
  hardDeleteMedia,
  getPlatformAnalytics,
};