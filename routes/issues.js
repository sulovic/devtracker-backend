const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();
const checkUserRole = require("../middleware/checkUserRole");
const checkUserIssuePermissions = require("../middleware/checkUserIssuePermissions");
const { minRoles } = require("../config/minRoles");

router.get("/", checkUserRole(minRoles.issues.get), async (req, res, next) => {
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

    const issues = await prisma.issues.findMany({
      where: filter,
      orderBy,
      take,
      skip,
      select: {
        issueId: true,
        issueName: true,
        issueDesc: true,
        createdAt: true,
        closedAt: true,
        users: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        types: {
          select: {
            typeId: true,
            typeName: true,
          },
        },
        statuses: {
          select: {
            statusId: true,
            statusName: true,
          },
        },
        comments: {
          select: {
            commentId: true,
            commentText: true,
            createdAt: true,
            issueId: true,
            users: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            documents: {
              select: {
                documentId: true,
                documentUrl: true,
              },
            },
          },
        },
        products: {
          select: {
            productId: true,
            productName: true,
          },
        },
        priority: {
          select: {
            priorityId: true,
            priorityName: true,
          },
        },
      },
    });
  
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

router.get("/:id", checkUserRole(minRoles.issues.get), async (req, res) => {
  try {
    const id = parseInt(req?.params?.id);

    const issue = await prisma.issues.findUnique({
      where: {
        issueId: id,
      },
      select: {
        issueId: true,
        issueName: true,
        issueDesc: true,
        createdAt: true,
        closedAt: true,
        users: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        types: {
          select: {
            typeId: true,
            typeName: true,
          },
        },
        statuses: {
          select: {
            statusId: true,
            statusName: true,
          },
        },
        comments: {
          select: {
            commentId: true,
            commentText: true,
            createdAt: true,
            issueId: true,
            users: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            documents: {
              select: {
                documentId: true,
                documentUrl: true,
              },
            },
          },
        },
        products: {
          select: {
            productId: true,
            productName: true,
          },
        },
        priority: {
          select: {
            priorityId: true,
            priorityName: true,
          },
        },
      },
    });
    if (!issue) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // implement checkUserIssuePermissions


    res.status(200).json(issue);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

router.post("/", checkUserRole(minRoles.issues.post), async (req, res) => {
  try {
    const newIssue = req?.body;

    if (!newIssue) {
      return res.status(400).json({ error: "No user data is sent" });
    }

    const issue = await prisma.issues.create({
      data: {
        issueName: newIssue?.issueName,
        issueDesc: newIssue?.issueDesc,
        createdAt: newIssue?.createdAt,
        users: {
          connect: {
            userId: newIssue?.users?.userId,
          },
        },
        types: {
          connect: {
            typeId: newIssue?.types?.typeId,
          },
        },
        statuses: {
          connect: {
            statusId: newIssue?.statuses?.statusId,
          },
        },
        products: {
          connect: {
            productId: newIssue?.products?.productId,
          },
        },
        priority: {
          connect: {
            priorityId: newIssue?.priority?.priorityId,
          },
        },
      },
    });
    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

router.put("/:id", checkUserRole(minRoles.issues.put), async (req, res) => {
  try {
    const id = parseInt(req?.params?.id);

    const issue = await prisma.issues.update({
      where: {
        issueId: id,
      },
      data: req?.body,
    });

    if (!issue) {
      return res.status(404).json({ error: "Resource not found" });
    }

    res.status(200).json(issue);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

router.delete("/:id", checkUserRole(minRoles.issues.delete), async (req, res) => {
  try {
    const id = parseInt(req?.params?.id);

    //Check for resource before deletion

    const existingIssue = await prisma.issues.findUnique({
      where: {
        issueId: id,
      },
    });

    if (!existingIssue) {
      return res.status(404).json({ error: "Product not found" });
    }

    //Delete if exists

    const deletedIssue = await prisma.issues.delete({
      where: {
        issueId: id,
      },
    });

    res.status(200).json(deletedIssue);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

module.exports = router;
