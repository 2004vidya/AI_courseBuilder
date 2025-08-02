const jwt = require("jsonwebtoken");

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }
      
      // Add user info to request
      req.user = decodedToken;
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

