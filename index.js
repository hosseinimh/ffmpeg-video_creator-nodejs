const express = require("express");
const bodyParser = require("body-parser");
var shell = require("shelljs");
const videoService = require("./services/VideoService");
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.get("/", (_, res) => {
  return res.send("index");
});

app.post("/", async (req, res) => {
  try {
    const { yadbood_id, yadbood_title, image_path } = req.body;
    if (!yadbood_id || !yadbood_title || !image_path) {
      return response(res, "2", 400);
    }
    const result = videoService.create(yadbood_id, yadbood_title, image_path);
    return response(res, { _result: result });
  } catch {}
  return response(res, "1", 400);
});

function response(res, body = "", status = 200) {
  res.status(status);
  return res.json(body);
}