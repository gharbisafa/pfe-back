const reservationService = require("../services/reservationService");

// Make a reservation for an event
const makeReservation = async (req, res) => {
  const { eventId } = req.params;
  const { numberOfPeople } = req.body;

  try {
    const reservation = await reservationService.makeReservation(
      eventId,
      req.user._id,
      numberOfPeople,
      req.user.name
    );
    res.status(201).json(reservation);
  } catch (error) {
    console.error("Error making reservation:", error);
    res.status(500).json({ error: error.message || "RESERVATION_FAILED" });
  }
};

// Update a reservation
const updateReservation = async (req, res) => {
  const { reservationId } = req.params;
  const { numberOfPeople } = req.body;

  try {
    const updatedReservation = await reservationService.updateReservation(
      reservationId,
      req.user._id,
      numberOfPeople,
      req.user.name
    );
    res.status(200).json(updatedReservation);
  } catch (error) {
    console.error("Error updating reservation:", error);
    res.status(500).json({ error: error.message || "UPDATE_FAILED" });
  }
};

// Cancel a reservation
const cancelReservation = async (req, res) => {
  const { reservationId } = req.params;

  try {
    const result = await reservationService.cancelReservation(
      reservationId,
      req.user._id,
      req.user.name
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error canceling reservation:", error);
    res.status(500).json({ error: error.message || "CANCELLATION_FAILED" });
  }
};

// Cancel a reservation as the user who made it
const cancelUserReservation = async (req, res) => {
  const { reservationId } = req.params;

  try {
    const result = await reservationService.cancelUserReservation(
      reservationId,
      req.user._id
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error canceling user reservation:", error);
    res.status(500).json({ error: error.message || "CANCELLATION_FAILED" });
  }
};

// Get reservations for a specific event
const getReservations = async (req, res) => {
  const { eventId } = req.params;

  try {
    const reservations = await reservationService.getReservations(
      eventId,
      req.user._id,
      req.user.isAdmin
    );
    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: error.message || "FAILED_TO_FETCH_RESERVATIONS" });
  }
};

// Get reservations made by the authenticated user
const getUserReservations = async (req, res) => {
  try {
    const reservations = await reservationService.getUserReservations(req.user._id);
    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    res.status(500).json({ error: error.message || "FAILED_TO_FETCH_RESERVATIONS" });
  }
};

// Respond to a reservation
const respondToReservation = async (req, res) => {
  const { reservationId } = req.params;
  const { status } = req.body;

  try {
    const response = await reservationService.respondToReservation(
      reservationId,
      req.user._id,
      status
    );
    res.status(200).json(response);
  } catch (error) {
    console.error("Error responding to reservation:", error);
    res.status(500).json({ error: error.message || "RESPOND_FAILED" });
  }
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

