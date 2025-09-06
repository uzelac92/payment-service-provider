const svc = require('../services/user.service');

async function create(req, res, next) {
    try {
        res.status(201).json(await svc.create(req.body));
    } catch (e) {
        next(e);
    }
}

async function getAll(req, res, next) {
    try {
        res.json(await svc.getAll(req.query));
    } catch (e) {
        next(e);
    }
}

async function getSingle(req, res, next) {
    try {
        res.json(await svc.getSingle(req.query));
    } catch (e) {
        next(e);
    }
}

async function update(req, res, next) {
    try {
        res.json(await svc.update(req.params.id, req.body));
    } catch (e) {
        next(e);
    }
}

async function remove(req, res, next) {
    try {
        await svc.remove(req.params.id);
        res.status(204).end();
    } catch (e) {
        next(e);
    }
}

module.exports = {create, getAll, getSingle, update, remove};
