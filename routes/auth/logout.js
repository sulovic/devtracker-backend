const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  try {
    const refreshToken = req?.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Unauthorized - No Refresh Token presented" });
    }

    //Verify refreshToken

    const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Delete refreshToken from DB

    await prisma.users.update({
      where: {
        email: decodedRefreshToken?.email,
      },
      data: { refreshToken: "" },
    });

    // Remove refreshToken httpOnly cookie

    res
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      })
      .status(200)
      .json({ message: "Logout successful" });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Unauthorized - Invalid Refresh Token" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized - Refresh Token Expired" });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

module.exports = router;
