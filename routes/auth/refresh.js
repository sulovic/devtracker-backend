const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { generateAccessToken } = require("../../middleware/generateTokens");
const { getUserData } = require("../../middleware/getUserData");
const { errorLogger } = require("../../middleware/logger");


router.post("/", async (req, res) => {
  try {
    const refreshToken = req?.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Unauthorized - Refresh token not presented" });
    }

    // Verify the token signature

    const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if the provided refresh token matches the one stored in the database

    const { userData, dbRefreshToken } = await getUserData(decodedRefreshToken?.email);

    if (!userData) {
      return res.status(401).json({ error: "User not found" });
    }

    if (refreshToken !== dbRefreshToken) {
      return res.status(401).json({ error: "Unauthorized - Invalid Refresh Token" });
    }

    // Refresh token is valid, issue new access token

    const accessToken = await generateAccessToken(userData);

    return res.status(200).json({
      accessToken,
    });
  } catch (err) {
    errorLogger(err, req);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Unauthorized - Invalid Refresh Token" });
    } else if (err.name === "TokenExpiredError") {
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
