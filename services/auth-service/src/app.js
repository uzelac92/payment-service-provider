require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

app.use([express.json({limit: '1mb'}), express.urlencoded({extended: true})]);
app.use(helmet());
app.use(cors({origin: true}));
app.use(hpp)

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
else app.use(morgan('tiny'));

app.get("/", (req, res) => {
    res.send("Welcome to auth service.")
})

module.exports = app;