// src/middlewares/error.js
const {isCelebrateError} = require('celebrate');
const logger = require('../logger');

function notFound(req, res, next) {
    res.status(404).json({
        error: 'NotFound',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        requestId: req.id
    });
}

function errorHandler(err, req, res, _next) {
    if (isCelebrateError(err)) {
        const details = {};
        for (const [segment, e] of err.details.entries()) {
            details[segment] = e.details.map(d => d.message);
        }
        return res.status(400).json({
            error: 'ValidationError',
            message: 'Invalid request data',
            details,
            requestId: req.id
        });
    }

    const status = err.status || 500;
    const body = {
        error: err.name || 'InternalServerError',
        message: status === 500 ? 'Something went wrong' : err.message,
        requestId: req.id,
    };
    logger.error('request_error', {
        status,
        path: req.originalUrl,
        method: req.method,
        message: err.message,
        stack: err.stack,
        reqId: req.id
    });
    res.status(status).json(body);
}

module.exports = {notFound, errorHandler};