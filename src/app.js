const express = require('express');

const app = express();

// for handling json response and parsing request body
app.use([express.json(), express.urlencoded({ extended: true })]);

app.get('/', (req, res) => {
    res.send("Welcome to the server");
});

module.exports = app;