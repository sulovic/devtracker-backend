const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const resizeImage =
  (width = 800) =>
  async (req, res, next) => {
    try {
      if (req?.files && req?.files.length > 0) {
        const files = req?.files;

        for (const file of files) {
          const fileName = file?.filename;
          const filePath = path.join(__dirname, "../uploads/", fileName);
          const tempFilePath = path.join(__dirname, "../uploads/", `temp-${fileName}`);

          if (fs.existsSync(filePath)) {
            await sharp(filePath).resize(width).toFile(tempFilePath);
            fs.renameSync(tempFilePath, filePath);
          }
        }
      }

      next();
    } catch (err) {
      res.status(500).send("Failed to resize image.");
    }
  };

module.exports = resizeImage;
