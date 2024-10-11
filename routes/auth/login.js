const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const { generateAccessToken, generateRefreshToken } = require("../../middleware/generateTokens");
const verifyGoogleToken = require("../../middleware/verifyGoogleToken");
const { getUserData } = require("../../middleware/getUserData");
const { errorLogger } = require("../../middleware/logger");


router.post("/", async (req, res) => {
  try {
    const { type, email, password, credential } = req?.body;
    if (!type) {
      return res.status(401).json({ message: "Missing Auth type" });
    }

    if (type === "password") {
      // User-Password authentication

      if (!email || !password) {
        return res.status(401).json({ message: "Missing Email or Password" });
      }

      const { userData, dbPassword } = await getUserData(email);

      if (!userData) {
        return res.status(401).json({ message: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(password, dbPassword);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const accessToken = await generateAccessToken(userData);
      const refreshToken = await generateRefreshToken(userData);

      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: "Strict",
          secure: true,
        })
        .status(200)
        .json({
          info: "User found, Password OK!",
          accessToken,
        });
    } else if (type === "google") {
      // Google authentication

      if (!credential) {
        return res.status(401).json({ message: "Missing Google Credentials" });
      }

      const decodedCredential = await verifyGoogleToken(credential);

      const { userData } = await getUserData(decodedCredential?.email);

      if (!userData) {
        return res.status(401).json({ message: "User not found" });
      }
      const accessToken = await generateAccessToken(userData);
      const refreshToken = await generateRefreshToken(userData);

      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: "Strict",
          secure: true,
        })
        .status(200)
        .json({
          info: "User found, Google Credentials OK!",
          accessToken,
        });
    } else {
      return res.status(401).json({ message: "Invalid Auth type" });
    }
  } catch (err) {
    errorLogger(err, req);
    if (err.name === "InvalidGoogleToken") {
      return res.status(401).json({ error: "Unauthorized - Invalid Google Token" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

module.exports = router;
