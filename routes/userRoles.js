const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();
const checkUserRole = require("../middleware/checkUserRole");
const { minRoles } = require("../config/minRoles");

router.get("/", checkUserRole(minRoles.userRoles.get), async (req, res) => {
  try {
    // Get query params

    const queryParams = req?.query;
    const { sortBy, sortOrder, limit, page, ...filters } = queryParams;
    const take = limit ? parseInt(limit) : undefined;
    const skip = page && limit ? (parseInt(page) - 1) * parseInt(limit) : undefined;
    const orderBy =
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : undefined;

    const filter = {};

    for (const key in filters) {
      const value = filters[key];
      const values = value.split(",");
      filter[key] = { in: values };
    }

    const products = await prisma.userRoles.findMany({
      where: filter,
      orderBy,
      take,
      skip,
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

module.exports = router;