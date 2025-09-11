const svc = require('../services/mid.service');

let Mid

async function init({mid}) {
    Mid = mid
}

async function create(req, res, next) {
    try {
        res.status(201).json(await svc.create({Mid, data: req.body}));
    } catch (e) {
        next(e);
    }
}

async function getAll(req, res, next) {
    try {
        res.json(await svc.getAll({Mid, q: req.query}));
    } catch (e) {
        next(e);
    }
}

async function getSingle(req, res, next) {
    try {
        res.json(await svc.getSingle({Mid, query: req.query}));
    } catch (e) {
        next(e);
    }
}

async function update(req, res, next) {
    try {
        res.json(await svc.update({Mid, id: req.params.id, data: req.body}));
    } catch (e) {
        next(e);
    }
}

async function remove(req, res, next) {
    try {
        await svc.remove({Mid, id: req.params.id});
        res.status(204).end();
    } catch (e) {
        next(e);
    }
}

async function attach(req, res, next) {
    try {
        res.status(200).json(await svc.attachEmails({Mid, id: req.params.id, emails: req.body.emails}));
    } catch (e) {
        next(e);
    }
}

async function detach(req, res, next) {
    try {
        res.status(200).json(await svc.detachEmails({Mid, id: req.params.id, emails: req.body.emails}));
    } catch (e) {
        next(e);
    }
}

async function activation(req, res, next) {
    try {
        res.status(200).json(await svc.activation({Mid, id: req.params.id}));
    } catch (e) {
        next(e);
    }
}

module.exports = {create, getAll, getSingle, update, remove, attach, detach, activation, init};