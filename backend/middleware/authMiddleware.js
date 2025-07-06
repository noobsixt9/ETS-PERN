import JWT from "jsonwebtoken";

export const userAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({
      status: "Failed",
      message: "Authentication failed: No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = JWT.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId };
    next();
  } catch (error) {
    res.status(401).json({
      status: "Failed",
      message: "Authentication failed: Invalid token",
    });
  }
}; 