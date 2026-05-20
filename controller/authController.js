const UserModel = require("../models/User");
const bycrpt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if ((!email || !name || !password, !confirmPassword)) {
      return res.status(400).json({ errorMessage: "Bad Request" });
    }

    const isExistingUser = await UserModel.findOne({ email });

    if (confirmPassword !== password) {
      return res
        .status(400)
        .json({ errorMessage: "Paasword and confirm password is same!" });
    }

    if (isExistingUser) {
      return res
        .status(400)
        .json({ errorMessage: "User already exist with this email!" });
    }

    let hashedPassword = await bycrpt.hash(password, 10);

    const userData = new UserModel({
      name,
      email,
      password: hashedPassword,
    });

    const result = await userData.save();

    if (result) {
      res.json({ message: "Resgister user sucessfully" });
    } else {
      res
        .status(500)
        .json({ errorMessage: "Something went wrong while registering" });
    }
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ errorMessage: "Bad Request" });
    }

    let userDetails = await UserModel.findOne({ email });

    if (!userDetails) {
      return res
        .status(400)
        .json({ errorMessage: "User doesn't exist, Please Register." });
    }

    //JWT implementation

    let token = jwt.sign(
      { userId: userDetails._id },
      process.env.JWT_SECRECT_KEY,
      { expiresIn: "600h" },
    );

    let isPassowordMatch = await bycrpt.compare(
      password,
      userDetails?.password,
    );

    if (!isPassowordMatch) {
      return res.status(500).json({ errorMessage: "Invalid credentials" });
    }

    return res.json({
      message: "User loggedin sucessfully",
      name: userDetails?.name,
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser };
