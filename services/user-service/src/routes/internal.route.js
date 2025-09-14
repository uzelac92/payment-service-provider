const express = require("express");
const {resolveByEmail} = require("../controllers/user.controller");

const router = express.Router();

router.get("/resolve-by-email", resolveByEmail);

module.exports = router;