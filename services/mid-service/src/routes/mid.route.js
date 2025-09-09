const express = require('express');
const { create, getAll, getSingle, update, remove } = require('../controllers/mid.controller');

const router = express.Router();

router.get('/', getAll)
router.get('/single', getSingle)
router.post('/', create)
router.delete('/:id', remove)
router.put('/:id', update)

module.exports = router;