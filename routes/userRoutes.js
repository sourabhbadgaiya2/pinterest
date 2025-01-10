const express = require("express");
const User = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const passport = require("passport");

const router = express.Router();

// google auth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const user = req.user;
      const email = user.emails[0].value;
      const image = user.photos[0].value;
      const name = user.displayName;

      let existingUser = await User.findOne({ email });

      if (!existingUser) {
        // Create new user if not found
        existingUser = new User({
          name,
          email,
          image,
        });
        console.log("New Google User Created:", existingUser);
        await existingUser.save();
      }

      // Generate JWT token
      const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Set the cookie
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
      });

      res.redirect("/home");
    } catch (error) {
      console.error("Error during Google authentication:", error);
      res.redirect("/?error=auth_failed");
    }
  }
);

// Login route GET
router.get("/", (req, res) => {
  res.render("index", { title: "login" });
});

// Login route POST
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log(email, password); // This will log the form data
    const existUser = await User.findOne({ email });
    if (!existUser) {
      return res.status(400).send("User does not exists.");
    }
    // hash the password before saving it to the database
    const comparePassword = await bcrypt.compare(password, existUser.password);

    if (!comparePassword) {
      return res.status(400).send("Invalid credentials.");
    }

    const token = jwt.sign({ id: existUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.redirect("/home");
    // res.json({ message: "User logged in successfully.", token, existUser });
  } catch (error) {
    console.log(error.message);
    res.status(400).send("Error in registration. Please try again.");
  }
});

// register route GET
router.get("/register", (req, res) => {
  res.render("register", { title: "register" });
});

// register route POST
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    console.log(name, email, password); // This will log the form data
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).send("User already exists.");
    }
    // hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    res.status(400).send("Error in registration. Please try again.");
  }
});

// Logout route GET
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// Home route GET
router.get("/home", authMiddleware, (req, res) => {
  res.render("home", { title: "Home" });
});
// Profile route GET
router.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.id);
  // console.log("profile", user);
  res.render("profile", { title: "Profile", user });
});

// Create Post route GET
router.get("/create", authMiddleware, (req, res) => {
  res.render("create", { title: "Create Post" });
});

module.exports = router;
