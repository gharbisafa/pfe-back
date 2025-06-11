// services/reservationService.js (with guests sync)
const Reservation = require("../models/reservation");
const Event = require("../models/event");
const notificationService = require("./notificationService");

const makeReservation = async (eventId, userId, numberOfPeople, userName) => {
  if (!numberOfPeople || numberOfPeople <= 0) {
    throw new Error("Number of people must be greater than zero");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.createdBy.toString() === userId.toString()) {
    throw new Error("You cannot make a reservation for your own event.");
  }

  const existingReservation = await Reservation.findOne({ event: eventId, user: userId });
  if (existingReservation) {
    throw new Error("You already have a reservation for this event. Please update it instead.");
  }

  const reservation = new Reservation({
    event: eventId,
    user: userId,
    numberOfPeople,
  });
  await reservation.save();

  // Sync with guests array
  const rsvpStatus = "yes"; // Map to "yes" for active reservation
  const guestIndex = event.guests.findIndex((g) => g.user.toString() === userId.toString());
  if (guestIndex === -1) {
    event.guests.push({ user: userId, rsvp: rsvpStatus });
  } else {
    event.guests[guestIndex].rsvp = rsvpStatus;
  }
  await event.save();

  // Notify the event creator
  const message = `${userName} has made a reservation for ${numberOfPeople} people.`;
  await notificationService.createNotification({
    user: event.createdBy,
    type: "reservation_request",
    message,
    event: eventId,
  });

  return reservation;
};

const updateReservation = async (reservationId, userId, numberOfPeople, userName) => {
  if (!numberOfPeople || numberOfPeople <= 0) {
    throw new Error("Number of people must be greater than zero");
  }

  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.user.toString() !== userId.toString()) {
    throw new Error("You are not authorized to update this reservation.");
  }

  reservation.numberOfPeople = numberOfPeople;
  reservation.status = "pending"; // Reset to pending for approval
  await reservation.save();

  // Notify the event creator
  const event = await Event.findById(reservation.event);
  const message = `${userName} has updated their reservation to ${numberOfPeople} people.`;
  await notificationService.createNotification({
    user: event.createdBy,
    type: "reservation_update",
    message,
    event: reservation.event,
  });

  return reservation;
};

const cancelReservation = async (reservationId, userId, userName) => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.user.toString() !== userId.toString()) {
    throw new Error("You are not authorized to cancel this reservation.");
  }

  reservation.status = "canceled";
  await reservation.save();

  // Sync with guests array (remove guest)
  const event = await Event.findById(reservation.event);
  const guestIndex = event.guests.findIndex((g) => g.user.toString() === userId.toString());
  if (guestIndex > -1) {
    event.guests.splice(guestIndex, 1);
    await event.save();
  }

  // Notify the event creator
  const message = `${userName} has canceled their reservation.`;
  await notificationService.createNotification({
    user: event.createdBy,
    type: "reservation_cancellation",
    message,
    event: reservation.event,
  });

  return { message: "Reservation canceled successfully." };
};

const cancelUserReservation = async (reservationId, userId) => {
  const reservation = await Reservation.findOne({ _id: reservationId, user: userId });
  if (!reservation) {
    throw new Error("Reservation not found or not authorized.");
  }

  reservation.status = "canceled";
  await reservation.save();

  const event = await Event.findById(reservation.event);
  if (!event) {
    throw new Error("Event not found.");
  }

  const message = `A reservation for your event "${event.title}" has been canceled by a user.`;
  await notificationService.createNotification({
    user: event.createdBy,
    type: "reservation_cancellation",
    message,
    event: reservation.event,
  });

  return { message: "Reservation canceled successfully." };
};

const getReservations = async (eventId, userId, isAdmin) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.createdBy.toString() !== userId.toString() && !isAdmin) {
    throw new Error("You are not authorized to view reservations for this event.");
  }

  const reservations = await Reservation.find({ event: eventId }).populate("user", "name email");
  return reservations.length > 0 ? reservations : [];
};

const getUserReservations = async (userId) => {
  const reservations = await Reservation.find({ user: userId }).populate("event", "title startDate");
  if (!reservations || reservations.length === 0) {
    throw new Error("No reservations found for this user.");
  }
  return reservations;
};

const respondToReservation = async (reservationId, userId, status) => {
  if (!["confirmed", "rejected"].includes(status)) {
    throw new Error("Invalid status. Must be 'confirmed' or 'rejected'.");
  }

  const reservation = await Reservation.findById(reservationId).populate("event");
  if (!reservation) {
    throw new Error("Reservation not found");
  }

  const event = reservation.event;
  if (event.createdBy.toString() !== userId.toString()) {
    throw new Error("You are not authorized to respond to this reservation.");
  }

  reservation.status = status;
  await reservation.save();

  const message = `Your reservation has been ${status} by the event creator.`;
  await notificationService.createNotification({
    user: reservation.user,
    type: "reservation_response",
    message,
    event: event._id,
  });

  return { message: `Reservation ${status} successfully.` };
};

module.exports = {
  makeReservation,
  updateReservation,
  cancelReservation,
  cancelUserReservation,
  getReservations,
  getUserReservations,
  respondToReservation,
};