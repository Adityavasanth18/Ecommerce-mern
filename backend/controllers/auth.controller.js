// backend/controllers/auth.controller.js
import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

// --- constants (semantics identical) ---
const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;
const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

// --- internal helpers (renamed for clarity; public API unchanged) ---
const mintTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const persistRefreshToken = async (userId, token) => {
  // Store user-scoped refresh token with 7-day TTL (same behavior)
  await redis.set(`refresh_token:${userId}`, token, "EX", SEVEN_DAYS_SEC);
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const cookieBase = {
    httpOnly: true,                      // XSS protection
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",                  // CSRF hardening
  };

  res.cookie(ACCESS_COOKIE, accessToken, {
    ...cookieBase,
    maxAge: FIFTEEN_MIN_MS,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieBase,
    maxAge: SEVEN_DAYS_MS,
  });
};

// --- controllers (exports match original names) ---

export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = mintTokens(user._id);
    await persistRefreshToken(user._id, refreshToken);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = mintTokens(user._id);
      await persistRefreshToken(user._id, refreshToken);
      setAuthCookies(res, accessToken, refreshToken);

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    return res.status(400).json({ message: "Invalid email or password" });
  } catch (error) {
    console.log("Error in login controller", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const rt = req.cookies[REFRESH_COOKIE];
    if (rt) {
      const decoded = jwt.verify(rt, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }

    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// refreshes the access token (export name preserved)
export const refreshToken = async (req, res) => {
  try {
    const rt = req.cookies[REFRESH_COOKIE];

    if (!rt) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(rt, process.env.REFRESH_TOKEN_SECRET);
    const stored = await redis.get(`refresh_token:${decoded.userId}`);

    if (stored !== rt) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: FIFTEEN_MIN_MS,
    });

    return res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    return res.json(req.user);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
