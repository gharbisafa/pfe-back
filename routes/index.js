var express = require("express");
var router = express.Router();

router.use("/auth", require("./auth"));
router.use("/user-account", require("./userAccount"));

module.exports = router;
