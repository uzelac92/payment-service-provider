const express = require('express');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

router.post('/auth/login', ctrl.login);
router.post('/auth/refresh', ctrl.refresh);
router.get('/auth/validate', ctrl.validate);
router.post('/auth/logout', ctrl.logout);

module.exports = router;