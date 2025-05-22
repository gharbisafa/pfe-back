// services/adminService.js

const Event = require("../models/event");
const EventMedia = require("../models/eventMedia");
const User = require("../models/user");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const DataValidationError = require("../errors/dataValidationError");
const { Types: { ObjectId } } = require("mongoose");

// ——— Users ———————————————————————————————————————————————————————

/**
 * GET `/api/admin/users` → all users (optionally filter by query)
 */
async function getUsers(filters = {}) {
  return User.find(filters).lean();
}

/**
 * GET `/api/admin/users/:id` → single user
 */
async function getUserById(userId) {
  if (!ObjectId.isValid(userId)) {
    throw new DataValidationError("Invalid User ID");
  }
  const u = await User.findById(userId).lean();
  if (!u) throw new RecordNotFoundError("User not found");
  return u;
}

/**
 * PUT `/api/admin/users/:id` body `{ role }` → updated UserRecord
 */
async function updateUserRole(userId, role) {
  const u = await User.findByIdAndUpdate(userId, { role }, { new: true }).lean();
  if (!u) throw new RecordNotFoundError("User not found");
  return u;
}

/**
 * DELETE `/api/admin/users/:id` → soft‐delete
 */
async function softDeleteUser(userId) {
  const u = await User.findByIdAndUpdate(userId, { deleted: true }, { new: true }).lean();
  if (!u) throw new RecordNotFoundError("User not found");
  return u;
}

// ——— Events ——————————————————————————————————————————————————————

/**
 * (Example) PUT `/api/admin/events/:id/ban`
 */
async function banEvent(eventId) {
  if (!ObjectId.isValid(eventId)) {
    throw new DataValidationError("Invalid Event ID");
  }
  const ev = await Event.findByIdAndUpdate(eventId, { banned: true }, { new: true }).lean();
  if (!ev) throw new RecordNotFoundError("Event not found");
  return ev;
}

/**
 * GET `/api/admin/events/deleted` → EventRecord[]
 */
async function getDeletedEvents() {
  return Event.find({ deleted: true }).lean();
}

/**
 * PUT `/api/admin/events/restore/:id` → restored EventRecord
 */
async function restoreEvent(eventId) {
  const ev = await Event.findByIdAndUpdate(eventId, { deleted: false }, { new: true }).lean();
  if (!ev) throw new RecordNotFoundError("Event not found");
  return ev;
}

/**
 * DELETE `/api/admin/events/:id` → hard-delete
 */
async function hardDeleteEvent(eventId) {
  const ev = await Event.findByIdAndDelete(eventId).lean();
  if (!ev) throw new RecordNotFoundError("Event not found");
  return ev;
}

// ——— Media ——————————————————————————————————————————————————————

/**
 * GET `/api/admin/media/deleted` → MediaRecord[]
 */
async function getDeletedMedia() {
  return EventMedia.find({ deleted: true }).lean();
}

/**
 * PUT `/api/admin/media/restore/:id` → restored MediaRecord
 */
async function restoreMedia(mediaId) {
  const m = await EventMedia.findByIdAndUpdate(mediaId, { deleted: false }, { new: true }).lean();
  if (!m) throw new RecordNotFoundError("Media not found");
  return m;
}

/**
 * DELETE `/api/admin/media/:id` → hard-delete
 */
async function hardDeleteMedia(mediaId) {
  const m = await EventMedia.findByIdAndDelete(mediaId).lean();
  if (!m) throw new RecordNotFoundError("Media not found");
  return m;
}

// ——— Analytics —————————————————————————————————————————————————————

/**
 * GET `/api/admin/analytics` → Analytics
 */
async function getPlatformAnalytics() {
  const totalUsers = await User.countDocuments({});
  const totalEvents = await Event.countDocuments({});
  const totalMedia = await EventMedia.countDocuments({});
  const deletedEvents = await Event.countDocuments({ deleted: true });
  const deletedMedia = await EventMedia.countDocuments({ deleted: true });

  return { totalUsers, totalEvents, totalMedia, deletedEvents, deletedMedia };
}

// ——— NEW: fetch all events created by a given user ——————————————————

/**
 * GET `/api/admin/users/:id/events` → EventRecord[]
 */
async function getEventsByUser(userId) {
  // you may want to validate the ID first…
  return Event.find({ createdBy: userId, deleted: false }).lean();
}

async function getAllEvents() {
  return Event.find({ deleted: false })
    .populate({
      path: "createdBy",               // → this is the UserAccount doc
      select: "_id userInfo role",     // pick whatever you need
      populate: {
        path: "userInfo",               // inside UserAccount, userInfo → the actual User
        select: "name email profileImage"
      }
    })
    .lean();
}

// ————————————————————————————————————————————————————————————————————————
module.exports = {
  // users
  getUsers,
  getUserById,
  updateUserRole,
  softDeleteUser,

  // events
  banEvent,
  getDeletedEvents,
  restoreEvent,
  hardDeleteEvent,
  getAllEvents,

  // media
  getDeletedMedia,
  restoreMedia,
  hardDeleteMedia,

  // analytics
  getPlatformAnalytics,

  // new
  getEventsByUser,
};
