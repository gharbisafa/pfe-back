const reservationService = require("../services/reservationService");
const Reservation = require('../models/reservation');
const Event = require('../models/event');

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

const respondToReservation = async (req, res) => {
  const { reservationId } = req.params;
  const { status }        = req.body;

  // 1) update reservation status
  const updatedRes = await Reservation.findByIdAndUpdate(
    reservationId,
    { status },
    { new: true }
  );
  if (!updatedRes) return res.status(404).json({ error: "Reservation not found" });

  // 2) adjust the Event.guests
  if (status === "confirmed") {
    const partyCount = updatedRes.numberOfPeople;
    // fetch your event once
    const ev = await Event.findById(updatedRes.event);
    if (ev) {
      // remove old guest
      ev.guests = ev.guests.filter(
        g => g.user.toString() !== updatedRes.user.toString()
      );
      // push your aggregated record
      const baseName = updatedRes.userInfo?.name || updatedRes.user.toString();
      ev.guests.push({
        user: updatedRes.user,
        rsvp: "yes",
        name: partyCount > 1
          ? `${baseName} +${partyCount - 1}`
          : baseName
      });
      await ev.save();

      // 🔥 instead of refetching again, just re-populate the one you already have:
      await ev.populate("guests.user", "userInfo.name email");
      return res.json({ reservation: updatedRes, event: ev });
    }
  }

  // 3) if you didn’t hit the if-block, just return the reservation
  res.json({ reservation: updatedRes });
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

