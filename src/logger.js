const {createLogger, format, transports} = require('winston');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json() // structured logs (JSON)
    ),
    transports: [
        new transports.Console() // later you can add file or remote transport
    ],
});

module.exports = logger;