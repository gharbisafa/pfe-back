// backend/services/onesignal.js
const axios = require('axios');
const UserAccount = require('../models/userAccount'); // or correct path to your user model

const ONESIGNAL_APP_ID = '3f9419ad-52ba-4172-85aa-0e4850d43c75';
const ONESIGNAL_API_KEY = 'YOUR-ONESIGNAL-REST-API-KEY'; // Set this!

async function sendPushNotificationToUser(userId, message, extraData = {}) {
  const user = await UserAccount.findById(userId);
  const playerId = user.oneSignalPlayerId;
  if (!playerId) {
    console.warn('No OneSignal Player ID for user', userId);
    return;
  }
  try {
    await axios.post('https://onesignal.com/api/v1/notifications', {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [playerId],
      headings: { en: 'Event App' },
      contents: { en: message },
      data: extraData,
    }, {
      headers: {
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Failed to send OneSignal push', err?.response?.data || err);
  }
}

module.exports = {
  sendPushNotificationToUser
};
