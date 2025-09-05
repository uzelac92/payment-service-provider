require('dotenv').config();

// server
const express = require('express');
// security
const helmet = require('helmet');
const cors = require('cors');
// logging
const morgan = require('morgan');
const logger = require('./logger');

const test = require('./routes/test.route');

const app = express();

// for handling json response and parsing request body
app.use([express.json(), express.urlencoded({extended: true})]);
// security
app.use(helmet());
app.use(cors({origin: true}));

// DEV logging: morgan to console
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
// PROD logging: use winston
if (process.env.NODE_ENV === 'production') {
    app.use(
        morgan('combined', {
            stream: {
                write: (message) => logger.info(message.trim()),
            },
        })
    );
}

app.use("/test", test)

module.exports = app;