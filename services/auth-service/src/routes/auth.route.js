const express = require('express');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

router.post("/verification", ctrl.createVerification);
router.post("/verify-code", ctrl.verifyCodeEndpoint);
router.get("/verify", ctrl.renderVerifyPage);
router.post("/change-password", ctrl.changePassword);

router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/validate', ctrl.validate);
router.post('/password-reset', ctrl.requestPasswordReset);


module.exports = router;