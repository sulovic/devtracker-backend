const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const { generateAccessToken, generateRefreshToken } = require("../../middleware/generateTokens");
const verifyGoogleToken = require("../../middleware/verifyGoogleToken");

const getUserData = async (email) => {
  return await prisma.users.findUnique({
    where: { email },
    include: {
      roles: true,
    }
  });
};


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

      const foundUser = await getUserData(email);

      if (!foundUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(password, foundUser?.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const authUser = {
        firstName: foundUser?.firstName,
        lastName: foundUser?.lastName,
        email: foundUser?.email,
        roles: foundUser?.roles,
      };

      const accessToken = await generateAccessToken(authUser);
      const refreshToken = await generateRefreshToken(authUser);

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

      const foundUser = await getUserData(decodedCredential?.email);

      if (!foundUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const authUser = {
        firstName: foundUser?.firstName,
        lastName: foundUser?.lastName,
        email: foundUser?.email,
        roles: foundUser?.roles,
      };

      const accessToken = await generateAccessToken(authUser);
      const refreshToken = await generateRefreshToken(authUser);

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
  } catch (error) {
    if (error.name === "InvalidGoogleToken") {
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
