const Reservation = require("../models/reservation");
const Event = require("../models/event");
const notificationService = require("./notificationService");

// Make a reservation
const makeReservation = async (eventId, userId, numberOfPeople, userName) => {
  if (!numberOfPeople || numberOfPeople <= 0) {
    throw new Error("Number of people must be greater than zero");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  // Prevent creators from making reservations for their own events
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

// Update a reservation
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

// Cancel a reservation
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

  // Notify the event creator
  const event = await Event.findById(reservation.event);
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

  // Mark the reservation as canceled
  reservation.status = "canceled";
  await reservation.save();

  // Notify the event creator about the cancellation
  const event = await Event.findById(reservation.event);
  if (!event) {
    throw new Error("Event not found.");
  }

  const message = `A reservation for your event "${event.title}" has been canceled by a user.`;
  await notificationService.createNotification({
    user: event.createdBy, // Notify the creator of the event
    type: "reservation_cancellation",
    message,
    event: reservation.event,
  });

  return { message: "Reservation canceled successfully." };
};


// Get reservations for an event
const getReservations = async (eventId, userId, isAdmin) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  // Allow only the creator or admins to access reservations
  if (event.createdBy.toString() !== userId.toString() && !isAdmin) {
    throw new Error("You are not authorized to view reservations for this event.");
  }

  const reservations = await Reservation.find({ event: eventId }).populate("user", "name email");
  return reservations.length > 0 ? reservations : [];
};

// Get reservations made by the authenticated user
const getUserReservations = async (userId) => {
  const reservations = await Reservation.find({ user: userId }).populate("event", "title date");
  if (!reservations || reservations.length === 0) {
    throw new Error("No reservations found for this user.");
  }

  return reservations;
};

// Respond to a reservation
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

  // Notify the user who made the reservation
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

