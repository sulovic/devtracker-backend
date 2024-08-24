const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();
const checkUserRole = require("../middleware/checkUserRole");
const { minRoles } = require("../config/minRoles");

router.get("/", checkUserRole(minRoles.products.get), async (req, res) => {
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

    const products = await prisma.products.findMany({
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

router.get("/:id", checkUserRole(minRoles.products.get), async (req, res) => {
  try {
    const id = parseInt(req?.params?.id);

    const product = await prisma.products.findUnique({
      where: {
        productId: id,
      },
    });
    if (!product) {
      return res.status(404).json({ error: "Resource not found" });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

router.post("/", checkUserRole(minRoles.products.post), async (req, res) => {
  try {
    const newProduct = req?.body;

    if (!newProduct) {
      return res.status(400).json({ error: "No user data is sent" });
    }

    const product = await prisma.products.create({ data: newProduct });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

router.put("/:id", checkUserRole(minRoles.products.put), async (req, res) => {
  try {
    const id = parseInt(req?.params?.id);

    const product = await prisma.products.update({
      where: {
        productId: id,
      },
      data: req?.body,
    });

    if (!product) {
      return res.status(404).json({ error: "Resource not found" });
    }

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

router.delete("/:id", checkUserRole(minRoles.products.delete), async (req, res) => {
  try {
    const id = parseInt(req?.params?.id);

    //Check for resource before deletion

    const existingProduct = await prisma.products.findUnique({
      where: {
        productId: id,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    //Delete if exists

    const deletedProduct = await prisma.products.delete({
      where: {
        productId: id,
      },
    });

    res.status(200).json(deletedProduct);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

module.exports = router;
