const auditLogController = require("../controllers/auditLogController");
const express = require("express");
const router = express.Router();

router.post('/audit', auditLogController.createLog);
router.get('/audit', auditLogController.getLogs);

module.exports = router;