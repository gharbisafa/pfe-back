const fs = require("fs");
const path = require("path");

require("dotenv").config();

const privatePath = path.join(process.cwd(), ".private");
if (!fs.existsSync(privatePath)) {
  fs.mkdirSync(privatePath);
}

const tmpPath = path.join(process.cwd(), ".tmp");
if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath);
}
fs.chmodSync(tmpPath, 0o777);

require("./db").connectDB();

// require("../utils/keys").generateKeypair();

require("./passport");
