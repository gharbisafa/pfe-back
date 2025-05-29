const Notification = require("../models/notification");
const User = require("../models/userAccount"); // For fetching admins

// --- Notify Functions ---

// Notify the event creator about a new RSVP
const notifyNewRSVP = async (eventId, creatorId, status) => {
  const message = `A user has RSVP'd to your event with status: ${status}.`;
  return await createNotification({
    user: creatorId,
    type: "new_rsvp",
    message,
    event: eventId,
  });
};

// Notify about event creation for guests and shared notification for admins
const notifyEventCreation = async (event, guests) => {
  // Notify guests (individual notifications)
  const guestNotifications = guests.map((guest) => {
    const message = `You've been invited to the event "${event.title}"`;
    return createNotification({
      user: guest.user,
      type: "guest_invitation",
      message,
      event: event._id,
    });
  });

  // Notify admins (shared notification)
  const adminMessage = `A new event "${event.title}" has been created.`;
  // Get all admins
  const admins = await User.find({ role: "admin" }, "_id");
  const adminIds = admins.map(a => a._id.toString());
  await createSharedNotification({
    type: "add_event",
    message: adminMessage,
    event: event._id,
    targetUserIds: adminIds,
  });

  await Promise.all(guestNotifications);
};

const notifyEventUpdate = async (event, userIds) => {
  const notifications = userIds.map((userId) => {
    const message = `The event "${event.title}" has been updated. Check out the latest details!`;
    return createNotification({
      user: userId,
      type: "event_update",
      message,
      event: event._id,
    });
  });
  await Promise.all(notifications);
};

const notifyEventDeletion = async (event, userIds) => {
  const userNotifications = userIds.map((userId) => {
    const message = `The event "${event.title}" has been deleted.`;
    return createNotification({
      user: userId,
      type: "delete_event",
      message,
      event: event._id,
    });
  });

  // Notify admins (shared notification)
  const adminMessage = `The event "${event.title}" has been deleted.`;
  const admins = await User.find({ role: "admin" }, "_id");
  const adminIds = admins.map(a => a._id.toString());
  await createSharedNotification({
    type: "delete_event",
    message: adminMessage,
    event: event._id,
    targetUserIds: adminIds,
  });

  await Promise.all(userNotifications);
};

const notifyEventLike = async (eventId, creatorId) => {
  const message = `Someone liked your event.`;
  return await createNotification({
    user: creatorId,
    type: "like",
    message,
    event: eventId,
  });
};

// --- Core Notification Creators ---

const createNotification = async (data) => {
  try {
    const notification = new Notification({
      type: data.type,
      user: data.user,
      event: data.event,
      message: data.message,
      shared: data.shared || false,
    });
    await notification.save();

    // Real-time emit (individual notification)
    // if (data.user) {
    // }
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("NOTIFICATION_CREATION_FAILED");
  }
};

// For shared notifications (e.g., all admins)
const createSharedNotification = async (data) => {
  try {
    const notification = new Notification({
      type: data.type,
      message: data.message,
      event: data.event, 
      shared: true,
      readBy: [],
    });
    await notification.save();

    // // Real-time emit to all target users
    // if (Array.isArray(data.targetUserIds)) {
    //   data.targetUserIds.forEach(userId => {
    //   });
    // }
    return notification;
  } catch (error) {
    console.error("Error creating shared notification:", error);
    throw new Error("SHARED_NOTIFICATION_CREATION_FAILED");
  }
};
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) throw new Error("Notification not found");
    if (!notification.shared) throw new Error("Not a shared notification");

    // Fetch all admin user ids
    const admins = await User.find({ role: "admin" }, "_id");
    const adminIds = admins.map(a => a._id.toString());

    // If the notification is not already marked as read for all admins
    const allAdminsMarked = adminIds.every(id => notification.readBy.includes(id));
    if (!allAdminsMarked) {
      // Mark as read for ALL admins
      notification.readBy = adminIds;
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};


const getNotificationsForUser = async (userId) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { shared: true },
        { user: userId },
      ],
    }).lean();

    return notifications.map((notification) => ({
      ...notification,
      isRead: notification.shared ? notification.readBy.includes(userId) : !!notification.readBy,
    }));
  } catch (error) {
    console.error("Error fetching notifications for user:", error);
    throw error;
  }
};

// --- Exports ---
module.exports = {
  notifyNewRSVP,
  notifyEventCreation,
  notifyEventUpdate,
  notifyEventDeletion,
  notifyEventLike,
  createNotification,
  createSharedNotification,
  markNotificationAsRead,
  getNotificationsForUser,
};