const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();
const getUserData = async (email) => {
  const foundUser = await prisma.users.findUnique({
    where: { email },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
      refreshToken: true,
      roles: {
        select: {
          userRole: true,
        },
      },
    },
  });

  if (!foundUser) {
    return null;
  } else {
    userData = {
      userId: foundUser?.userId,
      firstName: foundUser?.firstName,
      lastName: foundUser?.lastName,
      email: foundUser?.email,
      roles: foundUser?.roles,
    };

    dbRefreshToken = foundUser?.refreshToken;

    return {
      userData,
      dbRefreshToken,
    };
  }
};

module.exports = { getUserData };
