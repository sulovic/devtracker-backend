const { PrismaClient } = require("./client");
const prisma = new PrismaClient();

const seedPredefinedData = async () => {
  try {
    // Predefined Statuses
    const statuses = [
      { statusId: 1, statusName: "New" },
      { statusId: 2, statusName: "Invalid" },
      { statusId: 3, statusName: "Clarify" },
      { statusId: 4, statusName: "Assigned" },
      { statusId: 5, statusName: "Resolving" },
      { statusId: 6, statusName: "Resolved" },
      { statusId: 7, statusName: "Closed" },
    ];

    // Predefined UserRoles
    const userRoles = [
      { roleId: 1001, roleName: "Reporter" },
      { roleId: 2001, roleName: "Triager" },
      { roleId: 3101, roleName: "Frontend" },
      { roleId: 3201, roleName: "Backend" },
      { roleId: 3301, roleName: "Database" },
      { roleId: 3401, roleName: "DevOps" },
      { roleId: 5001, roleName: "Admin" },
    ];

    // Predefined Admin Users
    const users = [
      {
        userId: 1,
        firstName: "Vladimir",
        lastName: "Šulović",
        email: "sulovic@gmail.com",
      },
    ];

    //Predefined Admin Users Roles
    const userRolesAdmin = [
      { userId: 1, roleId: 1001 },
      { userId: 1, roleId: 2001 },
      { userId: 1, roleId: 3101 },
      { userId: 1, roleId: 3201 },
      { userId: 1, roleId: 3301 },
      { userId: 1, roleId: 3401 },
      { userId: 1, roleId: 5001 },
    ];

    // Insert Statuses
    for (const status of statuses) {
      await prisma.statuses.upsert({
        where: { statusId: status.statusId },
        update: {},
        create: status,
      });
    }

    // Insert UserRoles
    for (const role of userRoles) {
      await prisma.userRoles.upsert({
        where: { roleId: role.roleId },
        update: {},
        create: role,
      });
    }

    // Insert Admin Users
    for (const user of users) {
      await prisma.users.upsert({
        where: { userId: user.userId },
        update: {},
        create: user,
      });
    }

    // Insert Admin Users Roles
    for (const userRole of userRolesAdmin) {
      await prisma.userRolesOnUsers.upsert({
        where: {
          userId_roleId: {
            userId: userRole.userId,
            roleId: userRole.roleId,
          },
        },
        update: {},
        create: userRole,
      });
    }
    console.log("Predefined data seeded successfully");
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

seedPredefinedData();
