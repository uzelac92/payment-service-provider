const svc = require('../services/user.service');


let User;

async function init({user}) {
    User = user
}

async function create(req, res, next) {
    try {
        res.status(201).json(await svc.create({User, data: req.body}));
    } catch (e) {
        next(e);
    }
}

async function getAll(req, res, next) {
    try {
        res.json(await svc.getAll({User, q: req.query}));
    } catch (e) {
        next(e);
    }
}

async function getSingle(req, res, next) {
    try {
        res.json(await svc.getSingle({User, query: req.query}));
    } catch (e) {
        next(e);
    }
}

async function update(req, res, next) {
    try {
        res.json(await svc.update({User, id: req.params.id, data: req.body}));
    } catch (e) {
        next(e);
    }
}

async function remove(req, res, next) {
    try {
        await svc.remove({User, id: req.params.id});
        res.status(204).end();
    } catch (e) {
        next(e);
    }
}

async function resolveByEmail(req, res, next) {
    const key = req.headers["x-internal-key"] || "";


    try {
        const response = svc.resolveByEmail({User, key, email: req.query.email})
        res.json(response);
    } catch (e) {
        next(e)
    }
}

module.exports = {init, create, getAll, getSingle, update, remove, resolveByEmail};
