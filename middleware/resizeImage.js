const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const resizeImage =
  (width = 800) =>
  async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9-_.]/g, "");

      const filePath = path.join(__dirname, "../public/", sanitizedFileName);
      const tempFilePath = path.join(__dirname, "../public/", `temp-${sanitizedFileName}`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found.");
      }

      await sharp(filePath).resize(width).toFile(tempFilePath);

      fs.renameSync(tempFilePath, filePath);

      next();
    } catch (err) {
      res.status(500).send("Failed to resize image.");
    }
  };

module.exports = resizeImage;
