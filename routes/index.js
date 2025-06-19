var express = require("express");
var router = express.Router();

router.use("/auth", require("./auth"));
router.use("/user-account", require("./userAccount"));

router.use("/event", require("./event"));
router.use("/eventMedia", require("./eventMedia"));
router.use("/admin", require("./admin"));
router.use("/notification", require("./notification"));
router.use("/reservation", require("./reservation"));

router.use("/feedbacks", require("./feedbacks"));
router.use("/comments", require("./comments"));
router.use('/report', require('./report'));



module.exports = router;
