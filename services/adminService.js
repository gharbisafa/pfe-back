const Event = require("../models/event");
const EventMedia = require("../models/eventMedia");
const UserAccount = require("../models/userAccount");
const User = require("../models/user"); // if needed
const path = require("path"); // ✅ This line fixes the ReferenceError

const RecordNotFoundError = require("../errors/recordNotFoundError");
const DataValidationError = require("../errors/dataValidationError");
const { Types: { ObjectId } } = require("mongoose");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ——— Users ———————————————————————————————————————————————————————

// GET all users with full info
async function getUsers() {
  const userAccounts = await UserAccount.find({ deleted: { $ne: true } })
    .populate({
      path: "userInfo",
      select: "name email profileImage",
    })
    .lean();

  return userAccounts.map(u => {
    const rawPath = u.userInfo?.profileImage || null;
    const profileImage = rawPath ? `${BASE_URL}/uploads/profileImages/${path.basename(rawPath)}` : null;

    return {
      _id: u._id,
      role: u.role,
      createdAt: u.createdAt,
      deleted: u.deleted,
      profileImage,
      name: u.userInfo?.name ?? "Unknown",
      email: u.email ?? "Unknown",
    };
  });
}



// GET single user by ID with full info
async function getUserById(userId) {
  if (!ObjectId.isValid(userId)) {
    throw new DataValidationError("Invalid User ID");
  }

  const user = await UserAccount.findById(userId)
    .populate({
      path: "userInfo",
      select: "name email profileImage"
    })
    .lean();

  if (!user) throw new RecordNotFoundError("User not found");

  const rawPath = user.userInfo?.profileImage || null;
  const profileImage = rawPath ? `${BASE_URL}/uploads/profileImages/${path.basename(rawPath)}` : null;

  return {
    _id: user._id,
    role: user.role,
    createdAt: user.createdAt,
    deleted: user.deleted,
    profileImage,
    name: user.userInfo?.name ?? "Unknown",
    email: user.email ?? "Unknown"
  };
}

/**
 * PUT `/api/admin/users/:id` body `{ role }` → updated UserRecord
 */
async function updateUserRole(userId, role) {
  const u = await UserAccount.findByIdAndUpdate(userId, { role }, { new: true })
    .populate({
      path: "userInfo",
      select: "name email profileImage"
    })
    .lean();

  if (!u) throw new RecordNotFoundError("User not found");

  return {
    _id: u._id,
    role: u.role,
    createdAt: u.createdAt,
    profileImage: u.userInfo?.profileImage || "",
    name: u.userInfo?.name || "Unknown",
    email: u.email || "Unknown",
  };
}

/**
 * DELETE `/api/admin/users/:id` → soft-delete
 */
async function softDeleteUser(userId) {
  const u = await UserAccount.findByIdAndUpdate(userId, { deleted: true }, { new: true }).lean();
  if (!u) throw new RecordNotFoundError("User not found");
  return u;
}

// ——— Events ——————————————————————————————————————————————————————

async function banEvent(eventId) {
  if (!ObjectId.isValid(eventId)) {
    throw new DataValidationError("Invalid Event ID");
  }
  const ev = await Event.findByIdAndUpdate(eventId, { banned: true }, { new: true }).lean();
  if (!ev) throw new RecordNotFoundError("Event not found");
  return ev;
}

async function getDeletedEvents() {
  return Event.find({ deleted: true }).lean();
}

async function restoreEvent(eventId) {
  const ev = await Event.findByIdAndUpdate(eventId, { deleted: false }, { new: true }).lean();
  if (!ev) throw new RecordNotFoundError("Event not found");
  return ev;
}

async function hardDeleteEvent(eventId) {
  const ev = await Event.findByIdAndDelete(eventId).lean();
  if (!ev) throw new RecordNotFoundError("Event not found");
  return ev;
}

// ——— Media ——————————————————————————————————————————————————————

async function getDeletedMedia() {
  return EventMedia.find({ deleted: true }).lean();
}

async function restoreMedia(mediaId) {
  const m = await EventMedia.findByIdAndUpdate(mediaId, { deleted: false }, { new: true }).lean();
  if (!m) throw new RecordNotFoundError("Media not found");
  return m;
}

async function hardDeleteMedia(mediaId) {
  const m = await EventMedia.findByIdAndDelete(mediaId).lean();
  if (!m) throw new RecordNotFoundError("Media not found");
  return m;
}

// ——— Analytics —————————————————————————————————————————————————————

async function getPlatformAnalytics() {
  const totalUsers = await UserAccount.countDocuments({});
  const totalEvents = await Event.countDocuments({});
  const totalMedia = await EventMedia.countDocuments({});
  const deletedEvents = await Event.countDocuments({ deleted: true });
  const deletedMedia = await EventMedia.countDocuments({ deleted: true });

  return { totalUsers, totalEvents, totalMedia, deletedEvents, deletedMedia };
}

// ——— Events by User ——————————————————————————————————————————————

async function getEventsByUser(userId) {
  if (!ObjectId.isValid(userId)) {
    throw new DataValidationError("Invalid User ID");
  }

  return Event.find({ createdBy: userId, deleted: false })
    .select("title startDate endDate location photos type")
    .lean()
    .then(events =>
      events.map(ev => ({
        ...ev,
        bannerUrl: ev.photos?.[0]
          ? `${BASE_URL}/uploads/eventPhotos/${ev.photos[0]}`
          : null
      }))
    );
}

async function getAllEvents() {
  return Event.find({ deleted: false })
    .populate({
      path: "createdBy",
      select: "_id userInfo role",
      populate: {
        path: "userInfo",
        select: "name email profileImage"
      }
    })
    .lean();
}

module.exports = {
  getUsers,
  getUserById,
  updateUserRole,
  softDeleteUser,
  banEvent,
  getDeletedEvents,
  restoreEvent,
  hardDeleteEvent,
  getAllEvents,
  getDeletedMedia,
  restoreMedia,
  hardDeleteMedia,
  getPlatformAnalytics,
  getEventsByUser,
};
