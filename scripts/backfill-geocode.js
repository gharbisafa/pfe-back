require('dotenv').config();
const mongoose = require('mongoose');
const Event    = require('../models/event');
const { geocodeLocation } = require('../services/eventService');

async function backfill() {
  await mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to Mongo');

  const events = await Event.find({ latitude: { $exists: false } });
  for (const ev of events) {
    try {
      const coords = await geocodeLocation(ev.location);
      if (coords) {
        ev.latitude = coords.latitude;
        ev.longitude = coords.longitude;
        await ev.save();
        console.log(`Backfilled ${ev._id}`);
      }
    } catch (e) {
      console.error(`Error for ${ev._id}:`, e);
    }
  }

  console.log('Done backfill');
  process.exit(0);
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});
