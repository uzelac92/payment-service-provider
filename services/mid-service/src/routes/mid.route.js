const express = require('express');
const { create, getAll, getSingle, update, remove, attach, detach, activation } = require('../controllers/mid.controller');

const router = express.Router();

router.get('/', getAll)
router.get('/single', getSingle)
router.post('/', create)
router.delete('/:id', remove)
router.put('/:id', update)
router.put('/attach/:id', attach)
router.put('/detach/:id', detach)
router.get('/activation/:id', activation)

module.exports = router;