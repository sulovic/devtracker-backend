const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();
const getUserData = async (email) => {
  try {
    const foundUser = await prisma.users.findUnique({
      where: { email },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        refreshToken: true,
        roles: {
          select: {
            userRole: true,
          },
        },
      },
    });

    if (!foundUser) {
      return {
        userData: null,
        dbRefreshToken: null,
        password: null,
      };
    } else {
      userData = {
        userId: foundUser?.userId,
        firstName: foundUser?.firstName,
        lastName: foundUser?.lastName,
        email: foundUser?.email,
        roles: foundUser?.roles,
      };

      dbRefreshToken = foundUser?.refreshToken;
      dbPassword = foundUser?.password;

      return {
        userData,
        dbRefreshToken,
        dbPassword
      };
    }
  } catch (err) {
    throw err;
  }
};

module.exports = { getUserData };
