const mongoose = require("mongoose");

const options = {
  maxPoolSize: 10,
  //autoIndex: false,
};

var db;

const connect = async () => {
  try {
    db = await mongoose.connect(process.env.DB_URL, options);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const get = () => {
  return db;
};

exports.getDB = get;
exports.connectDB = connect;
