import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "dev-nba-jwt-secret";

function decodeToken(token) {
  return jwt.verify(token, jwtSecret);
}

export async function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  try {
    const payload = decodeToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || "viewer",
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function optionalAuth(req, _res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return next();
  }

  try {
    const payload = decodeToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || "viewer",
    };
  } catch {
    req.user = undefined;
  }

  next();
}
