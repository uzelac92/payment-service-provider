const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const morgan = require("morgan");


const app = express();

app.use(express.json({limit: "1mb"}));
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cors())
app.use(hpp())

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
else app.use(morgan("tiny"))

app.get("/", (_req, res) => res.send("notification-service OK"));
app.get("/health", (_req, res) => res.json({ok: true}));

app.use((req, res) => {
    res.status(404).json({error: "Not Found"});
});

app.use((err, _req, res, _next) => {
    console.error("[notification] Unhandled error:", err);
    res.status(err.status || 500).json({error: err.message || "Internal Server Error"});
});

module.exports = app;