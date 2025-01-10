const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  //   console.log("token", token);

  if (!token) {
    return res.status(401).send({ error: "Access denied. No token provided." });
  }
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.id = id;
    next();
  } catch (ex) {
    res.status(400).send({ error: "Invalid token." });
  }
};

module.exports = authMiddleware;
