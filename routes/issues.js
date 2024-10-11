const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../prisma/client");
const prisma = new PrismaClient();
const checkUserRole = require("../middleware/checkUserRole");
const { minRoles } = require("../config/minRoles");
const { errorLogger } = require("../middleware/logger");



router.get("/", checkUserRole(minRoles.issues.get), async (req, res, next) => {
  try {
    const queryParams = req?.query;
    const { sortBy, sortOrder, limit, page, search, ...filters } = queryParams;
    const take = limit ? parseInt(limit) : undefined;
    const skip = page && limit ? (parseInt(page) - 1) * parseInt(limit) : undefined;
    const orderBy =
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : undefined;

    const createCondition = (key, value) => {
      const values = value.split(",").map(Number);
      return values.length === 1 ? { [key]: values[0] } : { [key]: { in: values } };
    };

    const andConditions = [];
    const andKeys = ["statusId", "priorityId", "typeId", "productId"];

    const orConditions = [];
    const orKeys = ["userId", "respRoleId"];

    andKeys.forEach((key) => {
      if (filters[key]) {
        andConditions.push(createCondition(key, filters[key]));
      }
    });

    orKeys.forEach((key) => {
      if (filters[key]) {
        orConditions.push(createCondition(key, filters[key]));
      }
    });

    if (search) {
      andConditions.push({
        OR: [
          { issueName: { contains: search } },
          { issueDesc: { contains: search } },
        ],
      });
    }

    const whereClause = {
      AND: andConditions.length > 0 ? andConditions : undefined,
      OR: orConditions.length > 0 ? orConditions : undefined,
    };

    const issues = await prisma.issues.findMany({
      where: whereClause,
      orderBy,
      take,
      skip,
      select: {
        issueId: true,
        issueName: true,
        issueDesc: true,
        createdAt: true,
        closedAt: true,
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        type: {
          select: {
            typeId: true,
            typeName: true,
          },
        },
        status: {
          select: {
            statusId: true,
            statusName: true,
          },
        },
        product: {
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
        respRole: {
          select: {
            roleId: true,
            roleName: true,
          },
        },
      },
    });

    const issuesCount = await prisma.issues.count({ where: whereClause });

    res.status(200).json({ data: issues, count: issuesCount });
  } catch (error) {
    errorLogger(err, req);
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
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        type: {
          select: {
            typeId: true,
            typeName: true,
          },
        },
        status: {
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
            user: {
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
        product: {
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
        respRole: {
          select: {
            roleId: true,
            roleName: true,
          },
        },
        statusHistory: {
          select: {
            createdAt: true,
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            status: {
              select: {
                statusId: true,
                statusName: true,
              },
            },
            respRole: {
              select: {
                roleId: true,
                roleName: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ error: "Resource not found" });
    }

    //Check user permissions - Issue Creator or Admin or authUser.role === issue.respRole

    if (req?.authUser?.userId !== issue?.user?.userId && !req?.authUser?.roles?.some((role) => role?.userRole?.roleId > 5000) && !req?.authUser?.roles?.some((role) => role?.userRole?.roleId === issue?.respRole?.roleId)) {
      return res.status(403).json({ error: "Forbidden - Insufficient privileges" });
    }

    res.status(200).json(issue);
  } catch (err) {
    errorLogger(err, req);
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

    //Check user permissions - Creator

    if (!req?.authUser?.roles?.some((role) => role?.userRole?.roleId === 1001)) {
      return res.status(403).json({ error: "Forbidden - Insufficient privileges" });
    }

    const issue = await prisma.issues.create({
      data: {
        issueName: newIssue?.issueName,
        issueDesc: newIssue?.issueDesc,
        createdAt: newIssue?.createdAt,
        user: {
          connect: {
            userId: newIssue?.user?.userId,
          },
        },
        type: {
          connect: {
            typeId: newIssue?.type?.typeId,
          },
        },
        status: {
          connect: {
            statusId: newIssue?.status?.statusId,
          },
        },
        priority: {
          connect: {
            priorityId: newIssue?.priority?.priorityId,
          },
        },
        respRole: {
          connect: {
            roleId: newIssue?.respRole?.roleId,
          },
        },
        statusHistory: {
          create: {
            status: {
              connect: {
                statusId: newIssue?.status?.statusId,
              },
            },
            user: {
              connect: {
                userId: newIssue?.user?.userId,
              },
            },
            respRole: {
              connect: {
                roleId: newIssue?.respRole?.roleId,
              },
            },
          },
        },
      },
    });
    res.status(201).json(issue);
  } catch (err) {
    errorLogger(err, req);
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
    const updatedIssue = req?.body;

    //Get data needed to check permissions

    const existingIssue = await prisma.issues.findUnique({
      where: {
        issueId: id,
      },
      select: {
        status: {
          select: {
            statusId: true,
            statusName: true,
          },
        },
        user: {
          select: {
            userId: true,
          },
        },
        respRole: {
          select: {
            roleId: true,
          },
        },
      },
    });

    if (!existingIssue) {
      return res.status(404).json({ error: "Resource not found" });
    }

    //Check if status is not Closed

    if (existingIssue?.status?.statusName === "Closed") {
      return res.status(403).json({ error: "Forbidden - Status is closed" });
    }

    //Check user permissions - Issue Creator or Admin or authUser.role === issue.respRole

    if (req?.authUser?.userId !== existingIssue?.user?.userId && !req?.authUser?.roles?.some((role) => role?.userRole?.roleId === 5001) && !req?.authUser?.roles?.some((role) => role?.userRole?.roleId === existingIssue?.respRole?.roleId)) {
      return res.status(403).json({ error: "Forbidden - Insufficient privileges" });
    }

    //Checks passed, updating issue

    const issue = await prisma.issues.update({
      where: {
        issueId: id,
      },
      data: {
        issueName: updatedIssue?.issueName,
        issueDesc: updatedIssue?.issueDesc,
        type: {
          connect: {
            typeId: updatedIssue?.type?.typeId,
          },
        },
        status: {
          connect: {
            statusId: updatedIssue?.status?.statusId,
          },
        },
        priority: {
          connect: {
            priorityId: updatedIssue?.priority?.priorityId,
          },
        },
        product: {
          connect: {
            productId: updatedIssue?.product?.productId,
          },
        },
        respRole: {
          connect: {
            roleId: updatedIssue?.respRole?.roleId,
          },
        },
      },
    });

    //Create status history if status has changed

    if (existingIssue?.status?.statusId !== updatedIssue?.status?.statusId) {
      await prisma.statusHistory.create({
        data: {
          status: {
            connect: {
              statusId: updatedIssue?.status?.statusId,
            },
          },
          issue: {
            connect: {
              issueId: id,
            },
          },
          user: {
            connect: {
              userId: req?.authUser?.userId,
            },
          },
          respRole: {
            connect: {
              roleId: updatedIssue?.respRole?.roleId,
            },
          },
        },
      });
    }

    res.status(200).json(issue);
  } catch (err) {
    errorLogger(err, req);
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
    errorLogger(err, req);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
});

module.exports = router;
