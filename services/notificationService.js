const Notification = require("../models/notification");

// Notify the event creator about a new reservation.
const notifyReservationRequest = async (creatorId, eventId, userName, numberOfPeople) => {
  const message = `${userName} has made a reservation for ${numberOfPeople} people.`;
  return await createNotification({
    user: creatorId,
    type: "reservation_request",
    message,
    event: eventId,
  });
};

// Notify the user about the creator's response to a reservation.
const notifyReservationResponse = async (userId, eventId, status) => {
  const message = `Your reservation has been ${status}.`;
  return await createNotification({
    user: userId,
    type: "reservation_response",
    message,
    event: eventId,
  });
};

// Generic function to create a notification
const createNotification = async (data) => {
  try {
    const notification = new Notification({
      type: data.type, 
      user: data.user,
      event: data.event,
      message: data.message,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("NOTIFICATION_CREATION_FAILED");
  }
};
const notifyGuests = async (event, newGuests) => {
  try {
    const notifications = newGuests.map((guest) => {
      const message = `You've been invited to the updated event "${event.title}"`;

      return createNotification({
        user: guest.user,
        type: "guest_invitation",
        message,
        event: event._id,
      });
    });

    await Promise.all(notifications);
    console.log("Notifications sent to new guests.");
  } catch (error) {
    console.error("Error notifying guests:", error);
    throw new Error("NOTIFICATION_CREATION_FAILED");
  }
};
const notifyUsers = async (event, userIds) => {
  try {
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
    console.log("Notifications sent to all relevant users.");
  } catch (error) {
    console.error("Error notifying users:", error);
    throw new Error("NOTIFICATION_CREATION_FAILED");
  }
};

module.exports = {
  notifyReservationRequest,
  notifyReservationResponse,
  createNotification,
  notifyGuests,
  notifyUsers,
};