// multer.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Ensure this path exists and is writable
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Filename as is
  },
});

const upload = multer({ storage });

module.exports = upload;
