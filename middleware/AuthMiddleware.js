import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import bunyan from "bunyan";
import { log } from "../custom_modules/index.js";
import User from "../models/UserModel.js";

const logger = bunyan.createLogger({ name: "AuthMiddleware" });

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      // @ts-ignore
      req.user = await User.findById(decoded.id).select("-password");
    } catch (err) {
      console.log(err.message);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  next();
});

export const signedIn = asyncHandler(async (req, res, next) => {
  logger.info(`signedIn`);
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/");
  }
});

export const signedOut = asyncHandler(async (req, res, next) => {
  logger.info(`signedOut`);
  if (!req.isAuthenticated()) {
    next();
  } else {
    log(`Landing Page - signed in`);
    res.redirect("/user");
  }
});

export const reauthorize = asyncHandler(async (req, res, next) => {
  logger.info(`reauthorize`);
  if (req.isAuthenticated()) {
    const user = req.user.withoutPassword();

    res.render("auth/signin", {
      title: "Reauthenticate",
      reauthenticate: true,
      user: req.user.withoutPassword(),
      csrfToken: req.csrfToken,
    });
  } else {
    res.redirect("/auth/signin");
  }
});
