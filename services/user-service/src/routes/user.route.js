const express = require('express');
const {
    getAll,
    getSingle,
    create,
    update,
    remove
} = require('../controllers/user.controller');
const requireAuthRemote = require("../middlewares/requireAuth.remote");

const router = express.Router();
const requireAuth = requireAuthRemote({
    authBaseUrl: process.env.AUTH_BASE_URL,
});

router.post('/', requireAuth, create);
router.get('/', requireAuth, getAll);
router.get('/single', requireAuth, getSingle);
router.put('/:id', requireAuth, update);
router.delete('/:id', requireAuth, remove);

module.exports = router;