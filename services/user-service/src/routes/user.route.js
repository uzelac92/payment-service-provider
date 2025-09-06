const express = require('express');
const svc = require('../services/user.service');

const router = express.Router();

router.get('/', async (_, res, next) => {
  try {
    const users = await svc.getAll();
    res.json(users);
  } catch (e) { next(e); }
});

router.get('/single', async (req, res, next) => {
  try {
    const user = await svc.getSingle(req.query);
    return res.json(user);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const user = await svc.create(req.body);
    res.status(201).json(user);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const user = await svc.update(req.params.id, req.body);
    res.json(user);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;