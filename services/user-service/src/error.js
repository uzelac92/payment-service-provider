class AppError extends Error {
    constructor(status, message, name = 'AppError', extra = {}) {
        super(message);
        this.name = name;
        this.status = status;
        this.extra = extra;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

const BadRequest = (msg, extra) => new AppError(400, msg, 'BadRequest', extra);
const Unauthorized = (msg = 'Unauthorized', extra) => new AppError(401, msg, 'Unauthorized', extra);
const Forbidden = (msg = 'Forbidden', extra) => new AppError(403, msg, 'Forbidden', extra);
const NotFound = (msg = 'NotFound', extra) => new AppError(404, msg, 'NotFound', extra);
const Conflict = (msg = 'Conflict', extra) => new AppError(409, msg, 'Conflict', extra);
const InternalServerError = (msg = 'Internal Server Error', extra) => new AppError(500, msg, 'InternalServerError', extra);

module.exports = {AppError, BadRequest, Unauthorized, Forbidden, NotFound, Conflict, InternalServerError};