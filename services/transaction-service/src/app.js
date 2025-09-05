require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const morgan = require('morgan');

const app = express();

// for handling json response and parsing request body
app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({extended: true}));
// security
app.use(helmet());
app.use(hpp);
app.use(cors({origin: true}));

// DEV logging: morgan to console
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
else app.use(morgan('tiny'));

app.get('/', (req, res) => {
    res.send("Welcome to transaction service.");
});

module.exports = app;