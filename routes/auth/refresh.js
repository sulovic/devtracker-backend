const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { generateAccessToken } = require("../../middleware/generateTokens");

router.post("/", async (req, res) => {
  try {
    const refreshToken = req?.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Unauthorized - Refresh token not presented" });
    }

    // Verify the token signature

    const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if the provided refresh token matches the one stored in the database

    const foundUser = await prisma.users.findUnique({
      where: {
        email: decodedRefreshToken?.email,
      },
      include: {
        roles: true,
      },
    });

    if (!foundUser) {
      return res.status(401).json({ error: "User not found" });
    }

    if (refreshToken !== foundUser?.refreshToken) {
      return res.status(401).json({ error: "Unauthorized - Invalid Refresh Token" });
    }

    // Refresh token is valid, issue new access token

    const userData = {
      userId: foundUser?.userId,
      firstName: foundUser?.firstName,
      lastName: foundUser?.lastName,
      email: foundUser?.email,
      roles: foundUser?.roles,
    };

    const accessToken = await generateAccessToken(userData);

    return res.status(200).json({
      accessToken,
    });
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
