const express = require('express');
const test = express.Router();

test.get('/health', (req, res) => {
    res.send("Welcome to the test server. Health is OK");
});
test.get('/', (req, res) => {
    res.send("Welcome to the test server.");
});

module.exports = test;