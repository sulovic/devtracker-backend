const jwt = require("jsonwebtoken");
const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();

const generateAccessToken = async (user) => {
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30m",
  });
  return accessToken;
};

const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "1d",
  });

  // Save refresh token in database
  try {
    await prisma.users.update({
      where: {
        email: user?.email,
      },
      data: { refreshToken },
    });
  } catch (error) {
    throw error;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }

  return refreshToken;
};

module.exports = { generateAccessToken, generateRefreshToken };
