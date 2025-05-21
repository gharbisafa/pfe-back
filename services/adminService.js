// services/adminService.js

const Event       = require("../models/event");
const EventMedia  = require("../models/eventMedia");
const User        = require("../models/user");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const DataValidationError = require("../errors/dataValidationError");
const { Types: { ObjectId } } = require("mongoose");

// ——— Users ———————————————————————————————————————————————————————

/** GET `/api/admin/users` → UserRecord[] */
async function getUsers(filters = {}) {
  return User.find(filters).lean();
}

/** PUT `/api/admin/users/:id` body `{ role }` → updated UserRecord */
async function updateUserRole(userId, role) {
  const u = await User.findByIdAndUpdate(userId, { role }, { new: true });
  if (!u) throw new RecordNotFoundError("User not found");
  return u;
}

/** DELETE `/api/admin/users/:id` soft-delete */
async function softDeleteUser(userId) {
  const u = await User.findByIdAndUpdate(userId, { deleted: true }, { new: true });
  if (!u) throw new RecordNotFoundError("User not found");
}

/** (Example) PUT `/api/admin/events/:id/ban` */
async function banEvent(eventId) {
  if (!ObjectId.isValid(eventId)) {
    throw new DataValidationError("Invalid Event ID");
  }
  const ev = await Event.findByIdAndUpdate(eventId, { banned: true }, { new: true });
  if (!ev) throw new RecordNotFoundError("Event not found");
}

// ——— Events ——————————————————————————————————————————————————————

/** GET `/api/admin/events/deleted` → EventRecord[] */
async function getDeletedEvents() {
  return Event.find({ deleted: true }).lean();
}

/** PUT `/api/admin/events/restore/:id` → restored EventRecord */
async function restoreEvent(eventId) {
  const ev = await Event.findByIdAndUpdate(
    eventId,
    { deleted: false },
    { new: true }
  );
  if (!ev) throw new RecordNotFoundError("Event not found");
  return ev;
}

/** DELETE `/api/admin/events/:id` → hard-delete */
async function hardDeleteEvent(eventId) {
  const ev = await Event.findByIdAndDelete(eventId);
  if (!ev) throw new RecordNotFoundError("Event not found");
}

// ——— Media ——————————————————————————————————————————————————————

/** GET `/api/admin/media/deleted` → MediaRecord[] */
async function getDeletedMedia() {
  return EventMedia.find({ deleted: true }).lean();
}

/** PUT `/api/admin/media/restore/:id` → restored MediaRecord */
async function restoreMedia(mediaId) {
  const m = await EventMedia.findByIdAndUpdate(
    mediaId,
    { deleted: false },
    { new: true }
  );
  if (!m) throw new RecordNotFoundError("Media not found");
  return m;
}

/** DELETE `/api/admin/media/:id` → hard-delete */
async function hardDeleteMedia(mediaId) {
  const m = await EventMedia.findByIdAndDelete(mediaId);
  if (!m) throw new RecordNotFoundError("Media not found");
}

// ——— Analytics —————————————————————————————————————————————————————

/** GET `/api/admin/analytics` → Analytics */
async function getPlatformAnalytics() {
  const totalUsers     = await User.countDocuments({});
  const totalEvents    = await Event.countDocuments({});
  const totalMedia     = await EventMedia.countDocuments({});
  const deletedEvents  = await Event.countDocuments({ deleted: true });
  const deletedMedia   = await EventMedia.countDocuments({ deleted: true });

  return { totalUsers, totalEvents, totalMedia, deletedEvents, deletedMedia };
}

// ————————————————————————————————————————————————————————————————————————
module.exports = {
  // users
  getUsers,
  updateUserRole,
  softDeleteUser,

  // events
  banEvent,
  getDeletedEvents,
  restoreEvent,
  hardDeleteEvent,

  // media
  getDeletedMedia,
  restoreMedia,
  hardDeleteMedia,

  // analytics
  getPlatformAnalytics,
};
