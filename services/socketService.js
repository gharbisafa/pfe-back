let ioInstance = null;

function setSocketIo(io) {
  ioInstance = io;
}

function sendNotification(userId, notification) {
  if (ioInstance) {
    ioInstance.to(userId.toString()).emit("notification", notification);
  } else {
    console.error("Socket.io instance not set!");
  }
}

module.exports = { setSocketIo, sendNotification };