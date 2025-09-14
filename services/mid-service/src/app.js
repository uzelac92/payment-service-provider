require("dotenv").config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
const routes = require('./routes/mid.route');

const app = express();

app.use(express.json({limit: "1mb"}))
app.use(express.urlencoded({extended: true}))
app.use(helmet());
app.use(cors());
app.use(hpp());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))
else app.use(morgan('tiny'));

app.use("/mids", routes)

app.use((req, res) => {
    res.status(404).json({error: 'NotFound', message: `Route ${req.method} ${req.originalUrl} not found`});
});

app.use((err, req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({
        error: err.name || 'InternalServerError',
        message: status === 500 ? 'Something went wrong' : err.message,
    });
});

module.exports = app