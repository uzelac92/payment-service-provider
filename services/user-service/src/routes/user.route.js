const express = require('express');
const {
    getAll,
    getSingle,
    create,
    update,
    remove
} = require('../controllers/user.controller');

const router = express.Router();

router.get('/', getAll);
router.get('/single', getSingle);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;