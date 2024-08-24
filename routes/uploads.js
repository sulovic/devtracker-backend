const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs/promises");
const checkUserRole = require("../middleware/checkUserRole");
const { minRoles } = require("../config/minRoles");
const resizeImage = require("../middleware/resizeImage");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, "../public/");
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9-_.]/g, "");
    cb(null, sanitizedFileName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/; // Allowed file types
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error("File type not allowed"));
    }
  },
});

router.post("/*", checkUserRole(minRoles.uploads.post), upload.single("file"), resizeImage(800), async (req, res) => {
  try {
    if (!req.file || req.file.length === 0) {
      return res.status(400).send("No files were uploaded.");
    }
    res.status(200).json(req?.file?.filename);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log(err);
  }
});

router.delete("/:filename", checkUserRole(minRoles.uploads.delete), async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename || filename.length === 0) {
      return res.status(400).json({ error: "No filename provided" });
    }

    const sanitizedFileName = filename.replace(/[^a-zA-Z0-9-_.]/g, "");

    if (sanitizedFileName !== filename) {
      return res.status(400).json({ error: "Invalid filename provided" });
    }

    const filePath = path.resolve(__dirname, "../public/", sanitizedFileName);

    //Check if file exists
    await fs.access(filePath);
    //Delete file
    await fs.unlink(filePath);

    res.status(200).json({ message: "Files deleted successfully" });
  } catch (err) {
    if (err.code === "ENOENT") {
      res.status(404).json({ message: "File not found" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

module.exports = router;
