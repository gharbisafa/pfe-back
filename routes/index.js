var express = require("express");
var router = express.Router();

router.use("/auth", require("./auth"));
router.use("/user-account", require("./userAccount"));

router.use("/event", require("./event"));
router.use("/eventMedia", require("./eventMedia"));


module.exports = router;
