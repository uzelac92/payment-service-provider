class AppError extends Error {
    constructor(status, message, name = 'AppError') {
        super(message);
        this.name = name;
        this.status = status;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

const BadRequest = (msg = 'Bad Request') => new AppError(400, msg, 'BadRequest');
const Unauthorized = (msg = 'Unauthorized') => new AppError(401, msg, 'Unauthorized');
const Forbidden = (msg = 'Forbidden') => new AppError(403, msg, 'Forbidden');
const NotFound = (msg = 'NotFound') => new AppError(404, msg, 'NotFound');
const Conflict = (msg = 'Conflict') => new AppError(409, msg, 'Conflict');
const InternalServerError = (msg = 'Internal Server Error') => new AppError(500, msg, 'InternalServerError');
const ServiceUnavailable = (msg = 'Service Unavailable') => new AppError(503, msg, 'Service Unavailable');

module.exports = {
    AppError,
    BadRequest,
    Unauthorized,
    Forbidden,
    NotFound,
    Conflict,
    InternalServerError,
    ServiceUnavailable
};