const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users.js");

const maxAge = 3 * 24 * 60 * 60 * 1000; // 3 days

const createToken = (email, userId) => {
    return jwt.sign(
        { email, userId },
        process.env.JWT_SECRET,
        { expiresIn: maxAge }
    );
};

const cookieOptions = {
    httpOnly: true,
    maxAge,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};
// 🔹 SIGNUP CONTROLLER
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ username, email, password: hashedPassword });

    const token = createToken(email, user._id);

    res.cookie("jwt", token, cookieOptions);
    res.status(201).json({ user: { id: user._id, email: user.email, username: user.username } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// 🔹 LOGIN CONTROLLER
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = createToken(email, user._id);
        res.cookie("jwt", token, cookieOptions);

        res.status(200).json({ user: { id: user._id, email: user.email } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// 🔹 CHECK AUTH STATUS CONTROLLER
const checkAuth = async (req, res) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ isAuthenticated: false });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ isAuthenticated: false });
            }

            const user = await User.findById(decodedToken.userId);
            if (!user) {
                return res.status(401).json({ isAuthenticated: false });
            }

            return res.status(200).json({
                isAuthenticated: true,
                user: { id: user._id, email: user.email }
            });
        });
    } catch (error) {
        console.error("Check auth error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 🔹 LOGOUT CONTROLLER
const logout = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.status(200).json({ message: 'Logged out successfully' });
};

// ✅ Export controllers using CommonJS
module.exports = {
    signup,
    login,
    checkAuth,
    logout
};
