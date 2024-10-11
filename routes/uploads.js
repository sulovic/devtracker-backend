const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs/promises");
const checkUserRole = require("../middleware/checkUserRole");
const { minRoles } = require("../config/minRoles");
const resizeImage = require("../middleware/resizeImage");
const multer = require("multer");
const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();
const { errorLogger } = require("../middleware/logger");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, "../uploads/");
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9-_.]/g, "");
    const fileExtension = path.extname(sanitizedFileName);
    const baseName = path.basename(sanitizedFileName, fileExtension);
    const uniqueSuffix = Date.now();

    const newFileName = `${baseName}-${uniqueSuffix}${fileExtension}`;

    cb(null, newFileName);
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

router.post("/", checkUserRole(minRoles.uploads.post), upload.any(), resizeImage(1024), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    const filenames = req.files.map((file) => file.filename);
    const commentId = parseInt(req.body.commentId);

    const comment = await prisma.comments.findUnique({
      where: {
        commentId: commentId,
      },
      include: {
        user: true,
      },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    //Check user permissions - Creator

    if (comment?.userId !== req?.authUser?.userId) {
      return res.status(403).json({ error: "Forbidden - Insufficient privileges" });
    }

    await prisma.documents.createMany({
      data: filenames.map((documentUrl) => ({
        documentUrl,
        commentId,
      })),
    });

    res.status(200).json(filenames);
  } catch (err) {
    errorLogger(err, req);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", checkUserRole(minRoles.uploads.delete), async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    const document = await prisma.documents.findUnique({
      where: {
        documentId: documentId,
      },
      include: {
        comment: {
          include: {
            user: true,
            issue: {
              include: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ message: "File not found" });
    }

    //Check user permissions - Creator or Admin

    if (document.comment.userId !== req.authUser.userId && !req.authUser.roles.some((role) => role.userRole.roleId > 5000)) {
      return res.status(403).json({ error: "Forbidden - Insufficient privileges - not Comment Creator or Admin" });
    }

    //Check issue status - Closed

    if (document.comment.issue.status.statusName === "Closed") {
      return res.status(403).json({ error: "Forbidden - Issue is closed" });
    }

    //Delete if exists
    await prisma.documents.delete({
      where: {
        documentId: documentId,
      },
    });

    await fs.unlink(`./uploads/${document.documentUrl}`);

    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    errorLogger(err, req);
    if (err.code === "ENOENT") {
      res.status(404).json({ message: "File not found" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

module.exports = router;
