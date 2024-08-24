const jwt = require("jsonwebtoken");

const checkUserRole =
  (minRole = 5000) =>
  async (req, res, next) => {
    try {
      const authHeader = req?.headers?.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized - Missing Authorization Header" });
      }

      const accessToken = authHeader.split(" ")[1];

      if (!accessToken) {
        return res.status(401).json({ error: "Unauthorized - Missing Access Token" });
      }

      const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

      // Verify minimum role condition

      if (decodedAccessToken?.user?.roleId < minRole) {
        return res.status(403).json({ error: "Forbidden - Insufficient privileges" });
      }

      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Unauthorized - Invalid Access Token" });
      } else if (error.name === "TokenExpiredError") {
        return res.status(403).json({ error: "Unauthorized - Access Token Expired" });
      } else {
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

module.exports = checkUserRole;
