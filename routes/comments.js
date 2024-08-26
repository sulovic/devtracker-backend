const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();
const checkUserRole = require("../middleware/checkUserRole");
const { minRoles } = require("../config/minRoles");

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
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

module.exports = router;
