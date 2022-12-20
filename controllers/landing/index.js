import asyncHandler from "express-async-handler";
import bunyan from "bunyan";
import { dlog, log, stringify } from "../../custom_modules/index.js";
const logger = bunyan.createLogger({ name: "Landing Controller" });

// @desc        Home page
// @route       GET /
// @access      Public
export const landingPage = asyncHandler(async (req, res) => {
  logger.info(`GET /`);
  log(req.method);
  log(req.url);
  log(req.headers);

  try {
    req.flash("success_msg", "Hey there");
    res.render("home/home", {
      title: process.env.SITE_NAME || "RMT",
      signedin: false,
      landing: true,
      csrfToken: req.csrfToken,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      status: "failure",
      message: err.message,
      cause: err.stackTrace,
    });
  }
});

// @desc        Forgot password
// @route       GET /forgotpassword
// @access      Public
export const forgotPassword = asyncHandler(async (req, res) => {
  logger.info(`GET: /forgotpassword`);

  res.render("home/forgotpassword", {
    title: "Authenticate",
    signedin: false,
    forgotpassword: true,
  });
});

// @desc        Reset password
// @route       GET /resettpassword
// @access      Public
export const resetPassword = asyncHandler(async (req, res) => {
  logger.info(`GET: /forgotpassword`);

  const { email } = req.params;

  res.render("home/resetpassword", {
    title: "Reset Password",
    email,
    signedin: false,
    resetpassword: true,
  });
});
