const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();
const checkUserRole = require("../middleware/checkUserRole");
const { minRoles } = require("../config/minRoles");
const { errorLogger } = require("../middleware/logger");

router.post("/", checkUserRole(minRoles.comments.post), async (req, res) => {
  try {
    const newComment = req?.body;

    if (!newComment) {
      return res.status(400).json({ error: "No data is sent" });
    }

    const comment = await prisma.comments.create({
      data: {
        commentText: newComment?.commentText,
        createdAt: newComment?.createdAt,
        issueId: newComment?.issueId,
        userId: newComment?.user?.userId,
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    errorLogger(err, req);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

router.delete("/:id", checkUserRole(minRoles.comments.delete), async (req, res) => {
  try {
    const id = parseInt(req?.params?.id);

    //Check for resource before deletion

    const existingComment = await prisma.comments.findUnique({
      where: {
        commentId: id,
      },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    //Check user permissions - Creator or Admin

    if (existingComment?.userId !== req?.authUser?.userId && !req?.authUser?.roles?.some((role) => role?.userRole?.roleId > 5000)) {
      return res.status(403).json({ error: "Forbidden - Insufficient privileges" });
    }

    //Delete if exists

    const deletedComment = await prisma.comments.delete({
      where: {
        commentId: id,
      },
    });

    res.status(200).json(deletedComment);
  } catch (err) {
    errorLogger(err, req);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

module.exports = router;
