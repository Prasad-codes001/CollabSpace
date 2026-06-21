const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("CollabSpace Backend Running");
});

module.exports = app;