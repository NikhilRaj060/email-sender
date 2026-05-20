const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ errorMessage: "Unauthorized acsess" });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRECT_KEY);
    req.currentUserId = decode.userId;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ errorMessage: "Unauthorized acsess, Invalid Token" });
  }
};

module.exports = verifyToken;
