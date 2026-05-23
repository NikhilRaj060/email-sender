const UserModel = require("../models/User");
const bycrpt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ─── Token helpers ────────────────────────────────────────────────────────────
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRECT_KEY, { expiresIn: "2m" });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId, type: "refresh" }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

// ─── Register ─────────────────────────────────────────────────────────────────
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!email || !name || !password || !confirmPassword) {
      return res.status(400).json({ errorMessage: "Bad Request" });
    }

    if (confirmPassword !== password) {
      return res
        .status(400)
        .json({ errorMessage: "Password and confirm password must match!" });
    }

    const isExistingUser = await UserModel.findOne({ email });
    if (isExistingUser) {
      return res
        .status(400)
        .json({ errorMessage: "User already exist with this email!" });
    }

    const hashedPassword = await bycrpt.hash(password, 10);
    const userData = new UserModel({ name, email, password: hashedPassword });
    const result = await userData.save();

    if (result) {
      res.json({ message: "Register user successfully" });
    } else {
      res.status(500).json({ errorMessage: "Something went wrong while registering" });
    }
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ errorMessage: "Bad Request" });
    }

    const userDetails = await UserModel.findOne({ email });
    if (!userDetails) {
      return res
        .status(400)
        .json({ errorMessage: "User doesn't exist, Please Register." });
    }

    const isPasswordMatch = await bycrpt.compare(password, userDetails.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ errorMessage: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(userDetails._id);
    const refreshToken = generateRefreshToken(userDetails._id);

    return res.json({
      message: "User logged in successfully",
      name: userDetails.name,
      accessToken,
      refreshToken,
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ errorMessage: "Refresh token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ errorMessage: "Invalid or expired refresh token" });
    }

    if (decoded.type !== "refresh") {
      return res.status(401).json({ errorMessage: "Invalid token type" });
    }

    // Verify user still exists
    const user = await UserModel.findById(decoded.userId).select("name");
    if (!user) {
      return res.status(401).json({ errorMessage: "User not found" });
    }

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      name: user.name,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// Stateless — client just drops the tokens. Endpoint provided for future
// blocklist / Redis support without breaking the frontend contract.
const logoutUser = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser };
