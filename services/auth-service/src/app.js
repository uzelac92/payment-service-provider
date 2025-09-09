const express = require("express");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");
const morgan = require("morgan");
const routes = require('./routes/auth.route');

const app = express();

const path = require("path");
app.use("/static", express.static(path.join(__dirname, "public")));

app.use([express.json({limit: '1mb'}), express.urlencoded({extended: true})]);
app.use(helmet());
app.use(cors({origin: true}));
app.use(hpp());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
else app.use(morgan('tiny'));

app.use("/api/client/auth", routes)

module.exports = app;