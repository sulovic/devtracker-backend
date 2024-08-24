const jwt = require("jsonwebtoken");

const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized - Missing Authorization Header" });
    }

    const accessToken = authHeader.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized - Missing Access Token" });
    }

    // Verify the accessToken signature

    const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    req.user = decodedAccessToken;

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

module.exports = verifyAccessToken;
